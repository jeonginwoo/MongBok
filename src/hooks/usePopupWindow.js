import { useEffect, useRef, useState } from "react";

// 스타일 노드를 대상 문서로 복제한다.
// emotion speedy 모드(프로덕션)에선 <style>의 textContent가 비고 규칙이 CSSOM에만 있으므로,
// sheet.cssRules를 읽어 텍스트로 복원해 빈 스타일이 복제되는 문제를 막는다.
function copyStyleNode(srcNode, destDoc) {
  if (srcNode.tagName === "LINK") {
    return srcNode.cloneNode(true);
  }
  const style = destDoc.createElement("style");
  for (const attr of srcNode.attributes) {
    style.setAttribute(attr.name, attr.value);
  }
  let css = srcNode.textContent || "";
  if (!css && srcNode.sheet) {
    try {
      css = Array.from(srcNode.sheet.cssRules)
        .map((r) => r.cssText)
        .join("");
    } catch {}
  }
  style.textContent = css;
  return style;
}

// 메인 문서의 스타일(<style>, <link rel="stylesheet">)을 팝업 문서로 복제
function cloneStyleNodes(srcHead, destHead) {
  const nodes = srcHead.querySelectorAll('style, link[rel="stylesheet"]');
  nodes.forEach((node) => {
    destHead.appendChild(copyStyleNode(node, destHead.ownerDocument));
  });
}

/**
 * 임의의 React 콘텐츠를 별도 창(window.open)으로 띄우기 위한 훅.
 * 메인 문서의 스타일을 복제하고, 런타임에 주입되는 MUI/emotion 스타일을 미러링한다.
 *
 * 닫기를 약간 지연시켜, 빠른 재마운트(React StrictMode의 개발 모드 이중 호출 등)면
 * 기존 창을 그대로 재사용한다 → 개발 중 "열림→닫힘→재열림"으로 인한 흰색 깜빡임 방지.
 *
 * @param {boolean} open  팝업 표시 여부
 * @param {() => void} onClose  창이 닫히거나 열기에 실패했을 때 호출 (atom 상태 동기화용)
 * @param {{ width?: number, height?: number, title?: string, fitContentWidth?: boolean, background?: string, colorScheme?: string }} [options]
 *   - fitContentWidth: 창 너비를 내부 콘텐츠 너비에 맞춘다(콘텐츠 폭이 바뀔 때만 보정).
 *   - background: 콘텐츠가 그려지기 전 잠깐 보이는 기본 배경색(흰색 깜빡임 방지).
 *   - colorScheme: 팝업 문서의 color-scheme("light"|"dark"). 브라우저 기본 배경을 앱 모드와 맞춤.
 * @returns {HTMLElement|null} portal 대상 컨테이너 (없으면 null)
 */
export function usePopupWindow(open, onClose, options = {}) {
  const {
    width = 720,
    height = 900,
    title = "MongBok",
    fitContentWidth = false,
    background = "",
    colorScheme = "",
  } = options;
  const [container, setContainer] = useState(null);
  // 재마운트 사이에 창/컨테이너/정리함수를 유지하기 위한 ref
  const winRef = useRef(null);
  const rootRef = useRef(null);
  const teardownRef = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // 직전 cleanup이 예약한 닫기가 있으면 취소 → 기존 창 재사용 (StrictMode 이중 마운트 대응)
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (winRef.current && !winRef.current.closed && rootRef.current) {
      setContainer(rootRef.current);
      return () => {
        if (teardownRef.current) {
          closeTimerRef.current = setTimeout(teardownRef.current, 150);
        }
      };
    }

    let win = null;
    let styleObserver = null;
    let sizeObserver = null;

    const handleWindowClose = () => onClose?.();

    // 메인 창이 새로고침/이탈할 때, 남아있는 팝업(끊긴 리모컨)을 같이 닫는다.
    const closePopupOnMainUnload = () => {
      if (win && !win.closed) {
        try {
          win.close();
        } catch {}
      }
    };
    window.addEventListener("pagehide", closePopupOnMainUnload);
    window.addEventListener("beforeunload", closePopupOnMainUnload);

    // 실제로 닫을 때만 호출되는 전체 정리 (지연 닫기 타이머가 살아남으면 실행됨)
    const teardown = () => {
      closeTimerRef.current = null;
      window.removeEventListener("pagehide", closePopupOnMainUnload);
      window.removeEventListener("beforeunload", closePopupOnMainUnload);
      if (styleObserver) styleObserver.disconnect();
      if (sizeObserver) sizeObserver.disconnect();
      if (win) {
        win.removeEventListener("pagehide", handleWindowClose);
        win.removeEventListener("beforeunload", handleWindowClose);
        if (!win.closed) {
          try {
            win.close();
          } catch {}
        }
      }
      if (winRef.current === win) winRef.current = null;
      rootRef.current = null;
      teardownRef.current = null;
      setContainer(null);
    };

    // 일반 팝업 창 (window.open) — 화면 우측에 배치
    const screenW = window.screen?.availWidth ?? window.innerWidth;
    const left = Math.max(0, screenW - width - 20);
    const top = 80;
    const w = window.open(
      "",
      "MongBokPopup",
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );
    if (!w) {
      console.warn("팝업 창이 차단되었습니다.");
      window.removeEventListener("pagehide", closePopupOnMainUnload);
      window.removeEventListener("beforeunload", closePopupOnMainUnload);
      onClose?.();
      return;
    }
    win = w;
    winRef.current = w;

    const doc = w.document;
    const bg = background ? `background:${background};` : "";
    // color-scheme을 앱 모드와 맞춰 브라우저 기본 배경(빈 문서)이 반대로 깜빡이지 않게 한다.
    const cs = colorScheme ? `color-scheme:${colorScheme};` : "";

    // 초기 문서를 직접 작성해 "첫 페인트부터" 올바른 배경/색구성표를 적용한다.
    doc.open();
    doc.write(
      `<!DOCTYPE html><html style="width:100%;height:100%;${cs}${bg}">` +
        `<head><meta charset="utf-8"><title>${title}</title></head>` +
        `<body style="margin:0;width:100%;height:100%;overflow:hidden;${cs}${bg}"></body>` +
        `</html>`
    );
    doc.close();

    cloneStyleNodes(window.document.head, doc.head);

    // MUI/emotion이 런타임에 메인 문서 head에 주입하는 스타일을 팝업으로 미러링
    styleObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const isStyle = node.tagName === "STYLE";
          const isLink = node.tagName === "LINK" && node.rel === "stylesheet";
          if (isStyle || isLink) {
            doc.head.appendChild(copyStyleNode(node, doc));
          }
        });
      }
    });
    styleObserver.observe(window.document.head, { childList: true });

    const root = doc.createElement("div");
    // fitContentWidth: 너비는 콘텐츠에 맞추고(max-content), 높이는 창 전체를 채움
    root.style.cssText = fitContentWidth
      ? "display:flex;width:max-content;height:100%;overflow:hidden;"
      : "width:100%;height:100%;overflow:hidden;";
    doc.body.appendChild(root);
    rootRef.current = root;

    // 사용자가 창을 직접 닫는 경우 상태 동기화
    w.addEventListener("pagehide", handleWindowClose);
    w.addEventListener("beforeunload", handleWindowClose);

    if (fitContentWidth) {
      // 콘텐츠 폭에 맞춰 창의 "내부 너비"를 단 한 번 보정한다(재적용 루프 없음 → 과확장/높이 변형 없음).
      // 너비만 변경(두 번째 인자 0)하므로 높이는 절대 건드리지 않는다.
      const BUFFER = 2;
      let fitTimer = null;
      const applyFit = () => {
        fitTimer = null;
        if (!win || win.closed) return;
        const contentWidth = Math.ceil(root.getBoundingClientRect().width);
        if (!contentWidth) return;
        const desiredInner = contentWidth + BUFFER;
        const delta = desiredInner - win.innerWidth;
        if (Math.abs(delta) <= 2) return;
        // 우측 끝 고정. 늘릴 땐 먼저 왼쪽 이동(우측 공간 확보) 후 확장 → 화면 끝 클램프 잘림 방지.
        // 줄일 땐 먼저 축소(우측 공간 생김) 후 우측 정렬.
        if (delta > 0) {
          win.moveBy(-delta, 0);
          win.resizeBy(delta, 0);
        } else {
          win.resizeBy(delta, 0);
          win.moveBy(-delta, 0);
        }
      };
      const scheduleFit = () => {
        if (!win || win.closed) return;
        if (fitTimer) w.clearTimeout(fitTimer);
        fitTimer = w.setTimeout(applyFit, 60);
      };

      const RO = w.ResizeObserver || ResizeObserver;
      sizeObserver = new RO(scheduleFit);
      sizeObserver.observe(root);
      scheduleFit();
    }

    teardownRef.current = teardown;
    setContainer(root);

    return () => {
      // 언마운트/재마운트 시 즉시 닫지 않고 지연. 빠른 재마운트면 위에서 타이머를 취소하고 재사용.
      if (teardownRef.current) {
        closeTimerRef.current = setTimeout(teardownRef.current, 150);
      }
    };
    // onClose는 안정적인 콜백으로 전달된다고 가정 (deps에서 제외하여 open 변화에만 반응)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return container;
}
