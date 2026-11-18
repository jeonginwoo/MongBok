// 페이지(몽복)와 확장 서비스 워커 사이의 중계.
// 확장 ID는 압축 해제 설치마다 달라져 페이지가 확장을 직접 호출할 수 없으므로,
// ID와 무관한 window.postMessage로 요청을 받아 넘긴다.
// 프로토콜 상수는 src/api/chzzkExtension.js와 짝을 이룬다.
const PAGE_SOURCE = "mongbok-page";
const EXT_SOURCE = "mongbok-chzzk-ext";

const reply = (requestId, payload) => {
  window.postMessage(
    { source: EXT_SOURCE, requestId, ...payload },
    window.location.origin
  );
};

window.addEventListener("message", async (event) => {
  // 같은 창·같은 출처의 메시지만 — 삽입된 iframe 등 다른 문맥의 요청은 무시
  if (event.source !== window || event.origin !== window.location.origin) return;
  const msg = event.data;
  if (msg?.source !== PAGE_SOURCE || !msg.requestId) return;

  // 확장이 갱신·재로드되면 이미 열린 탭의 content script는 확장과 끊긴다.
  // 페이지가 타임아웃까지 기다리지 않도록 즉시 실패를 알린다 (새로고침 시 복구)
  if (!chrome.runtime?.id) {
    reply(msg.requestId, { ok: false, error: "context-invalidated" });
    return;
  }

  if (msg.type === "ping") {
    reply(msg.requestId, {
      ok: true,
      version: chrome.runtime.getManifest().version,
    });
    return;
  }

  if (msg.type === "live-detail") {
    try {
      const res = await chrome.runtime.sendMessage({
        type: "live-detail",
        channelId: msg.channelId,
      });
      reply(msg.requestId, res ?? { ok: false, error: "no-response" });
    } catch (error) {
      reply(msg.requestId, { ok: false, error: String(error) });
    }
  }
});
