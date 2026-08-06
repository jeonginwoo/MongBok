"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { useAtomValue, useSetAtom } from "jotai";
import { useTheme } from "@mui/material";
import {
  chzzkHlsLatencyAtom,
  chzzkHlsVolumeAtom,
  CHZZK_HLS_LATENCY_MIN,
  CHZZK_HLS_LATENCY_MAX,
  CHZZK_HLS_LATENCY_DEFAULT,
} from "@/atoms/setting";
import { useLiveTime } from "@/hooks/useLiveTime";
import ProfileImage from "@/components/Info/ProfileImage";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import VolumeOffRoundedIcon from "@mui/icons-material/VolumeOffRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import FullscreenExitRoundedIcon from "@mui/icons-material/FullscreenExitRounded";

const MAX_RETRIES = 5;
// 재시도 백오프 기준 (1s → 2s → 4s → 8s → 16s). 딜레이 없이 연달아 재시도하면
// 순간적인 네트워크 장애에도 수 초 안에 재시도 횟수가 전부 소진되어 버린다
const RETRY_BACKOFF_BASE = 1000;
const CHZZK_GREEN = "#00FFA3";
const CONTROLS_HIDE_DELAY = 2500;
// 컨트롤 바 축소 기준 너비: compact에서는 화질 라벨 등 부가 텍스트를 숨기고,
// tiny에서는 LIVE 뱃지까지 숨겨 음량 슬라이더가 찌그러지지 않을 공간을 확보한다
const COMPACT_WIDTH = 480;
const TINY_WIDTH = 340;
const AUTO_LEVEL = -1;
// 워치독 감시 주기. 짧을수록 멈춤을 빨리 감지하지만 너무 잦으면 불필요한 개입이
// 늘어난다. 2초 주기로 감지 지연을 기존(5초)보다 크게 줄인다
const WATCHDOG_INTERVAL = 2000;
// 이 횟수만큼 연속으로 currentTime이 정지해 있으면 멈춤으로 판단하고 복구 시작
// (2틱 × 2초 = 약 4초 정지 시 개입)
const FREEZE_TICKS_TO_ACT = 2;
// 복구 조치 후 이 횟수만큼 연속 정상 재생되면 "복구됨"으로 보고 복구 단계 초기화.
// 1틱만 전진해도 리셋하면, 재생성 직후의 일시적 전진을 정상으로 오판해
// 다시 무한 재생성 루프에 빠지므로 여러 틱의 지속 재생을 요구한다
const HEALTHY_TICKS_TO_RESET = 3;
// 단계적 복구를 이 횟수까지 시도하고도 계속 멈추면 iframe 폴백으로 넘긴다.
// (예전엔 상한이 없어 재생성만 무한 반복 → 복구까지 10분 넘게 걸리는 원인)
const MAX_FREEZE_RECOVERIES = 4;
// 목표 딜레이보다 이만큼 이상 뒤처지면 워치독이 라이브 엣지로 점프시킨다.
// hls.js는 목표 지연보다 세그먼트 1개 이상 뒤처지면 DVR 시청으로 간주해
// 배속 따라잡기를 포기하므로, 한번 크게 밀린 딜레이는 스스로 줄지 않는다
const LATENCY_JUMP_MARGIN = 5;

/**
 * 치지직 HLS 직접 재생 플레이어 (치지직 전체화면 스타일 커스텀 컨트롤).
 * live-detail API의 livePlaybackJson에서 추출한 m3u8을 hls.js로 재생한다.
 * 상단에 방송 정보(프로필·제목·채널명·시청자 수), 하단에 컨트롤 바를 표시한다.
 * 화질은 기본 1080p(없으면 최고 화질)로 시작하고 메뉴에서 선택 가능하다.
 * 라이브 전용이라 재생바(시킹)는 없고, 일시정지 후 재생하면 라이브 엣지로
 * 점프해 딜레이를 최소화한다. 재생 실패 시 onError 콜백으로 알려
 * 상위에서 iframe 폴백을 렌더링하게 한다.
 */
export default function ChzzkHlsPlayer({ hlsUrl, channel, pointerEventsEnabled, onError }) {
  const theme = useTheme();
  const wrapperRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const hideTimerRef = useRef(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // 플레이어 실제 너비 (컨트롤 바 축소 판단용)
  const [wrapperWidth, setWrapperWidth] = useState(Infinity);
  // 자동재생 정책에 막혀 음소거로 시작한 상태 (첫 사용자 입력 시 소리 켬)
  const [needsUnmute, setNeedsUnmute] = useState(false);

  // 화질: levels는 [{index, height}], quality는 hls level index (-1 = 자동)
  const [levels, setLevels] = useState([]);
  const [quality, setQuality] = useState(AUTO_LEVEL);
  const [activeHeight, setActiveHeight] = useState(null);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  // 에러 복구로 플레이어를 재생성해도 사용자가 고른 화질을 유지 (null = 아직 미결정)
  const qualityRef = useRef(null);

  // 60초 폴링마다 URL의 서명 토큰이 갱신되어 문자열이 바뀔 수 있으므로,
  // 재생 중에는 새 URL을 무시하고 에러 복구 시에만 최신 URL로 재로딩한다.
  const latestUrlRef = useRef(hlsUrl);
  latestUrlRef.current = hlsUrl;

  // 목표 딜레이 설정 (설정 패널에서 0.1초 단위 조절, 잘못된 저장값은 기본값으로)
  const rawLatency = Number(useAtomValue(chzzkHlsLatencyAtom));
  const targetLatency = Number.isFinite(rawLatency)
    ? Math.min(CHZZK_HLS_LATENCY_MAX, Math.max(CHZZK_HLS_LATENCY_MIN, rawLatency))
    : CHZZK_HLS_LATENCY_DEFAULT;
  const targetLatencyRef = useRef(targetLatency);
  targetLatencyRef.current = targetLatency;

  // 자동재생 소리 켜기 시도는 최초 1회만 (설정 변경·에러 복구로 플레이어를
  // 재생성해도 사용자의 음소거/볼륨 상태를 건드리지 않는다)
  const soundStartedRef = useRef(false);

  // 마지막 사용자 볼륨/뮤트 설정 — 새 플레이어 배치 시 초기값으로만 상속하고,
  // 이후 다른 플레이어의 변경에는 따라가지 않는다 (최초 재생 시점에 1회 사용).
  // ref 미러를 두는 이유: atomWithStorage는 마운트 직후 저장값으로 동기화되므로,
  // 최초 렌더 값을 고정하면 저장값이 아니라 기본값을 상속할 수 있다
  const storedVolume = useAtomValue(chzzkHlsVolumeAtom);
  const storedVolumeRef = useRef(storedVolume);
  storedVolumeRef.current = storedVolume;
  const setStoredVolume = useSetAtom(chzzkHlsVolumeAtom);

  // 사용자 조작(뮤트 버튼·슬라이더)에서만 저장한다. volumechange 이벤트에서
  // 저장하면 자동재생 정책의 강제 뮤트까지 사용자 설정으로 덮어써 버린다
  const persistVolume = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setStoredVolume({ volume: video.volume, muted: video.muted });
  }, [setStoredVolume]);

  // 라이브 엣지로 이동 (딜레이 리셋)
  const seekToLive = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const hls = hlsRef.current;
    // hls.liveSyncPosition은 스톨이 누적되면 목표 지연이 불어나 뒤로 밀리므로
    // 그대로 쓰면 밀린 딜레이가 유지된다. seekable 끝(버퍼 엣지)에서
    // 목표 딜레이만 뺀 위치와 비교해 더 앞선 쪽으로 이동한다
    const holdBack = targetLatencyRef.current;
    let target = Number.isFinite(hls?.liveSyncPosition)
      ? hls.liveSyncPosition
      : null;
    if (video.seekable?.length) {
      const edge = video.seekable.end(video.seekable.length - 1);
      target = Math.max(target ?? -Infinity, edge - holdBack);
    }
    // 0.5초 미만의 전진은 의미가 없으므로 생략 (뒤로는 절대 이동하지 않음)
    if (Number.isFinite(target) && target > video.currentTime + 0.5) {
      video.currentTime = target;
    }
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      seekToLive();
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [seekToLive]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    persistVolume();
  }, [persistVolume]);

  const handleVolumeChange = useCallback((_e, value) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    video.muted = value === 0;
    persistVolume();
  }, [persistVolume]);

  const selectQuality = useCallback((index) => {
    qualityRef.current = index;
    setQuality(index);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index; // -1이면 자동(ABR)
    }
    setQualityMenuOpen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement === wrapperRef.current) {
      document.exitFullscreen().catch(() => {});
    } else {
      wrapperRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(
      () => setControlsVisible(false),
      CONTROLS_HIDE_DELAY
    );
  }, []);

  // 비디오 상태 ↔ UI 동기화
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setPlaying(true);
      // 어떤 경로로든 재생이 재개되면 라이브 엣지로 (딜레이 최소화)
      seekToLive();
    };
    const onPause = () => setPlaying(false);
    const onVolumeChange = () => {
      setMuted(video.muted);
      setVolume(video.volume);
    };
    const onFullscreenChange = () =>
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("volumechange", onVolumeChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("volumechange", onVolumeChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      clearTimeout(hideTimerRef.current);
    };
  }, [seekToLive]);

  // 플레이어 너비 감시: 좁아지면 컨트롤 바를 단계적으로 축소
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver((entries) => {
      setWrapperWidth(entries[0].contentRect.width);
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  // 음소거 자동 시작 시: 첫 사용자 입력(클릭/키)에 소리 켬
  useEffect(() => {
    if (!needsUnmute) return;
    const unmute = () => {
      const video = videoRef.current;
      if (video) {
        video.muted = false;
        video.play().catch(() => {});
      }
      setNeedsUnmute(false);
    };
    window.addEventListener("click", unmute);
    window.addEventListener("keydown", unmute);
    return () => {
      window.removeEventListener("click", unmute);
      window.removeEventListener("keydown", unmute);
    };
  }, [needsUnmute]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !latestUrlRef.current) return;

    // 첫 재생은 마지막 사용자 볼륨/뮤트 설정을 상속해서 시작한다.
    // 소리 켜진 상태를 상속하면 자동재생을 시도하고, 정책에 막히면 음소거로 시작.
    // 에러 복구·워치독으로 재생성될 때는 사용자의 음소거 상태를 건드리지 않는다.
    const startPlayback = () => {
      if (soundStartedRef.current) {
        video.play().catch(() => {});
        return;
      }
      soundStartedRef.current = true;

      // 저장값이 손상됐을 수 있으므로 방어적으로 정규화
      const rawVolume = Number(storedVolumeRef.current?.volume);
      const inheritedVolume = Number.isFinite(rawVolume)
        ? Math.min(1, Math.max(0, rawVolume))
        : 1;
      video.volume = inheritedVolume;

      if (storedVolumeRef.current?.muted || inheritedVolume === 0) {
        // 뮤트 상태 상속: 사용자가 원한 상태이므로 소리 켜기 시도도,
        // 첫 클릭 시 소리 켬(needsUnmute)도 하지 않는다
        video.muted = true;
        video.play().catch(() => {});
        return;
      }

      video.muted = false;
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
        setNeedsUnmute(true);
      });
    };

    // Safari 등 네이티브 HLS 지원 브라우저 (화질은 네이티브 ABR에 위임)
    if (video.canPlayType("application/vnd.apple.mpegurl") && !Hls.isSupported()) {
      video.src = latestUrlRef.current;
      startPlayback();
      return;
    }

    if (!Hls.isSupported()) {
      onErrorRef.current?.();
      return;
    }

    let destroyed = false;
    let networkRetries = 0;
    let mediaRetries = 0;
    let retryTimerId = null;

    const fail = () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      onErrorRef.current?.();
    };

    // 백오프 딜레이 후 최신 URL로 플레이어 재생성 (즉시 재시도는 순간 장애에
    // 재시도 횟수만 소진하므로, 대기 중 60초 폴링으로 토큰이 갱신될 여유도 준다)
    const recreateAfterBackoff = (hls, attempt) => {
      hls.destroy();
      hlsRef.current = null;
      clearTimeout(retryTimerId);
      retryTimerId = setTimeout(() => {
        if (!destroyed) createPlayer(latestUrlRef.current);
      }, RETRY_BACKOFF_BASE * 2 ** attempt);
    };

    const createPlayer = (url) => {
      const hls = new Hls({
        // LLHLS 파트 단위 로딩
        lowLatencyMode: true,
        // 사용자가 설정한 목표 딜레이. 명시하면 플레이리스트의 PART-HOLD-BACK보다
        // 우선 적용된다 (기본 3초 = 치지직 PART-HOLD-BACK 권장값과 동일)
        liveSyncDuration: targetLatencyRef.current,
        maxLiveSyncPlaybackRate: 1.5, // 뒤처지면 1.5배속으로 따라잡기
        backBufferLength: 60,
        enableWorker: true,
        // 재생 에러 시 수동 선택 화질을 자동(ABR)으로 리셋하지 않는다.
        // 리셋되면 에러 직후의 낮은 대역폭 추정치 때문에 144p까지 떨어진 채
        // UI에는 선택 화질이 그대로 표시되는 불일치가 생긴다
        preserveManualLevelOnError: true,
      });
      hlsRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLevels(hls.levels.map((l, index) => ({ index, height: l.height })));

        if (qualityRef.current === null) {
          // 기본 화질: 1080p, 없으면 최고 화질
          let idx = hls.levels.findIndex((l) => l.height === 1080);
          if (idx === -1) {
            idx = hls.levels.reduce(
              (best, l, i) => (l.height > hls.levels[best].height ? i : best),
              0
            );
          }
          qualityRef.current = idx;
          setQuality(idx);
        }
        hls.currentLevel = qualityRef.current;

        startPlayback();
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        setActiveHeight(hls.levels[data.level]?.height ?? null);
      });

      // 정상 재생이 재개되면 재시도 카운터 초기화 (장시간 시청 대비)
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        networkRetries = 0;
        mediaRetries = 0;
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal || destroyed) return;
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (networkRetries < MAX_RETRIES) {
              // 토큰 만료 가능성이 있으므로 최신 URL로 플레이어를 재생성
              recreateAfterBackoff(hls, networkRetries++);
            } else {
              fail();
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            if (mediaRetries < MAX_RETRIES) {
              mediaRetries++;
              hls.recoverMediaError();
            } else {
              fail();
            }
            break;
          default:
            // 기타 fatal 에러도 즉시 포기하지 않고 재생성을 시도한다
            if (networkRetries < MAX_RETRIES) {
              recreateAfterBackoff(hls, networkRetries++);
            } else {
              fail();
            }
        }
      });
    };

    createPlayer(latestUrlRef.current);

    // 워치독: 사용자가 개입할 수 없는 상황(밤새 녹화 등)에서도 스스로 복구되도록
    // 화면 멈춤 · 딜레이 고착 · 화질 강등을 주기적으로 감시한다
    let lastWatchdogTime = -1;
    let frozenTicks = 0;
    let healthyTicks = 0;
    // 이번 멈춤에 대해 지금까지 시도한 복구 단계 수 (지속 재생되면 0으로 리셋)
    let freezeRecoveries = 0;
    const watchdogId = setInterval(() => {
      const hls = hlsRef.current;
      if (destroyed || !hls || video.paused) {
        frozenTicks = 0;
        lastWatchdogTime = -1;
        return;
      }

      // 1) 화면 멈춤 감지 및 단계적 복구.
      //    가벼운 조치부터 시도해 대부분의 스톨을 수 초 안에 풀고, 그래도 안 되면
      //    점점 강한 조치로 escalate하며, 끝내 복구 안 되면 iframe 폴백으로 탈출한다
      //    (곧장 전체 재생성만 반복하던 기존 방식은 느리고 무한 루프 위험이 있었다)
      const advanced = video.currentTime !== lastWatchdogTime;
      lastWatchdogTime = video.currentTime;

      if (advanced) {
        frozenTicks = 0;
        healthyTicks++;
        // 충분히 오래 정상 재생되면 복구 단계 초기화 (재생성 직후의 순간 전진에
        // 속아 리셋하지 않도록 여러 틱의 지속 재생을 확인)
        if (healthyTicks >= HEALTHY_TICKS_TO_RESET) freezeRecoveries = 0;
      } else {
        healthyTicks = 0;
        frozenTicks++;
        if (frozenTicks >= FREEZE_TICKS_TO_ACT) {
          frozenTicks = 0;
          freezeRecoveries++;

          if (freezeRecoveries > MAX_FREEZE_RECOVERIES) {
            // 단계적 복구를 모두 시도해도 계속 멈춤 → iframe 폴백으로 넘긴다
            fail();
            return;
          }

          if (freezeRecoveries === 1) {
            // 1단계: 로딩 재개 + 라이브 엣지 점프 (가장 저렴, 버퍼 스톨 대부분 해결)
            hls.startLoad();
            seekToLive();
            video.play().catch(() => {});
          } else if (freezeRecoveries === 2) {
            // 2단계: 미디어 디코더 오류 복구
            hls.recoverMediaError();
            video.play().catch(() => {});
          } else {
            // 3단계 이상: 최신 URL로 플레이어 완전 재생성 (재시도 카운터도 초기화)
            networkRetries = 0;
            mediaRetries = 0;
            hls.destroy();
            createPlayer(latestUrlRef.current);
          }
          return;
        }
      }

      // 2) 딜레이 고착: 목표 딜레이보다 한계 이상 뒤처지면 라이브 엣지로 점프
      //    (hls.js의 배속 따라잡기는 크게 밀린 딜레이를 복구하지 못함)
      if (hls.latency > targetLatencyRef.current + LATENCY_JUMP_MARGIN) {
        seekToLive();
      }

      // 3) 화질 강등: 수동 선택 화질이 풀려 자동(ABR)으로 바뀌어 있으면 재적용
      const manualLevel = qualityRef.current;
      if (
        manualLevel !== null &&
        manualLevel !== AUTO_LEVEL &&
        hls.autoLevelEnabled &&
        hls.levels?.[manualLevel]
      ) {
        hls.currentLevel = manualLevel;
      }
    }, WATCHDOG_INTERVAL);

    return () => {
      destroyed = true;
      clearInterval(watchdogId);
      clearTimeout(retryTimerId);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
    // targetLatency 변경 시 새 목표 딜레이로 플레이어 재생성 (hls 설정은 생성 시점 고정)
  }, [seekToLive, targetLatency]);

  const showUi = controlsVisible || !playing || qualityMenuOpen;

  // 컨트롤 바 축소 단계 (compact: 화질 라벨 숨김, tiny: LIVE 뱃지까지 숨김)
  const compact = wrapperWidth < COMPACT_WIDTH;
  const tiny = wrapperWidth < TINY_WIDTH;

  // 방송 경과 시간 (LiveTime과 동일한 공용 훅)
  const liveTime = useLiveTime(channel);

  const qualityLabel =
    quality === AUTO_LEVEL
      ? activeHeight
        ? `자동 (${activeHeight}p)`
        : "자동"
      : `${levels.find((l) => l.index === quality)?.height ?? activeHeight ?? "-"}p`;

  return (
    <Box
      ref={wrapperRef}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => {
        setControlsVisible(false);
        setQualityMenuOpen(false);
      }}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#000",
        overflow: "hidden",
        pointerEvents: pointerEventsEnabled ? "auto" : "none",
        cursor: showUi ? "default" : "none",
      }}
    >
      <Box
        component="video"
        ref={videoRef}
        autoPlay
        playsInline
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />

      {/* 상단 방송 정보 (치지직 전체화면 UI 스타일) */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          pt: 1.5,
          pb: 4,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0))",
          opacity: showUi ? 1 : 0,
          transition: "opacity 0.2s",
          pointerEvents: "none",
        }}
      >
        <ProfileImage channel={channel} imgSize={66} borderSize={6} />
        <Box sx={{ minWidth: 0 }}>
          {/* 1줄: 방송 제목 */}
          <Typography
            noWrap
            sx={{ color: "#fff", fontSize: 16, fontWeight: 700 }}
          >
            {channel?.liveTitle || channel?.name}
          </Typography>
          {/* 2줄: 채널 이름 */}
          <Typography noWrap sx={{ color: "#fff", fontSize: 16, mt: 0.25, fontWeight: 700 }}>
            {channel?.name}
          </Typography>
          {/* 3줄: 현재 시청자수(빨강) · 방송 시간 스트리밍 중 */}
          <Typography noWrap sx={{ color: "#fff", fontSize: 13, mt: 0.25 }}>
            {Number.isFinite(channel?.userCount) && channel.userCount >= 0 && (
              <Box
                component="span"
                sx={{ color: theme.palette.common.red, fontWeight: 700 }}
              >
                {`현재 ${channel.userCount.toLocaleString()}명`}
              </Box>
            )}
            {channel?.openDate && (
              <>
                {Number.isFinite(channel?.userCount) && channel.userCount >= 0 && (
                  <Box component="span" sx={{ opacity: 0.5 }}>
                    {" · "}
                  </Box>
                )}
                {`${liveTime} 스트리밍 중`}
              </>
            )}
          </Typography>
        </Box>
      </Box>

      {/* 일시정지 시 중앙 재생 버튼 */}
      {!playing && (
        <Box
          onClick={togglePlay}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 88,
            height: 88,
            borderRadius: "50%",
            bgcolor: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            "&:hover": { bgcolor: "rgba(0, 0, 0, 0.75)" },
          }}
        >
          <PlayArrowRoundedIcon sx={{ fontSize: 60, color: "#fff" }} />
        </Box>
      )}

      {/* 화질 선택 메뉴 (전체화면에서도 보이도록 포털 없이 내부 렌더링) */}
      {qualityMenuOpen && (
        <Box
          sx={{
            position: "absolute",
            right: 12,
            bottom: 64,
            minWidth: 140,
            py: 0.5,
            borderRadius: 1.5,
            bgcolor: "rgba(20, 21, 23, 0.95)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            zIndex: 1,
          }}
        >
          {[{ index: AUTO_LEVEL, height: null }, ...[...levels].sort((a, b) => b.height - a.height)].map(
            (l) => (
              <Box
                key={l.index}
                onClick={() => selectQuality(l.index)}
                sx={{
                  px: 2,
                  py: 1,
                  fontSize: 14,
                  color: quality === l.index ? CHZZK_GREEN : "#fff",
                  fontWeight: quality === l.index ? 700 : 400,
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                {l.index === AUTO_LEVEL ? "자동" : `${l.height}p`}
              </Box>
            )
          )}
        </Box>
      )}

      {/* 하단 컨트롤 바 (재생바 없음) */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          gap: tiny ? 0.5 : 1,
          px: tiny ? 1 : 1.5,
          pt: 4,
          pb: 1,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))",
          opacity: showUi ? 1 : 0,
          transition: "opacity 0.2s",
          pointerEvents: showUi && pointerEventsEnabled ? "auto" : "none",
        }}
      >
        <IconButton onClick={togglePlay} sx={{ color: "#fff", p: 0.75 }}>
          {playing ? (
            <PauseRoundedIcon sx={{ fontSize: 30 }} />
          ) : (
            <PlayArrowRoundedIcon sx={{ fontSize: 30 }} />
          )}
        </IconButton>

        {/* LIVE 뱃지: 클릭 시 라이브 엣지로 이동 (tiny에서는 숨겨 공간 확보) */}
        {!tiny && (
          <Box
            onClick={() => {
              seekToLive();
              videoRef.current?.play().catch(() => {});
            }}
            title="실시간 보기"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 0.5,
              cursor: "pointer",
              userSelect: "none",
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: playing ? CHZZK_GREEN : "#888",
              }}
            />
            <Typography
              sx={{
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              LIVE
            </Typography>
          </Box>
        )}

        <IconButton onClick={toggleMute} sx={{ color: "#fff", p: 0.75 }}>
          {muted || volume === 0 ? (
            <VolumeOffRoundedIcon sx={{ fontSize: 26 }} />
          ) : (
            <VolumeUpRoundedIcon sx={{ fontSize: 26 }} />
          )}
        </IconButton>
        {/* flexShrink: 0 — 슬라이더가 공간 부족 시 찌그러지는 유일한 요소가
            되지 않도록 고정하고, 대신 위 단계별 축소로 공간을 확보한다 */}
        <Slider
          size="small"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          sx={{
            width: tiny ? 64 : 90,
            flexShrink: 0,
            color: "#fff",
            "& .MuiSlider-thumb": {
              width: 12,
              height: 12,
              "&:hover, &.Mui-focusVisible": { boxShadow: "none" },
            },
          }}
        />

        <Box sx={{ flexGrow: 1 }} />

        {/* 화질 선택 (hls.js 경로에서만 노출, compact에서는 라벨 없이 아이콘만) */}
        {levels.length > 0 && (
          <Box
            onClick={() => setQualityMenuOpen((prev) => !prev)}
            title={qualityLabel}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: compact ? 0.5 : 1,
              py: 0.5,
              borderRadius: 1,
              cursor: "pointer",
              userSelect: "none",
              flexShrink: 0,
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
            }}
          >
            <SettingsRoundedIcon sx={{ fontSize: 22, color: "#fff" }} />
            {!compact && (
              <Typography sx={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
                {qualityLabel}
              </Typography>
            )}
          </Box>
        )}

        <IconButton
          onClick={toggleFullscreen}
          sx={{ color: "#fff", p: 0.75 }}
        >
          {isFullscreen ? (
            <FullscreenExitRoundedIcon sx={{ fontSize: 28 }} />
          ) : (
            <FullscreenRoundedIcon sx={{ fontSize: 28 }} />
          )}
        </IconButton>
      </Box>
    </Box>
  );
}
