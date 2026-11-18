// 몽복 페이지는 네이버 쿠키를 실어 치지직 API를 부를 수 없다(다른 출처).
// host_permissions를 가진 확장의 서비스 워커만 이 브라우저의 로그인 세션으로
// 호출할 수 있어, 조회를 여기서 대신하고 결과만 돌려준다.
// 쿠키 값 자체는 읽지도 전달하지도 않는다.

// 범용 프록시가 되지 않도록 채널 ID 형식을 고정하고 조회 경로도 하나로 제한
const CHANNEL_ID_RE = /^[0-9a-f]{32}$/;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // 이 확장의 content script가 보낸 메시지만 처리
  if (sender.id !== chrome.runtime.id) return;
  if (msg?.type !== "live-detail") return;

  if (typeof msg.channelId !== "string" || !CHANNEL_ID_RE.test(msg.channelId)) {
    sendResponse({ ok: false, error: "invalid-channel-id" });
    return;
  }

  fetch(
    `https://api.chzzk.naver.com/service/v3.2/channels/${msg.channelId}/live-detail`,
    { credentials: "include" }
  )
    .then(async (res) => {
      sendResponse({ ok: res.ok, status: res.status, body: await res.json() });
    })
    .catch((error) => {
      sendResponse({ ok: false, error: String(error) });
    });

  // 비동기 응답을 위해 메시지 채널을 열어 둔다
  return true;
});
