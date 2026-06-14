"use client";

import React, { useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { WarningAmber as WarningAmberIcon } from "@mui/icons-material";

import ManualArea from "@/components/ManualArea";
import ViewArea from "@/components/ViewArea";
import ControllerArea from "@/components/ControllerArea";
import SettingsArea from "@/components/SettingsArea";
import GlobalSnackbar from "@/components/Info/GlobalSnackbar";
import SettingChangeIndicator from "@/components/Info/SettingChangeIndicator";

import { useAtom, useAtomValue } from "jotai";
import { viewCountAtom } from "@/atoms/setting";
import { settingsOpenAtom, isSavingRecordingAtom, controllerPopupOpenAtom } from "@/atoms/ui";
import { usePopupWindow } from "@/hooks/usePopupWindow";

export default function App() {
  const viewCount = useAtomValue(viewCountAtom);
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);
  const isSavingRecording = useAtomValue(isSavingRecordingAtom);
  const [controllerPopupOpen, setControllerPopupOpen] = useAtom(controllerPopupOpenAtom);
  const theme = useTheme();
  const canvasRef = useRef(null);

  // 컨트롤러(+설정)를 리모컨처럼 별도 창으로 분리.
  // 너비는 내부 콘텐츠에 맞춰 자동 보정, 높이는 사용자가 자유롭게 조절.
  // 처음부터 콘텐츠 폭(펴기 컨트롤러 290 + 설정창 340)에 맞춰 열어 열릴 때 리사이즈/반짝임을 방지.
  const initialPopupWidth = 290 + (settingsOpen ? 340 : 0) + 2;
  const popupContainer = usePopupWindow(
    controllerPopupOpen,
    () => setControllerPopupOpen(false),
    {
      width: initialPopupWidth,
      height: 920,
      title: "MongBok 리모컨",
      fitContentWidth: true,
      background: theme.palette.background.paper,
      colorScheme: theme.palette.mode,
    }
  );

  // 팝업 문서를 타깃으로 하는 emotion 캐시.
  // 프로덕션의 emotion speedy 모드에선 스타일 규칙이 CSSOM에만 들어가 cloneNode로는 복제되지 않으므로,
  // 포털된 컨트롤러의 스타일을 팝업 head에 "직접" 삽입해 누락 없이 적용한다.
  const popupCache = useMemo(() => {
    if (!popupContainer) return null;
    return createCache({
      key: "mui-popup",
      container: popupContainer.ownerDocument.head,
    });
  }, [popupContainer]);

  /** 🧭 전체화면 */
  const fullscreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // 캔버스가 속한 문서(메인 창) 기준으로 처리. 리모컨 팝업에서 호출될 수 있으므로 방어적으로 작성.
    const doc = canvas.ownerDocument;
    try {
      if (doc.fullscreenElement) {
        doc.exitFullscreen?.();
        return;
      }
      // 팝업에서 호출된 경우 메인 창을 먼저 포커스 (활성화는 브라우저 정책에 따름)
      doc.defaultView?.focus();
      const result = canvas.requestFullscreen?.();
      if (result && typeof result.catch === "function") {
        result.catch((err) => console.warn("전체화면 전환 실패:", err));
      }
    } catch (err) {
      console.warn("전체화면 전환 실패:", err);
    }
  };

  // 📱 모바일 브라우저 100vh 높이 보정 로직
  useEffect(() => {
    const setScreenHeight = () => {
      const vh = window.innerHeight * 0.001;
      document.documentElement.style.setProperty("--vh", `${vh}rem`);
    };
    setScreenHeight();
    window.addEventListener("resize", setScreenHeight);
    return () => window.removeEventListener("resize", setScreenHeight);
  }, []);

  return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "calc(var(--vh, 1vh) * 100)",
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        {isSavingRecording && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              px: 2,
              py: 0.8,
              bgcolor: "warning.main",
              color: "warning.contrastText",
              flexShrink: 0,
            }}
          >
            <WarningAmberIcon sx={{ fontSize: "1.6rem" }} />
            <Typography sx={{ fontSize: "1.3rem", fontWeight: "bold" }}>
              녹화 파일 저장 중... 브라우저를 닫으면 녹화본이 훼손될 수 있습니다.
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {(viewCount > 0)
          ? <ViewArea canvasRef={canvasRef} fullscreen={fullscreen} />
          : <ManualArea />}
          {(() => {
            const controllerBlock = (
              <>
                <ControllerArea fullscreen={fullscreen} />
                {settingsOpen && <SettingsArea onClose={() => setSettingsOpen(false)} />}
              </>
            );
            // 팝업 창이 열려 있으면 컨트롤러+설정을 그 창으로 portal (jotai 상태는 공유되어 메인 창을 제어).
            // 팝업 전용 emotion 캐시로 감싸 스타일이 팝업 head에 직접 삽입되게 한다(프로덕션 누락 방지).
            return popupContainer && popupCache
              ? createPortal(
                  <CacheProvider value={popupCache}>{controllerBlock}</CacheProvider>,
                  popupContainer
                )
              : controllerBlock;
          })()}
          <GlobalSnackbar />
          <SettingChangeIndicator />
        </Box>
      </Box>
  );
}