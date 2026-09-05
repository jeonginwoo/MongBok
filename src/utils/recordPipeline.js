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
  let audioTrackConfig = null; // 먹서에 넘길 { numberOfChannels, sampleRate }

  // 오디오 클럭 → 영상 클럭 변환 오프셋(µs). 두 트랙의 타임스탬프 원점은 완전히
  // 다르다(실측 14일 이상 차이) — 시작 시 첫 샘플의 도착 시각을 공통 기준으로 실측한다
  let audioToVideoOffsetUs = 0;
  // 영상 기준시각이 잡히기 전에 도착한 오디오 (버리면 그 길이만큼 소리가 앞선다)
  const pendingAudio = [];

  let activeSegment = null;
  let pendingSegment = null;
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
  let droppedFrames = 0;
  let statsTimer = null;

  const logStats = () => {
    const seconds = STATS_INTERVAL_MS / 1000;
    const rate = (n) => (n / seconds).toFixed(1);
    console.info(
      `📊 [Record] 입력 ${rate(framesIn)}fps · 인코딩 ${rate(framesEncoded)}fps · ` +
        `먹싱 ${rate(videoChunksOut)}fps · 음성 ${audioChunksIn}→${audioChunksOut}청크 · ` +
        `누적 버림 ${droppedFrames} · 큐 ${videoEncoder?.encodeQueueSize ?? 0}`
    );
    framesIn = 0;
    framesEncoded = 0;
    videoChunksOut = 0;
    audioChunksIn = 0;
    audioChunksOut = 0;
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
    // 분할 대기 중이면 키프레임에서 세그먼트를 교체한다 — 새 파일이 항상
    // 키프레임으로 시작하므로 프레임 공백도, 앞부분 깨짐도 없다
    if (pendingSegment && chunk.type === "key") {
      const previous = activeSegment;
      activeSegment = pendingSegment;
      pendingSegment = null;
      completeSegment(previous).catch((e) =>
        console.error("❌ [Record] 분할 세그먼트 마무리 실패:", e)
      );
    }

    const segment = activeSegment;
    if (!segment) return;
    if (segment.startUs === null) segment.startUs = chunk.timestamp;
    const timestamp = chunk.timestamp - segment.startUs;
    if (timestamp < 0) return;
    try {
      segment.muxer.addVideoChunk(chunk, meta, timestamp);
      videoChunksOut += 1;
    } catch (e) {
      console.error("❌ [Record] 영상 청크 먹싱 실패:", e);
    }

    // 기준시각이 방금 확정됐다면 모아둔 오디오를 제자리에 내보낸다 — 키프레임
    // 블록이 먼저 들어간 뒤라 컨테이너 순서도 자연스럽다. 청크 수 × 21ms가 곧
    // 영상 인코더의 초기화 지연이다
    if (pendingAudio.length > 0) {
      const queued = pendingAudio.splice(0);
      for (const [pendingChunk, pendingMeta] of queued) {
        muxAudioChunk(segment, pendingChunk, pendingMeta);
      }
      console.info(
        `🔊 [Record] 영상 인코더 준비 동안 모아둔 오디오 ${queued.length}청크 방출`
      );
    }
  };

  const muxAudioChunk = (segment, chunk, meta) => {
    // 클럭 오프셋으로 영상 클럭에 맞춘 뒤 영상과 "같은" 세그먼트 기준시각을 뺀다.
    // 도착 순서로 앵커링했던 이전 방식은 영상 인코더 초기화 지연(수백 ms)만큼
    // 소리가 앞서 들리는 상수 오프셋을 만들었다. 같은 축을 쓰므로 분할 경계에서도
    // 싱크가 다시 어긋나지 않는다
    const timestamp = chunk.timestamp + audioToVideoOffsetUs - segment.startUs;
    // 세그먼트 시작(첫 키프레임)보다 앞서 캡처된 소리만 버려진다
    if (timestamp < 0) return;
    try {
      segment.muxer.addAudioChunk(chunk, meta, timestamp);
      audioChunksOut += 1;
    } catch (e) {
      console.error("❌ [Record] 음성 청크 먹싱 실패:", e);
    }
  };

  const handleAudioChunk = (chunk, meta) => {
    audioChunksIn += 1;
    const segment = activeSegment;
    if (!segment) return;
    // 첫 영상 청크가 인코더에서 나오기 전의 오디오 — 기준시각이 잡힐 때까지
    // 모아뒀다가 제자리에 내보낸다 (EncodedAudioChunk는 close가 필요 없다)
    if (segment.startUs === null) {
      if (pendingAudio.length < PENDING_AUDIO_MAX) pendingAudio.push([chunk, meta]);
      return;
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
    // 직후를 반영하지 못할 수 있어 첫 샘플에서 직접 읽는다.
    // 도착 시각도 함께 기록한다 — 원점이 서로 다른 두 클럭을 잇는 유일한 공통
    // 기준이 "지금 도착했다"는 사실이기 때문
    const readTimed = async (reader, timeoutMs) => {
      const value = await readFirstSample(reader, timeoutMs);
      return value ? { value, arrivedMs: performance.now() } : null;
    };
    const [firstVideoTimed, firstAudioTimed] = await Promise.all([
      readTimed(videoReader, FIRST_FRAME_TIMEOUT_MS),
      audioReader
        ? readTimed(audioReader, FIRST_AUDIO_TIMEOUT_MS)
        : Promise.resolve(null),
    ]);
    const firstFrame = firstVideoTimed?.value ?? null;
    const firstAudio = firstAudioTimed?.value ?? null;

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
      // 오디오 클럭 → 영상 클럭 오프셋 실측: 캡처 시각 차이를 도착 시각 차이로
      // 보정한다. 남는 오차는 두 경로의 캡처→도착 지연 차이(수십 ms 이내)로,
      // 이전 방식의 오차(영상 인코더 초기화 지연, 수백 ms)보다 한 자릿수 작다
      audioToVideoOffsetUs = Math.round(
        firstFrame.timestamp -
          firstAudio.timestamp -
          (firstVideoTimed.arrivedMs - firstAudioTimed.arrivedMs) * 1000
      );
    }

    if (firstAudio) {
      const audioSupport = await probeAudioConfig(firstAudio);
      if (audioSupport) {
        audioTrackConfig = {
          codec: audioSupport.muxerCodec,
          numberOfChannels: audioSupport.config.numberOfChannels,
          sampleRate: audioSupport.config.sampleRate,
        };
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
