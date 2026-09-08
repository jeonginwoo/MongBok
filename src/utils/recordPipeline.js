// WebCodecs 기반 녹화 파이프라인 (워커 전용 — DOM을 건드리지 않는다).
//
// MediaRecorder는 라이브 스트리밍용 WebM을 뱉는다 — Segment duration이 unknown으로
// 남고 탐색 인덱스(Cues)가 아예 붙지 않아, 플레이어가 seek할 때 클러스터를 앞에서부터
// 스캔한다. 그래서 녹화본을 쓰려면 매번 ffmpeg 리먹싱을 거쳐야 했다.
//
// 여기서는 캡처 → VideoEncoder/AudioEncoder → 먹서를 직접 들고 있는다.
// FileSystemWritableFileStream은 seek을 지원하므로, 디스크 직접 스트리밍(메모리 누적
// 없음)을 유지한 채로 파일을 닫는 시점에 앞으로 되돌아가 인덱스와 duration을 써 넣을 수
// 있다. 덤으로 키프레임 시점을 직접 정할 수 있어 탐색 정밀도까지 손에 들어온다.
//
// 캡처 스트림 읽기는 반드시 워커에서 돌아야 한다. 메인 스레드에서 읽었을 때는 4개
// 플레이어 렌더링에 밀려 영상·오디오가 동시에 굶었고(입력 57fps → 44fps, 오디오
// 216청크 → 175청크), 인코더는 놀고 있는데 공급이 끊겨 끊김과 싱크 어긋남이 났다.

import {
  Muxer as WebmMuxer,
  ArrayBufferTarget as WebmArrayBufferTarget,
  FileSystemWritableFileStreamTarget as WebmFileStreamTarget,
} from "webm-muxer";
import {
  Muxer as Mp4Muxer,
  ArrayBufferTarget as Mp4ArrayBufferTarget,
  FileSystemWritableFileStreamTarget as Mp4FileStreamTarget,
} from "mp4-muxer";
import { VIDEO_CANDIDATES, resolveContainer } from "@/utils/recordFormat";

// 키프레임 간격(초) = 탐색 정밀도. MediaRecorder 시절에는 브라우저가 드문드문 넣어
// 인덱스가 있어도 점프할 수 있는 지점 자체가 적었다
const KEY_FRAME_INTERVAL_SEC = 2;

// 인코더가 밀릴 때 큐에 쌓아둘 최대 프레임 수. 넘으면 프레임을 버린다 —
// 큐가 무한히 자라 메모리를 먹는 것보다 몇 프레임 떨어뜨리는 편이 낫다.
// 너무 낮으면 일시적인 지연에도 프레임이 빠져 녹화본이 툭툭 끊긴다
const MAX_ENCODE_QUEUE = 30;

// 인코딩 처리량 로그 간격(ms). 끊김이 어디서 생기는지(캡처 입력 부족인지,
// 인코더 지연으로 우리가 버리는 것인지) 브라우저 콘솔로 구분하기 위한 계측
const STATS_INTERVAL_MS = 5000;

// 영상 기준시각(첫 영상 청크)이 잡히기 전에 도착한 오디오 청크를 모아두는 상한.
// 하드웨어 인코더 초기화는 보통 1초 미만 — 512청크(AAC 기준 약 11초)면 충분하고,
// 인코더가 첫 청크를 영영 못 뱉는 비정상 상황에서 무한히 쌓이는 것만 막는다
const PENDING_AUDIO_MAX = 512;

// 클럭 오프셋 표본 수집 시간(ms). 이 시간 동안 영상 프레임·오디오 데이터의
// (타임스탬프, 도착시각) 표본을 모아 최소 지연 기준으로 오프셋을 확정한다.
// 영상 인코더 초기화(실측 ~360ms)와 겹쳐 돌므로 체감 추가 지연은 거의 없다
const OFFSET_SETTLE_MS = 500;

// AAC 인코더가 스트림 앞에 붙이는 프라이밍(무음 워밍업) 샘플 수의 통용값.
// MP4에 이 정보를 실을 방법이 없어(mp4-muxer는 edit list 미지원) 그대로 두면
// 재생 시 소리 전체가 이 길이(48kHz 기준 44ms)만큼 늦어진다 — 타임스탬프를
// 앞당겨 상쇄한다. 실제 값이 인코더 구현마다 다를 수 있어(1024~2112) 체감이
// 남으면 이 값을 조정한다
const AAC_PRIMING_SAMPLES = 2112;

// 분할 후 이전 세그먼트를 꼬리 오디오 수신을 위해 열어두는 최대 시간(ms).
// 오디오가 침묵 등으로 끊겨도 이 시간이 지나면 닫는다
const CLOSING_SEGMENT_TIMEOUT_MS = 1000;

// 첫 샘플 대기 한도(ms). 화면 캡처는 정지 화면에서도 주기적으로 프레임을 주지만,
// 끝내 오지 않으면 무한 대기 대신 여기서 끊어 사용자에게 알린다
const FIRST_FRAME_TIMEOUT_MS = 15000;
const FIRST_AUDIO_TIMEOUT_MS = 3000;

// reader에서 첫 샘플 하나만 꺼낸다. 타임아웃으로 포기한 뒤 뒤늦게 도착하는 샘플은
// 직접 닫아준다 — VideoFrame/AudioData는 GC 대상이 아니라 명시적으로 풀어야 한다
const readFirstSample = async (reader, timeoutMs) => {
  const pending = reader.read();
  let timer = null;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  try {
    const result = await Promise.race([pending, timeout]);
    if (!result || result.done) {
      if (!result) pending.then((late) => late.value?.close()).catch(() => {});
      return null;
    }
    return result.value;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * 하나의 녹화 세션(= 하나의 화면 공유 스트림)을 담당하는 파이프라인.
 * 인코더는 세션 내내 하나로 유지되고, 출력 파일(세그먼트)만 분할 시 교체된다.
 *
 * @param videoReadable 메인 스레드에서 넘겨받은 MediaStreamTrackProcessor.readable
 * @param onSegmentComplete 먹싱이 끝난 세그먼트 전달. 파일 스트림을 닫거나(디스크
 *   직접 쓰기) 버퍼를 내려받는 것(메모리 폴백)은 호출자 몫이다 — 저장 중 표시를
 *   호출자가 들고 있기 때문
 * @param onSegmentDiscarded 한 번도 쓰이지 못한 예약 세그먼트 전달 (분할 대기 중 종료)
 */
export const createRecordPipeline = ({
  videoReadable,
  audioReadable,
  codec,
  videoBitsPerSecond,
  audioBitsPerSecond,
  frameRate,
  onSegmentComplete,
  onSegmentDiscarded,
  onError,
}) => {
  const container = resolveContainer(codec);

  let videoEncoder = null;
  let audioEncoder = null;
  let videoReader = null;
  let audioReader = null;
  let videoPump = null;
  let audioPump = null;

  let width = 0;
  let height = 0;
  let videoMuxerCodec = null;
  let audioTrackConfig = null; // 먹서에 넘길 { codec, numberOfChannels, sampleRate }
  // AAC 프라이밍 상쇄량(µs). AAC가 아닌 코덱은 0
  let audioPrimingUs = 0;

  // 오디오 클럭 → 영상 클럭 변환 오프셋(µs). 두 트랙의 타임스탬프 원점은 완전히
  // 다르다(실측 14일 이상 차이) — 도착 시각을 공통 기준으로 실측해서 잇는다.
  //
  // 처음에는 "첫 샘플 한 쌍"의 도착 시각으로 쟀는데, 이 방식은 두 첫 샘플의
  // 캡처→도착 지연이 대칭이라는 가정에 서 있다. readable을 워커로 transfer하면
  // 워커 기동 동안 중계 큐에 샘플이 쌓이는데, 그 묵은 정도가 트랙마다 달라
  // 비대칭이 그대로 상수 싱크 오차가 된다 — dev(워커 기동 느림)에서는 우연히
  // 대칭이라 4시간 검증을 통과했지만 프로덕션 번들에서는 소리가 수백 ms 앞섰다.
  //
  // 그래서 표본 여러 개의 "최소 지연"으로 추정한다: 지연(도착시각 − 타임스탬프)이
  // 가장 작은 표본이 가장 신선한 표본이고, 기동 백로그의 묵은 표본은 지연이 커서
  // min에서 자동 탈락한다. 잔여 오차는 두 경로의 최소 전달 지연 차이(±10ms대)
  let audioToVideoOffsetUs = 0;
  let offsetCommitted = false;
  let videoMinLagUs = Infinity;
  let audioMinLagUs = Infinity;
  // 진단용: 첫 샘플의 지연 — 확정 시 "첫 샘플 방식이었다면 얼마나 틀렸을지"를 로그로 남긴다
  let firstVideoLagUs = null;
  let firstAudioLagUs = null;
  let pipelineStartMs = 0;
  // 오프셋 확정 전에 도착한 오디오 (버리면 그 길이만큼 파일 앞이 무음이 된다)
  const pendingAudio = [];

  const sampleVideoLag = (timestampUs) => {
    const lag = performance.now() * 1000 - timestampUs;
    if (firstVideoLagUs === null) firstVideoLagUs = lag;
    if (lag < videoMinLagUs) videoMinLagUs = lag;
  };

  // 오디오 버킷의 마지막 샘플이 캡처된 뒤에야 도착할 수 있으므로 버킷 "끝" 시각
  // 기준으로 지연을 잰다 — 시작 시각(timestamp) 기준이면 버킷 길이만큼 오디오
  // 원점을 늦게 추정해 소리가 그만큼 늦게 배치된다
  let audioBucketUs = 0;
  const sampleAudioLag = (audioData) => {
    const bucketUs = audioData.duration || 0;
    if (audioBucketUs === 0) audioBucketUs = bucketUs;
    const lag = performance.now() * 1000 - (audioData.timestamp + bucketUs);
    if (firstAudioLagUs === null) firstAudioLagUs = lag;
    if (lag < audioMinLagUs) audioMinLagUs = lag;
  };

  // 표본이 충분해지면 오프셋을 확정한다. force는 초단편 녹화(표본 수집 시간보다
  // 짧게 끝난 경우)에서 모아둔 오디오를 버리지 않기 위한 종료 시 강제 확정
  const tryCommitOffset = (force = false) => {
    if (offsetCommitted) return;
    if (!audioEncoder) {
      offsetCommitted = true;
      return;
    }
    if (!Number.isFinite(videoMinLagUs) || !Number.isFinite(audioMinLagUs)) return;
    if (!force && performance.now() - pipelineStartMs < OFFSET_SETTLE_MS) return;

    audioToVideoOffsetUs = Math.round(audioMinLagUs - videoMinLagUs);
    offsetCommitted = true;

    const videoStaleMs = (firstVideoLagUs - videoMinLagUs) / 1000;
    const audioStaleMs = (firstAudioLagUs - audioMinLagUs) / 1000;
    console.info(
      `🔊 [Record] A/V 클럭 오프셋 확정 — 첫 샘플 묵은 정도 영상 ${videoStaleMs.toFixed(0)}ms · ` +
        `음성 ${audioStaleMs.toFixed(0)}ms, 첫 샘플 방식 대비 보정 ${(videoStaleMs - audioStaleMs).toFixed(0)}ms · ` +
        `버킷 ${(audioBucketUs / 1000).toFixed(1)}ms · 프라이밍 상쇄 ${(audioPrimingUs / 1000).toFixed(0)}ms`
    );
  };

  // 인코더는 decoderConfig(H.264 avcC · AAC AudioSpecificConfig 등)를 "첫 청크에만"
  // 실어 보낸다. 분할로 만든 새 먹서는 그걸 받은 적이 없어 그대로 두면 코덱 초기화
  // 정보가 빠진 파일이 나온다 — 첫 세그먼트만 재생되고 이후 분할본은 전부 재생 불가.
  // 캐시해뒀다가 세그먼트마다 첫 청크에 다시 실어준다
  let videoDecoderConfig = null;
  let audioDecoderConfig = null;

  let activeSegment = null;
  let pendingSegment = null;
  // 분할 직후, 늦게 도착하는 꼬리 오디오를 받기 위해 잠시 열어두는 이전 세그먼트.
  // 오디오는 인코더 버퍼링 탓에 영상보다 ~100ms 늦게 도착한다 — 교체 즉시 닫으면
  // 이전 파일 끝의 그만큼이 조용히 잘린다 (실측: 분할마다 5청크 ≈ 116ms 유실)
  let closingSegment = null;
  let closingTimer = null;
  let closingPromise = Promise.resolve();

  const finalizeClosingSegment = () => {
    if (!closingSegment) return;
    const segment = closingSegment;
    closingSegment = null;
    if (closingTimer) {
      clearTimeout(closingTimer);
      closingTimer = null;
    }
    closingPromise = completeSegment(segment).catch((e) =>
      console.error("❌ [Record] 분할 세그먼트 마무리 실패:", e)
    );
  };
  let forceKeyFrame = false;
  let lastKeyFrameUs = -Infinity;
  let stopped = false;
  let scaler = null;

  // 처리량 계측 — 구간마다 초기화한다. 입력이 적으면 캡처가 안 오는 것이고,
  // 입력은 많은데 인코딩이 적으면 우리가 버리고 있는 것이다
  let framesIn = 0;
  let framesEncoded = 0;
  let videoChunksOut = 0;
  let audioChunksIn = 0;
  let audioChunksOut = 0;
  let audioChunksDropped = 0;
  let droppedFrames = 0;
  let statsTimer = null;
  // 실행 전체 누계 — 유실이 "시작 직후 정상 버림"인지 진행 중 이상인지 구분용
  let audioChunksOutTotal = 0;
  let audioAnomalyWarns = 0;

  const logStats = () => {
    const seconds = STATS_INTERVAL_MS / 1000;
    const rate = (n) => (n / seconds).toFixed(1);
    console.info(
      `📊 [Record] 입력 ${rate(framesIn)}fps · 인코딩 ${rate(framesEncoded)}fps · ` +
        `먹싱 ${rate(videoChunksOut)}fps · 음성 ${audioChunksIn}→${audioChunksOut}청크 · ` +
        `음성버림 ${audioChunksDropped} · 누적 버림 ${droppedFrames} · 큐 ${videoEncoder?.encodeQueueSize ?? 0}`
    );
    framesIn = 0;
    framesEncoded = 0;
    videoChunksOut = 0;
    audioChunksIn = 0;
    audioChunksOut = 0;
    audioChunksDropped = 0;
  };

  const fail = (error) => {
    console.error("❌ [Record] 인코더 오류:", error);
    onError?.(error);
  };

  const createMuxer = (writable) => {
    if (container === "mp4") {
      return new Mp4Muxer({
        target: writable
          ? new Mp4FileStreamTarget(writable)
          : new Mp4ArrayBufferTarget(),
        // moov를 파일 끝에 쓴다 — 청크를 메모리에 모으지 않아 장시간 녹화에서도
        // 안전하고, 로컬 재생에는 선두 배치(faststart)가 필요 없다
        fastStart: false,
        // 세그먼트 기준 시각(startUs)을 우리가 이미 빼서 넘기므로 먹서의 0시작
        // 강제(strict)는 필요 없다. 오디오 첫 청크는 영상보다 조금 뒤라 0이 아닌데,
        // strict면 그걸 예외로 막아 오디오가 통째로 버려진다.
        // cross-track-offset은 트랙 공통 최솟값(= 영상의 0)을 빼므로 A/V 간격이 보존된다
        firstTimestampBehavior: "cross-track-offset",
        video: { codec: videoMuxerCodec, width, height },
        ...(audioTrackConfig ? { audio: { ...audioTrackConfig } } : {}),
      });
    }
    return new WebmMuxer({
      target: writable
        ? new WebmFileStreamTarget(writable)
        : new WebmArrayBufferTarget(),
      // MP4 쪽과 같은 이유 — webm-muxer에서는 permissive가 그 역할이다
      firstTimestampBehavior: "permissive",
      video: { codec: videoMuxerCodec, width, height, frameRate },
      ...(audioTrackConfig ? { audio: { ...audioTrackConfig } } : {}),
    });
  };

  const createSegment = ({ writable, fileName }) => ({
    muxer: createMuxer(writable),
    writable,
    fileName,
    // 이 세그먼트의 0초에 해당하는 캡처 시각(영상 클럭). 첫 영상 키프레임에서
    // 정해지고, 오디오도 클럭 오프셋을 거쳐 같은 기준을 쓴다
    startUs: null,
    // decoderConfig가 이 세그먼트의 먹서에 전달됐는지 (트랙별 첫 청크에서 주입)
    videoConfigWritten: false,
    audioConfigWritten: false,
    // 분할로 닫힐 때 채워지는 경계 시각(다음 세그먼트 첫 키프레임, 영상 클럭)
    endUs: null,
  });

  // 세그먼트 마무리. finalize()가 이 시점에 Cues(WebM)/moov(MP4)를 써 넣는다 —
  // 파일이 인덱싱되는 지점이 바로 여기이고, MediaRecorder에는 없던 단계다
  const completeSegment = async (segment) => {
    if (!segment) return;
    let buffer = null;
    try {
      segment.muxer.finalize();
      if (!segment.writable) buffer = segment.muxer.target.buffer;
    } catch (e) {
      console.error("❌ [Record] 먹싱 마무리 실패:", e);
    }
    await onSegmentComplete?.({
      fileName: segment.fileName,
      writable: segment.writable,
      buffer,
    });
  };

  const handleVideoChunk = (chunk, meta) => {
    if (meta?.decoderConfig) videoDecoderConfig = meta.decoderConfig;

    // 분할 대기 중이면 키프레임에서 세그먼트를 교체한다 — 새 파일이 항상
    // 키프레임으로 시작하므로 프레임 공백도, 앞부분 깨짐도 없다
    if (pendingSegment && chunk.type === "key") {
      const previous = activeSegment;
      activeSegment = pendingSegment;
      pendingSegment = null;
      // 직전 회전분이 아직 열려 있으면(1초 안에 연속 분할) 먼저 닫는다
      finalizeClosingSegment();
      previous.endUs = chunk.timestamp;
      if (audioEncoder) {
        // 꼬리 오디오가 경계를 넘어올 때까지 열어둔다 — handleAudioChunk가 닫는다
        closingSegment = previous;
        closingTimer = setTimeout(finalizeClosingSegment, CLOSING_SEGMENT_TIMEOUT_MS);
      } else {
        closingPromise = completeSegment(previous).catch((e) =>
          console.error("❌ [Record] 분할 세그먼트 마무리 실패:", e)
        );
      }
    }

    const segment = activeSegment;
    if (!segment) return;
    if (segment.startUs === null) segment.startUs = chunk.timestamp;
    const timestamp = chunk.timestamp - segment.startUs;
    if (timestamp < 0) return;
    let muxMeta = meta;
    if (!segment.videoConfigWritten && !meta?.decoderConfig && videoDecoderConfig) {
      muxMeta = { ...meta, decoderConfig: videoDecoderConfig };
    }
    try {
      segment.muxer.addVideoChunk(chunk, muxMeta, timestamp);
      segment.videoConfigWritten = true;
      videoChunksOut += 1;
    } catch (e) {
      console.error("❌ [Record] 영상 청크 먹싱 실패:", e);
    }

    // 기준시각과 오프셋이 모두 확정되면 모아둔 오디오를 제자리에 내보낸다 —
    // 키프레임 블록이 먼저 들어간 뒤라 컨테이너 순서도 자연스럽다
    tryCommitOffset();
    if (offsetCommitted && pendingAudio.length > 0) {
      const queued = pendingAudio.splice(0);
      for (const [pendingChunk, pendingMeta] of queued) {
        muxAudioChunk(segment, pendingChunk, pendingMeta);
      }
      console.info(
        `🔊 [Record] 오프셋 확정까지 모아둔 오디오 ${queued.length}청크 방출`
      );
    }
  };

  const muxAudioChunk = (segment, chunk, meta) => {
    // 실측 클럭 오프셋으로 영상 클럭에 맞춘 뒤 영상과 "같은" 세그먼트 기준시각을
    // 빼고, AAC면 프라이밍 지연을 앞당겨 상쇄한다. 같은 축을 쓰므로 분할
    // 경계에서도 싱크가 다시 어긋나지 않는다
    const timestamp =
      chunk.timestamp + audioToVideoOffsetUs - segment.startUs - audioPrimingUs;
    // 세그먼트 시작(첫 키프레임)보다 앞선 소리만 버려진다 — 녹화 시작에서는
    // 그 내용물이 곧 프라이밍 무음이고, 분할 경계에서는 수십 ms 수준이다.
    // 이미 먹싱이 진행된 뒤의 음수는 타임스탬프 역행 신호이므로 크기를 남긴다
    if (timestamp < 0) {
      audioChunksDropped += 1;
      if (audioChunksOutTotal > 0 && audioAnomalyWarns < 5) {
        audioAnomalyWarns += 1;
        console.warn(
          `⚠️ [Record] 진행 중 음성 청크 타임스탬프 역행 (${(timestamp / 1000).toFixed(1)}ms) — 버림`
        );
      }
      return;
    }
    let muxMeta = meta;
    if (!segment.audioConfigWritten && !meta?.decoderConfig && audioDecoderConfig) {
      muxMeta = { ...meta, decoderConfig: audioDecoderConfig };
    }
    try {
      segment.muxer.addAudioChunk(chunk, muxMeta, timestamp);
      segment.audioConfigWritten = true;
      audioChunksOut += 1;
      audioChunksOutTotal += 1;
    } catch (e) {
      console.error("❌ [Record] 음성 청크 먹싱 실패:", e);
    }
  };

  const handleAudioChunk = (chunk, meta) => {
    audioChunksIn += 1;
    if (meta?.decoderConfig) audioDecoderConfig = meta.decoderConfig;
    const segment = activeSegment;
    if (!segment) return;
    // 기준시각(첫 영상 청크)과 클럭 오프셋이 둘 다 확정되기 전의 오디오는
    // 모아뒀다가 제자리에 내보낸다 (EncodedAudioChunk는 close가 필요 없다).
    // 확정과 방출이 handleVideoChunk 안에서 동기로 일어나므로, 직행 청크가
    // 대기분을 앞지르는 일은 없다 — 트랙 내 단조성 유지
    if (segment.startUs === null || !offsetCommitted) {
      if (pendingAudio.length < PENDING_AUDIO_MAX) pendingAudio.push([chunk, meta]);
      else audioChunksDropped += 1;
      return;
    }

    if (closingSegment) {
      // 경계(새 세그먼트의 첫 키프레임) 이전 소리는 이전 파일의 꼬리다 —
      // muxAudioChunk의 배치 기준과 같은 식(프라이밍 포함)으로 비교한다
      if (
        chunk.timestamp + audioToVideoOffsetUs - audioPrimingUs <
        closingSegment.endUs
      ) {
        muxAudioChunk(closingSegment, chunk, meta);
        return;
      }
      // 오디오가 경계를 넘었다 — 꼬리가 다 들어왔으니 이전 파일을 닫는다
      finalizeClosingSegment();
    }
    muxAudioChunk(segment, chunk, meta);
  };

  // 프레임 크기를 인코더 설정에 맞춘다. 대부분은 크기가 같아 그대로 통과하고,
  // 홀수 해상도 보정처럼 1~2픽셀만 남는 경우는 visibleRect로 잘라낸다 —
  // 메타데이터만 바꾸므로 픽셀 복사가 없다. 매 프레임 캔버스로 그리면
  // 메인 스레드에서 복사가 일어나 60fps에서 프레임을 떨군다
  const fitFrame = (frame) => {
    if (frame.displayWidth === width && frame.displayHeight === height) {
      return frame;
    }
    if (frame.displayWidth >= width && frame.displayHeight >= height) {
      const cropped = new VideoFrame(frame, {
        visibleRect: { x: 0, y: 0, width, height },
      });
      frame.close();
      return cropped;
    }
    // 캡처 영역이 설정보다 작아진 경우(캔버스 리사이즈)에만 캔버스로 늘린다
    if (!scaler) {
      const canvas = new OffscreenCanvas(width, height);
      scaler = { canvas, ctx: canvas.getContext("2d", { alpha: false }) };
    }
    scaler.ctx.drawImage(frame, 0, 0, width, height);
    const scaled = new VideoFrame(scaler.canvas, {
      timestamp: frame.timestamp,
      ...(frame.duration ? { duration: frame.duration } : {}),
    });
    frame.close();
    return scaled;
  };

  const encodeFrame = (rawFrame) => {
    framesIn += 1;
    sampleVideoLag(rawFrame.timestamp);
    if (stopped || videoEncoder?.state !== "configured") {
      rawFrame.close();
      return;
    }
    // 인코더가 밀리면 버린다. 단 분할용 키프레임 요청은 버리지 않는다 —
    // 버리면 파일 교체가 그만큼 늦어진다
    if (videoEncoder.encodeQueueSize > MAX_ENCODE_QUEUE && !forceKeyFrame) {
      droppedFrames += 1;
      rawFrame.close();
      return;
    }

    let frame = rawFrame;
    try {
      frame = fitFrame(rawFrame);
      const keyFrame =
        forceKeyFrame ||
        frame.timestamp - lastKeyFrameUs >= KEY_FRAME_INTERVAL_SEC * 1e6;
      if (keyFrame) {
        lastKeyFrameUs = frame.timestamp;
        forceKeyFrame = false;
      }
      videoEncoder.encode(frame, { keyFrame });
      framesEncoded += 1;
    } catch (e) {
      console.error("❌ [Record] 영상 인코딩 실패:", e);
    } finally {
      frame.close();
    }
  };

  const encodeAudio = (audioData) => {
    sampleAudioLag(audioData);
    if (stopped || audioEncoder?.state !== "configured") {
      audioData.close();
      return;
    }
    try {
      audioEncoder.encode(audioData);
    } catch (e) {
      console.error("❌ [Record] 음성 인코딩 실패:", e);
    } finally {
      audioData.close();
    }
  };

  const pump = async (reader, handle) => {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (stopped) {
          value.close();
          break;
        }
        handle(value);
      }
    } catch (e) {
      if (!stopped) console.error("❌ [Record] 캡처 스트림 읽기 오류:", e);
    }
  };

  const probeVideoConfig = async () => {
    const candidates = VIDEO_CANDIDATES[codec] || VIDEO_CANDIDATES.h264;
    for (const candidate of candidates) {
      // 하드웨어 인코더를 우선 쓴다 — 1080p60 멀티뷰는 소프트웨어 인코딩으로
      // 감당하기 어려워 프레임을 떨군다
      for (const hardwareAcceleration of ["prefer-hardware", "no-preference"]) {
        const config = {
          codec: candidate.codec,
          width,
          height,
          bitrate: videoBitsPerSecond,
          framerate: frameRate,
          // 화면 캡처는 끊김 없이 계속 들어오는 실시간 소스다. quality 모드는
          // 프레임을 더 오래 물고 있어 큐가 쌓이고, 그만큼 우리가 버리게 된다
          latencyMode: "realtime",
          hardwareAcceleration,
          ...(candidate.muxerCodec === "avc" ? { avc: { format: "avc" } } : {}),
        };
        try {
          const support = await VideoEncoder.isConfigSupported(config);
          if (support?.supported) {
            return { config, muxerCodec: candidate.muxerCodec };
          }
        } catch {
          // 이 후보는 건너뛴다 — 전부 실패하면 호출부에서 오류로 처리
        }
      }
    }
    return null;
  };

  // 채널 수·샘플레이트는 트랙 설정값이 아니라 실제 첫 AudioData에서 읽는다.
  // 둘이 어긋나면 AudioEncoder가 설정 단계에서 터진다
  const probeAudioConfig = async (sample) => {
    // MP4의 표준은 AAC지만 인코딩을 지원하지 않는 환경이 있어 Opus로 내려간다
    // (mp4-muxer가 받아준다). WebM은 Opus 하나뿐
    const candidates =
      container === "mp4"
        ? [
            { codec: "mp4a.40.2", muxerCodec: "aac" },
            { codec: "opus", muxerCodec: "opus" },
          ]
        : [{ codec: "opus", muxerCodec: "A_OPUS" }];

    for (const candidate of candidates) {
      const config = {
        codec: candidate.codec,
        sampleRate: sample.sampleRate,
        numberOfChannels: sample.numberOfChannels,
        bitrate: audioBitsPerSecond,
      };
      try {
        const support = await AudioEncoder.isConfigSupported(config);
        if (support?.supported) {
          return { config, muxerCodec: candidate.muxerCodec };
        }
      } catch {
        // 이 후보는 건너뛴다 — 전부 실패하면 무음으로 녹화한다
      }
    }
    return null;
  };

  const start = async (firstSegment) => {
    if (!videoReadable) throw new Error("녹화할 영상 트랙이 없습니다.");

    videoReader = videoReadable.getReader();
    if (audioReadable) audioReader = audioReadable.getReader();

    // 인코더·먹서 설정에 실제 해상도와 채널 수가 필요하다. 트랙 설정값은 cropTo
    // 직후를 반영하지 못할 수 있어 첫 샘플에서 직접 읽는다. 클럭 오프셋은 여기서
    // 재지 않는다 — 파이프라인이 도는 동안 표본을 모아 최소 지연으로 확정한다
    const [firstFrame, firstAudio] = await Promise.all([
      readFirstSample(videoReader, FIRST_FRAME_TIMEOUT_MS),
      audioReader
        ? readFirstSample(audioReader, FIRST_AUDIO_TIMEOUT_MS)
        : Promise.resolve(null),
    ]);

    if (!firstFrame) {
      firstAudio?.close();
      throw new Error("화면 프레임을 받지 못해 녹화를 시작할 수 없습니다.");
    }

    // H.264는 짝수 해상도만 받는다
    width = Math.max(2, Math.floor(firstFrame.displayWidth / 2) * 2);
    height = Math.max(2, Math.floor(firstFrame.displayHeight / 2) * 2);

    const videoSupport = await probeVideoConfig();
    if (!videoSupport) {
      firstFrame.close();
      firstAudio?.close();
      throw new Error("이 브라우저가 지원하지 않는 녹화 코덱입니다.");
    }
    videoMuxerCodec = videoSupport.muxerCodec;

    if (firstAudio) {
      const audioSupport = await probeAudioConfig(firstAudio);
      if (audioSupport) {
        audioTrackConfig = {
          codec: audioSupport.muxerCodec,
          numberOfChannels: audioSupport.config.numberOfChannels,
          sampleRate: audioSupport.config.sampleRate,
        };
        if (audioSupport.muxerCodec === "aac") {
          audioPrimingUs = Math.round(
            (AAC_PRIMING_SAMPLES / audioSupport.config.sampleRate) * 1e6
          );
        }
        audioEncoder = new AudioEncoder({ output: handleAudioChunk, error: fail });
        audioEncoder.configure(audioSupport.config);
      } else {
        console.warn(
          "⚠️ [Record] 오디오 인코더를 설정할 수 없어 무음으로 녹화합니다."
        );
      }
    } else {
      // 여기까지 오면 녹화본에 소리가 없다 — 원인을 콘솔에서 바로 구분할 수 있게 남긴다
      console.warn(
        audioReadable
          ? "⚠️ [Record] 오디오 트랙에서 데이터를 받지 못했습니다 — 무음으로 녹화합니다."
          : "⚠️ [Record] 공유에 오디오가 포함되지 않았습니다 (탭 오디오 공유 미체크?) — 무음으로 녹화합니다."
      );
    }

    videoEncoder = new VideoEncoder({ output: handleVideoChunk, error: fail });
    videoEncoder.configure(videoSupport.config);

    // 먹서는 인코더 설정이 끝난 뒤에 만든다 — 해상도·코덱이 헤더에 박히기 때문
    activeSegment = createSegment(firstSegment);

    encodeFrame(firstFrame);
    if (firstAudio) {
      if (audioEncoder) encodeAudio(firstAudio);
      else firstAudio.close();
    }

    // 오디오를 못 쓰는 상황이면 읽기 자체를 접는다 (프레임만 버리며 도는 것 방지)
    if (audioReader && !audioEncoder) {
      audioReader.cancel().catch(() => {});
      audioReader = null;
    }

    pipelineStartMs = performance.now();
    videoPump = pump(videoReader, encodeFrame);
    audioPump = audioReader ? pump(audioReader, encodeAudio) : null;

    console.info(
      `▶️ [Record] ${width}x${height} · ${videoSupport.config.codec} · ` +
        `${audioTrackConfig ? audioTrackConfig.codec : "무음"} · ${container}`
    );
    statsTimer = setInterval(logStats, STATS_INTERVAL_MS);

    return {
      width,
      height,
      videoCodec: videoSupport.config.codec,
      audioCodec: audioTrackConfig?.codec ?? null,
      container,
    };
  };

  // 분할: 새 세그먼트를 예약만 하고, 실제 교체는 다음 키프레임에서 일어난다.
  // 예약이 실패해도 진행 중인 녹화는 그대로 이어진다
  const rotate = (nextSegment) => {
    if (stopped || !activeSegment || pendingSegment) return false;
    try {
      pendingSegment = createSegment(nextSegment);
    } catch (e) {
      console.error("❌ [Record] 분할 세그먼트 준비 실패:", e);
      pendingSegment = null;
      return false;
    }
    forceKeyFrame = true;
    return true;
  };

  const stop = async () => {
    if (stopped) return;
    stopped = true;
    if (statsTimer) {
      clearInterval(statsTimer);
      statsTimer = null;
    }

    await Promise.allSettled(
      [videoReader?.cancel(), audioReader?.cancel()].filter(Boolean)
    );
    await Promise.allSettled([videoPump, audioPump].filter(Boolean));

    // 종료 중 나온 키프레임이 세그먼트를 교체해버리지 않도록 예약분을 먼저 뗀다
    const orphan = pendingSegment;
    pendingSegment = null;

    try {
      if (videoEncoder?.state === "configured") await videoEncoder.flush();
    } catch (e) {
      console.error("❌ [Record] 영상 인코더 flush 실패:", e);
    }
    try {
      if (audioEncoder?.state === "configured") await audioEncoder.flush();
    } catch (e) {
      console.error("❌ [Record] 음성 인코더 flush 실패:", e);
    }

    try {
      videoEncoder?.close();
      audioEncoder?.close();
    } catch {
      // 이미 오류로 닫힌 인코더 — 무시
    }

    // 분할 직후 종료 — 꼬리 수신용으로 열어둔 이전 세그먼트부터 닫고 기다린다
    finalizeClosingSegment();
    await closingPromise;

    // 표본 수집 시간보다 짧게 끝난 초단편 녹화 — 지금 있는 표본으로 확정해
    // 모아둔 오디오를 버리지 않는다
    tryCommitOffset(true);
    if (
      offsetCommitted &&
      activeSegment &&
      activeSegment.startUs !== null &&
      pendingAudio.length > 0
    ) {
      const queued = pendingAudio.splice(0);
      for (const [pendingChunk, pendingMeta] of queued) {
        muxAudioChunk(activeSegment, pendingChunk, pendingMeta);
      }
    }
    pendingAudio.length = 0;

    const last = activeSegment;
    activeSegment = null;
    await completeSegment(last);

    // 한 프레임도 받지 못한 예약 세그먼트는 빈 파일이므로 먹싱 없이 넘긴다
    if (orphan) {
      await onSegmentDiscarded?.({
        fileName: orphan.fileName,
        writable: orphan.writable,
      });
    }

    if (droppedFrames > 0) {
      console.warn(`⚠️ [Record] 인코더 지연으로 버린 프레임: ${droppedFrames}`);
    }
  };

  return { start, rotate, stop };
};
