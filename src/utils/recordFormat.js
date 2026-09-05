// 녹화 컨테이너·코덱 표.
//
// 메인 스레드는 파일명 확장자를 정하는 데, 워커는 인코더를 설정하는 데 쓴다.
// 양쪽이 같은 표를 봐야 하므로 먹서 의존이 없는 이 파일로 분리했다 —
// 무거운 먹서 번들이 메인 청크에 딸려오지 않게 하는 목적도 겸한다.

// 코덱별 컨테이너 — H.264는 MP4, VP9/VP8은 WebM.
// H.264를 WebM에 담는 크롬 전용 비표준 조합(구 MediaRecorder 경로)은 쓰지 않는다.
// ffmpeg의 webm 먹서가 받지 않아 리먹싱조차 까다로웠던 원인이다
const CONTAINERS = {
  h264: "mp4",
  vp9: "webm",
  vp8: "webm",
};

// VideoEncoder 코덱 후보 — 앞에서부터 isConfigSupported로 검사한다.
// H.264는 해상도에 맞는 레벨이 필요해 높은 레벨부터 내려가고, VP9는 미지원 환경을
// 대비해 VP8까지 내려간다 (둘 다 WebM이라 확장자가 바뀌지 않는다)
export const VIDEO_CANDIDATES = {
  h264: [
    { codec: "avc1.640034", muxerCodec: "avc" }, // High 5.2
    { codec: "avc1.640033", muxerCodec: "avc" }, // High 5.1
    { codec: "avc1.64002A", muxerCodec: "avc" }, // High 4.2
    { codec: "avc1.640028", muxerCodec: "avc" }, // High 4.0
    { codec: "avc1.42E02A", muxerCodec: "avc" }, // Baseline 4.2
  ],
  vp9: [
    { codec: "vp09.00.10.08", muxerCodec: "V_VP9" },
    { codec: "vp8", muxerCodec: "V_VP8" },
  ],
  vp8: [{ codec: "vp8", muxerCodec: "V_VP8" }],
};

export const resolveContainer = (codec) => CONTAINERS[codec] || CONTAINERS.h264;

// 파일명 확장자는 코덱 설정만으로 정해진다 — 코덱 폴백이 컨테이너를 넘지 않게
// 후보를 짜 두었으므로, 화면 공유 권한을 받기 전에 확장자를 확정해도 안전하다
export const getRecordFileExtension = (codec) => resolveContainer(codec);

export const getRecordMimeType = (codec) =>
  resolveContainer(codec) === "mp4" ? "video/mp4" : "video/webm";

// 캡처 프레임을 직접 다루는 API는 아직 크로미움 계열에만 있다.
// 인코딩은 워커에서 하지만, 캡처 스트림을 만들어 넘기는 건 메인 스레드 몫이다
export const isRecordPipelineSupported = () =>
  typeof window !== "undefined" &&
  typeof window.Worker === "function" &&
  typeof window.VideoEncoder === "function" &&
  typeof window.MediaStreamTrackProcessor === "function";
