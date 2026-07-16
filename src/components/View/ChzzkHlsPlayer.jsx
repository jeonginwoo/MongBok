"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { useTheme } from "@mui/material";
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

const MAX_RETRIES = 3;
const CHZZK_GREEN = "#00FFA3";
const CONTROLS_HIDE_DELAY = 2500;
const AUTO_LEVEL = -1;
const WATCHDOG_INTERVAL = 5000;
// 이 이상 라이브에서 뒤처지면 워치독이 라이브 엣지로 점프시킨다.
// hls.js는 목표 지연보다 세그먼트 1개 이상 뒤처지면 DVR 시청으로 간주해
// 배속 따라잡기를 포기하므로, 한번 크게 밀린 딜레이는 스스로 줄지 않는다
const MAX_LIVE_LATENCY = 8;

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

  // 라이브 엣지로 이동 (딜레이 리셋)
  const seekToLive = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const hls = hlsRef.current;
    // hls.liveSyncPosition은 스톨이 누적되면 목표 지연이 불어나 뒤로 밀리므로
    // 그대로 쓰면 밀린 딜레이가 유지된다. seekable 끝(버퍼 엣지)에서
    // 플레이리스트 홀드백만 뺀 위치와 비교해 더 앞선 쪽으로 이동한다
    const details = hls?.latestLevelDetails;
    const holdBack =
      (details && (details.partHoldBack || details.holdBack)) || 3;
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
  }, []);

  const handleVolumeChange = useCallback((_e, value) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    video.muted = value === 0;
  }, []);

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

    // 첫 재생은 소리 켜진 상태로 자동재생 시도, 정책에 막히면 음소거로 시작.
    // 에러 복구·워치독으로 재생성될 때는 사용자의 음소거 상태를 건드리지 않는다.
    let soundStarted = false;
    const startPlayback = () => {
      if (soundStarted) {
        video.play().catch(() => {});
        return;
      }
      soundStarted = true;
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

    const fail = () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      onErrorRef.current?.();
    };

    const createPlayer = (url) => {
      const hls = new Hls({
        // LLHLS 파트 단위 로딩. liveSyncDuration류를 명시하면 플레이리스트의
        // PART-HOLD-BACK(~3초)보다 우선 적용되어 지연이 커지므로 설정하지 않는다
        lowLatencyMode: true,
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
              networkRetries++;
              // 토큰 만료 가능성이 있으므로 최신 URL로 플레이어를 재생성
              hls.destroy();
              createPlayer(latestUrlRef.current);
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
            fail();
        }
      });
    };

    createPlayer(latestUrlRef.current);

    // 워치독: 사용자가 개입할 수 없는 상황(밤새 녹화 등)에서도 스스로 복구되도록
    // 화면 멈춤 · 딜레이 고착 · 화질 강등을 주기적으로 감시한다
    let lastWatchdogTime = -1;
    let frozenTicks = 0;
    const watchdogId = setInterval(() => {
      const hls = hlsRef.current;
      if (destroyed || !hls || video.paused) {
        frozenTicks = 0;
        lastWatchdogTime = -1;
        return;
      }

      // 1) 화면 멈춤: 재생 중인데 currentTime이 연속 2회(~10초) 그대로면
      //    hls.js가 스스로 복구하지 못하는 상태이므로 최신 URL로 재생성
      if (video.currentTime === lastWatchdogTime) {
        frozenTicks++;
        if (frozenTicks >= 2) {
          frozenTicks = 0;
          lastWatchdogTime = -1;
          hls.destroy();
          createPlayer(latestUrlRef.current);
          return;
        }
      } else {
        frozenTicks = 0;
      }
      lastWatchdogTime = video.currentTime;

      // 2) 딜레이 고착: 한계 이상 뒤처지면 라이브 엣지로 점프
      //    (hls.js의 배속 따라잡기는 크게 밀린 딜레이를 복구하지 못함)
      if (hls.latency > MAX_LIVE_LATENCY) {
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
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [seekToLive]);

  const showUi = controlsVisible || !playing || qualityMenuOpen;

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
          gap: 1,
          px: 1.5,
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

        {/* LIVE 뱃지: 클릭 시 라이브 엣지로 이동 */}
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

        <IconButton onClick={toggleMute} sx={{ color: "#fff", p: 0.75 }}>
          {muted || volume === 0 ? (
            <VolumeOffRoundedIcon sx={{ fontSize: 26 }} />
          ) : (
            <VolumeUpRoundedIcon sx={{ fontSize: 26 }} />
          )}
        </IconButton>
        <Slider
          size="small"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          sx={{
            width: 90,
            color: "#fff",
            "& .MuiSlider-thumb": {
              width: 12,
              height: 12,
              "&:hover, &.Mui-focusVisible": { boxShadow: "none" },
            },
          }}
        />

        <Box sx={{ flexGrow: 1 }} />

        {/* 화질 선택 (hls.js 경로에서만 노출) */}
        {levels.length > 0 && (
          <Box
            onClick={() => setQualityMenuOpen((prev) => !prev)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              cursor: "pointer",
              userSelect: "none",
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
            }}
          >
            <SettingsRoundedIcon sx={{ fontSize: 22, color: "#fff" }} />
            <Typography sx={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
              {qualityLabel}
            </Typography>
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
