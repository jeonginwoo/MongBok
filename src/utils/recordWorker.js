// 녹화 인코딩 워커.
//
// 캡처 스트림 읽기·인코딩·먹싱·파일 쓰기를 전부 여기서 한다. 메인 스레드에서 돌렸을
// 때는 플레이어 4개의 렌더링에 밀려 영상과 오디오 리더가 동시에 굶었다 —
// 인코더 큐는 0인데 프레임이 도착을 안 해서 녹화본이 끊기고 싱크가 틀어졌다.
//
// 트랙이 아니라 MediaStreamTrackProcessor.readable을 넘겨받는다. 트랙을 옮기면
// 메인 스레드에서 track.stop()·onended·readyState를 쓸 수 없게 되기 때문이다.
// 파일도 writable이 아니라 FileSystemFileHandle을 받아 여기서 연다 (writable은
// 구조화 복제 대상이 아니라 넘길 수 없다).

import { createRecordPipeline } from "@/utils/recordPipeline";

let pipeline = null;

// 아직 닫히지 않은 세그먼트 파일들 (분할 순간에는 둘이 잠깐 겹친다).
// 메인 스레드의 브라우저 종료 경고가 이 개수를 본다
const openWritables = new Set();
// 지금 닫는 중인 파일 수 — 메인 스레드의 "저장 중" 배너 기준
let savingFiles = 0;

const postState = () => {
  self.postMessage({
    type: "state",
    openFiles: openWritables.size,
    savingFiles,
  });
};

const openWritable = async (fileHandle) => {
  if (!fileHandle) return null;
  const writable = await fileHandle.createWritable();
  openWritables.add(writable);
  postState();
  return writable;
};

// 내용이 들어가지 않은 세그먼트 파일은 abort로 버린다.
// 이미 처리된 writable이면 아무것도 하지 않는다 (이중 정리 방지)
const discardWritable = async (writable) => {
  if (!writable || !openWritables.has(writable)) return;
  openWritables.delete(writable);
  try {
    await writable.abort();
  } catch {
    // 이미 닫혔거나 abort를 지원하지 않는 경우
  }
  postState();
};

// 먹싱이 끝난 세그먼트 마무리. 인덱스(Cues/moov)는 파이프라인의 finalize()에서
// 이미 기록됐고, 여기서는 파일을 닫기만 한다
const completeSegment = async ({ fileName, writable, buffer }) => {
  if (writable) {
    if (!openWritables.has(writable)) return;
    savingFiles += 1;
    postState();
    try {
      await writable.close();
    } catch (e) {
      console.error("❌ [Record] 파일 스트림 닫기 오류:", e);
    }
    openWritables.delete(writable);
    savingFiles = Math.max(0, savingFiles - 1);
    postState();
    return;
  }

  // 폴백: 메모리 버퍼 → 메인 스레드가 다운로드시킨다 (워커에는 DOM이 없다)
  if (buffer?.byteLength) {
    self.postMessage({ type: "download", fileName, buffer }, [buffer]);
  }
};

const handleStart = async ({ videoReadable, audioReadable, options, segment }) => {
  let writable = null;
  try {
    writable = await openWritable(segment.fileHandle);
  } catch (e) {
    self.postMessage({
      type: "start-failed",
      message: `녹화 파일을 열 수 없습니다: ${e?.message || e}`,
    });
    return;
  }

  pipeline = createRecordPipeline({
    videoReadable,
    audioReadable,
    ...options,
    onSegmentComplete: completeSegment,
    onSegmentDiscarded: ({ writable: discarded }) => discardWritable(discarded),
    onError: (e) =>
      self.postMessage({ type: "error", message: e?.message || String(e) }),
  });

  try {
    const info = await pipeline.start({ writable, fileName: segment.fileName });
    self.postMessage({ type: "started", info });
  } catch (e) {
    // 인코더까지 만들어진 뒤 실패했을 수 있다 — 접고, 남은 파일은 버린다
    await pipeline.stop().catch(() => {});
    pipeline = null;
    await discardWritable(writable);
    self.postMessage({
      type: "start-failed",
      message: e?.message || String(e),
    });
  }
};

const handleRotate = async ({ segment }) => {
  if (!pipeline) return;

  let writable = null;
  try {
    writable = await openWritable(segment.fileHandle);
  } catch (e) {
    self.postMessage({
      type: "rotate-failed",
      message: e?.message || String(e),
    });
    return;
  }

  // 예약이 거부되면(이미 분할 대기 중) 방금 연 파일만 버리고 녹화는 계속한다
  if (!pipeline.rotate({ writable, fileName: segment.fileName })) {
    await discardWritable(writable);
    self.postMessage({
      type: "rotate-failed",
      message: "이미 분할이 진행 중입니다.",
    });
  }
};

const handleStop = async () => {
  const current = pipeline;
  pipeline = null;
  if (current) await current.stop();
  self.postMessage({ type: "stopped" });
};

const handleMessage = (message) => {
  switch (message?.type) {
    case "start":
      return handleStart(message);
    case "rotate":
      return handleRotate(message);
    case "stop":
      return handleStop();
    default:
      return undefined;
  }
};

// 메시지를 순차 처리한다 — 분할 예약과 종료가 겹쳐 세그먼트 상태가 꼬이지 않게
let queue = Promise.resolve();
self.onmessage = (event) => {
  queue = queue
    .then(() => handleMessage(event.data))
    .catch((e) => console.error("❌ [Record] 워커 처리 실패:", e));
};
