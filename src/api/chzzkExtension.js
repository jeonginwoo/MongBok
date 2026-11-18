// 동반 브라우저 확장(chzzk-extension/)과의 통신 브리지.
// 치지직 19세 방송은 로그인 세션이 있어야 재생 정보가 내려오는데, 몽복 출처에서는
// 네이버 쿠키를 실을 수 없다. 확장이 브라우저의 기존 로그인으로 대신 조회해 주고,
// 여기서는 그 결과만 받는다 — 쿠키는 앱이 읽지도 저장하지도 않는다.
// 프로토콜 상수는 chzzk-extension/content.js와 짝을 이룬다.
const PAGE_SOURCE = "mongbok-page";
const EXT_SOURCE = "mongbok-chzzk-ext";

// content script는 document_start에 주입되어 즉시 응답하므로 짧게 잡는다
const PING_TIMEOUT = 500;
// 채널 갱신은 Promise.all로 묶여 있어 여기서 오래 기다리면 전체 갱신이 밀린다
const REQUEST_TIMEOUT = 5 * 1000;
// 미설치 판정 후 다시 확인하기까지의 간격
const PING_RETRY_INTERVAL = 30 * 1000;

let requestSeq = 0;

const request = (type, payload, timeout) =>
  new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }

    const requestId = `${Date.now()}-${++requestSeq}`;

    const cleanup = () => {
      clearTimeout(timerId);
      window.removeEventListener("message", onMessage);
    };
    const onMessage = (event) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const msg = event.data;
      if (msg?.source !== EXT_SOURCE || msg.requestId !== requestId) return;
      cleanup();
      resolve(msg);
    };
    const timerId = setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeout);

    window.addEventListener("message", onMessage);
    window.postMessage(
      { source: PAGE_SOURCE, type, requestId, ...payload },
      window.location.origin
    );
  });

// 설치 확인은 성공하면 페이지 수명 동안 유지한다. 실패는 잠깐만 기억한다 —
// 초기 로드 중 메인 스레드가 바빠 첫 ping이 타임아웃되면 설치돼 있는데도
// 새로고침 전까지 꺼진 채로 남기 때문. 미설치 환경에서 19세 채널을 갱신할
// 때마다 타임아웃을 기다리지 않도록 재확인 간격은 둔다.
let available = false;
let lastPingFailedAt = 0;
let pingPromise = null;
const isAvailable = async () => {
  if (available) return true;
  if (lastPingFailedAt && Date.now() - lastPingFailedAt < PING_RETRY_INTERVAL) {
    return false;
  }
  pingPromise ??= request("ping", {}, PING_TIMEOUT).then((res) => {
    available = !!res?.ok;
    if (!available) lastPingFailedAt = Date.now();
    pingPromise = null;
    return available;
  });
  return pingPromise;
};

// 로그인 세션으로 live-detail을 조회한다. 호출 측이 "확장 없음"과 "조회 실패"를
// 구분할 수 있어야 한다 — 실패를 미설치처럼 취급하면 일시 오류 한 번에 재생
// 중인 방송의 재생 정보가 비로그인 응답(null)으로 덮여 플레이어·채팅이 끊긴다.
//   { status: "unavailable" }      확장 미설치
//   { status: "failed" }           설치돼 있으나 조회 실패(타임아웃·확장 재로드 등)
//   { status: "ok", content }      조회 성공 (성인 미인증이면 content의 재생 정보는 비어 있음)
export const getChzzkLiveDetailViaExtension = async (channelId) => {
  if (!(await isAvailable())) return { status: "unavailable" };
  const res = await request("live-detail", { channelId }, REQUEST_TIMEOUT);
  const content = res?.ok ? res.body?.content : null;
  if (!content) return { status: "failed" };
  return { status: "ok", content };
};
