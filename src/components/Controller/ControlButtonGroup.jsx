"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Settings as SettingsIcon,
  FiberManualRecord as FiberManualRecordIcon,
  CropPortrait as CropPortraitIcon,
} from "@mui/icons-material";
import { getLiveStatus } from "@/api/live";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { styled } from "@mui/material/styles";
import {
  validateThemeMode,
  validateBoolean
} from "@/utils/preferences";
import {
  pointerEventsEnabledAtom,
  showCurrentTimeAtom,
  channelsAtom,
  controllerExpandedAtom,
  themeModeAtom,
  pointColorAtom,
  chatFontSizeAdjustmentAtom,
  autoRecordEnabledAtom,
  autoHideOfflineAtom,
  recordStopConditionAtom,
  ratioAtom,
  layoutTypeAtom,
  viewPresetsAtom,
  viewCountAtom,
  currentTimePositionAtom,
} from "@/atoms/setting";
import { snackbarAtom, isDraggingAtom, isRecordingAtom, settingsOpenAtom, controllerPopupOpenAtom } from "@/atoms/ui";
import { POINT_COLORS } from "@/data/color";
import { canvas, getVisibleLayoutKeys } from "@/data/canvas";
import { useLayoutManager } from "@/hooks/useLayoutManager";

const iconStyle = { fontSize: "2.4rem" };

const HotkeySpan = styled(Box, {
  shouldForwardProp: (prop) => prop !== "pointcolor",
})(({ theme, pointcolor }) => ({
  color: pointcolor === "default" ? "#00bcd4" : theme.palette.primary.main,
  fontWeight: "bold",
}));

const rotate360 = {
  "0%": { transform: "rotate(0deg)" },
  "100%": { transform: "rotate(360deg)" },
};

// 남은 시간 표시: 1분 이상이면 분 단위(3m), 1분 미만이면 초 단위(10s)
const formatTimeLeft = (seconds) =>
  seconds >= 60 ? `${Math.floor(seconds / 60)}m` : `${seconds}s`;

const tooltipSlotProps = {
  tooltip: {
    sx: {
      fontSize: "1.2rem",
    },
  },
};

export default function ControlButtonGroup({ fullscreen }) {
  const [controllerExpanded, setControllerExpanded] = useAtom(
    controllerExpandedAtom
  );
  const [refreshing, setRefreshing] = useState(false);
  const [pointerEventsEnabled, setPointerEventsEnabled] = useAtom(
    pointerEventsEnabledAtom
  );
  const [showCurrentTime, setShowCurrentTime] = useAtom(showCurrentTimeAtom);
  const [channels, setChannels] = useAtom(channelsAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const [pointColor, setPointColor] = useAtom(pointColorAtom);
  const [chatFontSizeAdjustment, setChatFontSizeAdjustment] = useAtom(
    chatFontSizeAdjustmentAtom
  );
  const isDragging = useAtomValue(isDraggingAtom);
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);
  const [timeToNextRefresh, setTimeToNextRefresh] = useState(60);
  const [timeToNextListRefresh, setTimeToNextListRefresh] = useState(600);
  // 수동 갱신 시 증가 → 60초 자동 갱신 타이머 재시작
  const [refreshEpoch, setRefreshEpoch] = useState(0);
  const setSnackbar = useSetAtom(snackbarAtom);
  const [isRecording, setIsRecording] = useAtom(isRecordingAtom);
  const [controllerPopupOpen, setControllerPopupOpen] = useAtom(controllerPopupOpenAtom);
  const [autoRecordEnabled, setAutoRecordEnabled] = useAtom(autoRecordEnabledAtom);
  const autoHideOffline = useAtomValue(autoHideOfflineAtom);
  const autoHideOfflineRef = useRef(autoHideOffline);
  useEffect(() => { autoHideOfflineRef.current = autoHideOffline; }, [autoHideOffline]);
  const recordStopCondition = useAtomValue(recordStopConditionAtom);
  const recordStopConditionRef = useRef(recordStopCondition);
  useEffect(() => { recordStopConditionRef.current = recordStopCondition; }, [recordStopCondition]);
  const prevZone1LiveRef = React.useRef(undefined);
  const isRecordingRef = useRef(isRecording);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  const channelsRef = useRef(channels);
  const refreshingRef = useRef(refreshing);
  useEffect(() => { channelsRef.current = channels; }, [channels]);
  useEffect(() => { refreshingRef.current = refreshing; }, [refreshing]);
  const rootRef = useRef(null);

  const hasUnzonedChannels = useMemo(
    () => Object.values(channels).some((c) => c.zoneId === null),
    [channels]
  );

  const hasZonedChannels = useMemo(
    () => Object.values(channels).some((c) => c.zoneId !== null),
    [channels]
  );

  const [ratio, setRatio] = useAtom(ratioAtom);
  const { selectRatio } = useLayoutManager();
  const layoutType = useAtomValue(layoutTypeAtom);
  const [, setViewPresets] = useAtom(viewPresetsAtom);
  const viewCount = useAtomValue(viewCountAtom);
  const [currentTimePosition, setCurrentTimePosition] = useAtom(
    currentTimePositionAtom
  );

  const activePointColor =
    POINT_COLORS[pointColor]?.[themeMode] || POINT_COLORS["default"][themeMode];

  useEffect(() => {
    const zone1Channel = Object.values(channels).find((c) => c.zoneId === 1);
    const isLive = zone1Channel?.isLive === true;

    // 자동 녹화: 1번 채널이 라이브를 시작하면 녹화 시작
    // (녹화 종료는 recordStopCondition 기준으로 useScreenRecorder / applyLiveStatusUpdate에서 처리)
    if (autoRecordEnabled) {
      if (prevZone1LiveRef.current === false && isLive) {
        setIsRecording(true);
      }
    }

    prevZone1LiveRef.current = isLive;
  }, [channels, autoRecordEnabled, setIsRecording, isRecording]);

  const handleRecordButtonClick = () => {
    setIsRecording((prev) => !prev);
  };

  const handleToggleController = useCallback(() => {
    setControllerExpanded((prev) => {
      const nextState = !prev;
      const validation = validateBoolean(nextState, "controllerExpanded");
      if (validation === true) {
        window.localStorage.setItem(
          "controllerExpanded",
          JSON.stringify(nextState)
        );
      } else {
        console.error("controllerExpanded 유효성 검사 실패:", validation);
      }
      return nextState;
    });
  }, [setControllerExpanded]);

  const handleChangeTheme = useCallback((newMode) => {
    const validation = validateThemeMode(newMode);
    if (validation === true) {
      setThemeMode(newMode);
      window.localStorage.setItem("themeMode", JSON.stringify(newMode));
    } else {
      console.error("테마 모드 유효성 검사 실패:", validation);
    }
  }, [setThemeMode]);

  const handleToggleTheme = useCallback(() => {
    const nextState = themeMode === "light" ? "dark" : "light";
    handleChangeTheme(nextState);
  }, [themeMode, handleChangeTheme]);

  const handleChangePointerEvents = (event, newMode) => {
    if (newMode !== null) {
      setPointerEventsEnabled(newMode);
      window.localStorage.setItem(
        "pointerEventsEnabled",
        JSON.stringify(newMode)
      );
    }
  };

  const handleTogglePointerEvents = useCallback(() => {
    setPointerEventsEnabled((prev) => {
      const nextState = !prev;
      const validation = validateBoolean(nextState, "pointerEventsEnabled");
      if (validation === true) {
        window.localStorage.setItem(
          "pointerEventsEnabled",
          JSON.stringify(nextState)
        );
      } else {
        console.error("pointerEventsEnabled 유효성 검사 실패:", validation);
      }
      return nextState;
    });
  }, [setPointerEventsEnabled]);

  const handleToggleCurrentTime = useCallback(() => {
    setShowCurrentTime((prev) => {
      const nextState = !prev;
      const validation = validateBoolean(nextState, "showCurrentTime");
      if (validation === true) {
        window.localStorage.setItem("showCurrentTime", JSON.stringify(nextState));
      } else {
        console.error("showCurrentTime 유효성 검사 실패:", validation);
      }
      return nextState;
    });
  }, [setShowCurrentTime]);

  const handleToggleCurrentTimePosition = useCallback(() => {
    setCurrentTimePosition((prev) => prev === "left" ? "right" : "left");
  }, [setCurrentTimePosition]);

  const handleChangePointColor = (color) => {
    setPointColor(color);
    window.localStorage.setItem("pointColor", JSON.stringify(color));
  };

  const handleChangeChatFontSize = useCallback((event, newValue) => {
    setChatFontSizeAdjustment(newValue);
    window.localStorage.setItem(
      "chatFontSizeAdjustment",
      JSON.stringify(newValue)
    );
  }, [setChatFontSizeAdjustment]);

  const applyLiveStatusUpdate = useCallback((channelKey, liveStatus) => {
    // 녹화 종료 기준이 "1번 채널"일 때, autoHideOffline에 의해 zone이 재배치되기 전에
    // zone 1 채널의 오프라인 전환을 감지하여 녹화를 먼저 중지
    if (recordStopConditionRef.current === "zone1" && isRecordingRef.current) {
      const current = channelsRef.current[channelKey];
      if (current && current.isLive === true && liveStatus.isLive === false && current.zoneId === 1) {
        setIsRecording(false);
      }
    }

    setChannels((prev) => {
      const prevChannel = prev[channelKey];
      if (!prevChannel) return prev;

      const wasLive = prevChannel.isLive === true;
      const isNowOffline = liveStatus.isLive === false;

      if (autoHideOfflineRef.current && wasLive && isNowOffline && prevChannel.zoneId !== null) {
        const updated = structuredClone(prev);
        updated[channelKey] = { ...updated[channelKey], ...liveStatus, isVisible: false, zoneId: null };

        const visibleList = Object.values(updated)
          .filter((c) => c.isVisible)
          .sort((a, b) => (a.zoneId ?? Infinity) - (b.zoneId ?? Infinity));
        visibleList.forEach((c, index) => { updated[c.key].zoneId = index + 1; });

        window.localStorage.setItem(
          "channels",
          JSON.stringify(
            Object.fromEntries(
              Object.entries(updated).map(([key, ch]) => [key, { zoneId: ch.zoneId }])
            )
          )
        );
        return updated;
      }

      return { ...prev, [channelKey]: { ...prev[channelKey], ...liveStatus } };
    });
  }, [setChannels, setIsRecording]);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeToNextRefresh(60);
    setRefreshEpoch((prev) => prev + 1);

    try {
      const entries = Object.entries(channels);
      await Promise.all(
        entries.map(async ([channelKey, item]) => {
          try {
            const liveStatus = await getLiveStatus(item.id, item.platform);
            applyLiveStatusUpdate(channelKey, liveStatus);
          } catch (err) {
            console.error(`⚠️ ${item.id} 라이브 상태 갱신 실패:`, err);
          }
        })
      );
    } catch (err) {
      console.error("❌ 라이브 상태 갱신 실패:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 750);
    }
  }, [channels, refreshing, applyLiveStatusUpdate]);

  // zoneId가 부여된 채널만 갱신 (자동 60초 주기)
  const handleAutoRefreshZoned = useCallback(async () => {
    if (refreshingRef.current) return;
    setRefreshing(true);
    setTimeToNextRefresh(60);

    try {
      const entries = Object.entries(channelsRef.current).filter(([, item]) => item.zoneId !== null);
      await Promise.all(
        entries.map(async ([channelKey, item]) => {
          try {
            const liveStatus = await getLiveStatus(item.id, item.platform);
            applyLiveStatusUpdate(channelKey, liveStatus);
          } catch (err) {
            console.error(`⚠️ ${item.id} 라이브 상태 갱신 실패:`, err);
          }
        })
      );
    } catch (err) {
      console.error("❌ 라이브 상태 갱신 실패:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 750);
    }
  }, [applyLiveStatusUpdate]); // channels/refreshing은 ref로 참조하므로 deps 불필요

  // zoneId가 없는 채널만 갱신 (자동 10분 주기)
  const handleAutoRefreshUnzoned = useCallback(async () => {
    if (refreshingRef.current) return;
    setRefreshing(true);
    setTimeToNextListRefresh(600);

    try {
      const entries = Object.entries(channelsRef.current).filter(([, item]) => item.zoneId === null);
      await Promise.all(
        entries.map(async ([channelKey, item]) => {
          try {
            const liveStatus = await getLiveStatus(item.id, item.platform);
            setChannels((prev) => {
              // 갱신 도중 채널이 삭제/교체된 경우 무시 (유령 채널 생성 방지)
              if (!prev[channelKey]) return prev;
              return { ...prev, [channelKey]: { ...prev[channelKey], ...liveStatus } };
            });
          } catch (err) {
            console.error(`⚠️ ${item.id} 라이브 상태 갱신 실패:`, err);
          }
        })
      );
    } catch (err) {
      console.error("❌ 라이브 상태 갱신 실패:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 750);
    }
  }, [setChannels]); // channels/refreshing은 ref로 참조하므로 deps 불필요

  // zoneId 채널: 60초마다 자동 갱신 (수동 갱신 시 refreshEpoch 증가로 타이머 재시작)
  useEffect(() => {
    if (!hasZonedChannels) return;

    // 인터벌이 새로 시작되므로 카운트다운도 함께 리셋
    setTimeToNextRefresh(60);

    const interval = setInterval(() => {
      handleAutoRefreshZoned();
    }, 60000);

    return () => clearInterval(interval);
  }, [handleAutoRefreshZoned, hasZonedChannels, refreshEpoch]);

  // zoneId 없는 채널: 10분마다 자동 갱신
  useEffect(() => {
    if (!hasUnzonedChannels) return;

    // 인터벌이 새로 시작되므로 카운트다운도 함께 리셋
    setTimeToNextListRefresh(600);

    const interval = setInterval(() => {
      handleAutoRefreshUnzoned();
    }, 600000);

    return () => clearInterval(interval);
  }, [handleAutoRefreshUnzoned, hasUnzonedChannels]);

  useEffect(() => {
    if (Object.keys(channels).length === 0) return;

    const countdownInterval = setInterval(() => {
      setTimeToNextRefresh((prev) => (prev > 0 ? prev - 1 : 0));
      setTimeToNextListRefresh((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [channels]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      )
        return;
      if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey)
        return;
      if (isDragging) return;

      const key = event.key.toUpperCase();
      switch (key) {
        case "C":
          event.preventDefault();
          handleToggleController();
          break;
        case "S":
          event.preventDefault();
          setSettingsOpen((prev) => !prev);
          break;
        case "M":
          event.preventDefault();
          handleToggleTheme();
          break;
        case "T":
          event.preventDefault();
          handleToggleCurrentTime();
          break;
        case "P":
          event.preventDefault();
          if (viewCount > 0) handleToggleCurrentTimePosition();
          break;        case "V":
          event.preventDefault();
          handleTogglePointerEvents();
          break;
        case "R":
          event.preventDefault();
          handleRefresh();
          break;
        case "F":
          event.preventDefault();
          fullscreen();
          break;
        case "ARROWUP":
        case "ARROWDOWN":
          event.preventDefault();
          const landscapeRatios = Object.entries(canvas)
            .filter(([, orientations]) => orientations.landscape)
            .map(([group]) => `${group}-landscape`);
          const portraitRatios = Object.entries(canvas)
            .filter(([, orientations]) => orientations.portrait)
            .map(([group]) => `${group}-portrait`);
          const allRatios = [...landscapeRatios, ...portraitRatios];
          const currentIndex = allRatios.indexOf(ratio);
          if (currentIndex === -1) return;
          let nextIndex;
          if (key === 'ARROWDOWN') {
            nextIndex = (currentIndex + 1) % allRatios.length;
          } else {
            nextIndex = (currentIndex - 1 + allRatios.length) % allRatios.length;
          }
          const nextRatio = allRatios[nextIndex];
          if (nextRatio !== ratio) {
            selectRatio(nextRatio);
          }
          break;
        case "ARROWRIGHT":
          event.preventDefault();
          if (chatFontSizeAdjustment < 10) {
            handleChangeChatFontSize(null, chatFontSizeAdjustment + 1);
          }
          break;
        case "ARROWLEFT":
          event.preventDefault();
          if (chatFontSizeAdjustment > -10) {
            handleChangeChatFontSize(null, chatFontSizeAdjustment - 1);
          }
          break;
        default:
          const keyNumber = parseInt(event.key, 10);
          if (!isNaN(keyNumber)) {
            const [ratioKey] = ratio.split("-");
            const currentLayouts = canvas[ratioKey]?.[ratio.split("-")[1]]?.layouts?.[viewCount];
            if (!currentLayouts) return;
            const layoutKeys = getVisibleLayoutKeys(currentLayouts);
            let targetIndex;
            if (keyNumber === 0 && layoutKeys.length > 0) {
              targetIndex = layoutKeys.length - 1;
            } else if (keyNumber > 0 && keyNumber <= layoutKeys.length) {
              targetIndex = keyNumber - 1;
            } else {
              return;
            }
            const targetLayout = layoutKeys[targetIndex];
            if (targetLayout !== layoutType) {
              const historyKey = `${ratio}-${viewCount}`;
              setViewPresets((prev) => ({
                ...prev,
                [historyKey]: { ...prev[historyKey], layoutType: targetLayout },
              }));
            }
          }
          break;
      }
    };

    // 메인 창 + (리모컨으로 분리된 경우) 컴포넌트가 올라간 팝업 창 양쪽에 등록.
    // 같은 창이면 Set이 중복을 제거하므로 핸들러가 두 번 실행되지 않는다.
    const targets = new Set([window]);
    const ownerWin = rootRef.current?.ownerDocument?.defaultView;
    if (ownerWin) targets.add(ownerWin);
    targets.forEach((t) => t.addEventListener("keydown", handleKeyDown));
    return () => targets.forEach((t) => t.removeEventListener("keydown", handleKeyDown));
  }, [
    controllerPopupOpen,
    handleToggleController,
    setSettingsOpen,
    handleToggleTheme,
    handleToggleCurrentTime,
    handleToggleCurrentTimePosition,
    handleTogglePointerEvents,
    handleRefresh,
    fullscreen,
    isDragging,
    chatFontSizeAdjustment,
    handleChangeChatFontSize,
    ratio,
    selectRatio,
    viewCount,
    layoutType,
    setViewPresets,
  ]);

  return (
    <Box
      ref={rootRef}
      sx={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <Tooltip
        slotProps={tooltipSlotProps}
        title={
          <>
            {controllerExpanded ? "접기" : "펴기"}{" "}
            <HotkeySpan component="span" pointcolor={pointColor}>(C)</HotkeySpan>
          </>
        }
      >
        <span>
          <IconButton onClick={handleToggleController}>
            {controllerExpanded ? (
              <ChevronRightIcon sx={iconStyle} />
            ) : (
              <ChevronLeftIcon sx={iconStyle} />
            )}
          </IconButton>
        </span>
      </Tooltip>

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Tooltip
          slotProps={tooltipSlotProps}
          placement="top"
          title={
            <>
              설정{" "}
              <HotkeySpan component="span" pointcolor={pointColor}>(S)</HotkeySpan>
            </>
          }
        >
          <IconButton
            onClick={() => setSettingsOpen((prev) => !prev)}
          >
            <SettingsIcon sx={{ ...iconStyle, color: settingsOpen ? activePointColor : undefined }} />
          </IconButton>
        </Tooltip>

        {controllerExpanded && (
          <>
            <Tooltip
              slotProps={tooltipSlotProps}
              title={
                <>
                  채널 정보 갱신{" "}
                  <HotkeySpan component="span" pointcolor={pointColor}>(R)</HotkeySpan>
                  {hasZonedChannels ? (
                    <>{" "}{formatTimeLeft(timeToNextRefresh)}</>
                  ) : hasUnzonedChannels ? (
                    <>{" "}{formatTimeLeft(timeToNextListRefresh)}</>
                  ) : null}
                </>
              }
            >
              <span>
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing || Object.keys(channels).length === 0}
                  sx={{
                    "& .MuiSvgIcon-root": refreshing
                      ? {
                        animation: "rotate360 0.750s ease-in-out",
                        "@keyframes rotate360": rotate360,
                      }
                      : {},
                    "&.Mui-disabled .MuiSvgIcon-root": refreshing && { color: "primary.main" },
                  }}
                >
                  <RefreshIcon sx={iconStyle} />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip
              slotProps={tooltipSlotProps}
              title={isRecording ? "녹화중" : "녹화"}
            >
              <span>
                <IconButton
                  onClick={handleRecordButtonClick}
                  disabled={!Object.values(channels).some(c => c.isVisible) && !isRecording}
                  sx={{
                    "& .MuiSvgIcon-root": {
                      color: isRecording
                        ? (pointColor === 'default' ? "red" : "primary.main")
                        : "inherit",
                    },
                  }}
                >
                  <FiberManualRecordIcon sx={iconStyle} />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip
              slotProps={tooltipSlotProps}
              title={controllerPopupOpen ? "리모컨 닫기" : "리모컨 분리"}
            >
              <IconButton
                onClick={() => {
                  const opening = !controllerPopupOpen;
                  // 분리 시 펴기를 먼저 확정해, 접힘(80)→펴기(290) 폭 변화로 인한 깜빡임 방지
                  if (opening) setControllerExpanded(true);
                  setControllerPopupOpen(opening);
                }}
              >
                <CropPortraitIcon sx={{ ...iconStyle, color: controllerPopupOpen ? activePointColor : undefined }} />
              </IconButton>
            </Tooltip>

            <Tooltip
              slotProps={tooltipSlotProps}
              title={
                controllerPopupOpen ? (
                  "전체화면은 메인 창에서 F키로 사용"
                ) : (
                  <>
                    전체화면{" "}
                    <HotkeySpan component="span" pointcolor={pointColor}>(F)</HotkeySpan>
                  </>
                )
              }
            >
              <span>
                <IconButton
                  onClick={fullscreen}
                  disabled={
                    controllerPopupOpen ||
                    Object.values(channels).filter(c => c.isVisible).length === 0
                  }
                >
                  <FullscreenIcon sx={iconStyle} />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
}