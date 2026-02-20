"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon,
  FormatIndentIncrease as FormatIndentIncreaseIcon,
  FormatIndentDecrease as FormatIndentDecreaseIcon,
  Settings as SettingsIcon,
  FiberManualRecord as FiberManualRecordIcon,
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
} from "@/atoms/setting";
import { snackbarAtom, isDraggingAtom, isRecordingAtom, settingsOpenAtom } from "@/atoms/ui";
import { POINT_COLORS } from "@/data/color";

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
  const setSettingsOpen = useSetAtom(settingsOpenAtom);
  const [timeToNextRefresh, setTimeToNextRefresh] = useState(60);
  const setSnackbar = useSetAtom(snackbarAtom);
  const [isRecording, setIsRecording] = useAtom(isRecordingAtom);
  const [autoRecordEnabled, setAutoRecordEnabled] = useAtom(autoRecordEnabledAtom);
  const prevZone1LiveRef = React.useRef(undefined);

  const activePointColor =
    POINT_COLORS[pointColor]?.[themeMode] || POINT_COLORS["default"][themeMode];

  useEffect(() => {
    const zone1Channel = Object.values(channels).find((c) => c.zoneId === 1);
    const isLive = zone1Channel?.isLive === true;

    // 활성화된(Sortable) 채널이 하나도 없으면 녹화 중지
    const visibleChannelsCount = Object.values(channels).filter((c) => c.isVisible).length;
    if (isRecording && visibleChannelsCount === 0) {
      setIsRecording(false);
    }

    if (autoRecordEnabled) {
      if (prevZone1LiveRef.current === false && isLive) {
        setIsRecording(true);
      }
      if (prevZone1LiveRef.current === true && !isLive) {
        setIsRecording(false);
      }
    }

    prevZone1LiveRef.current = isLive;
  }, [channels, autoRecordEnabled, setIsRecording, isRecording]);

  const handleRecordButtonClick = () => {
    setIsRecording((prev) => !prev);
  };

  const handleToggleController = () => {
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
  };

  const handleChangeTheme = (newMode) => {
    const validation = validateThemeMode(newMode);
    if (validation === true) {
      setThemeMode(newMode);
      window.localStorage.setItem("themeMode", newMode);
    } else {
      console.error("테마 모드 유효성 검사 실패:", validation);
    }
  };

  const handleToggleTheme = () => {
    const nextState = themeMode === "light" ? "dark" : "light";
    handleChangeTheme(nextState);
  };

  const handleChangePointerEvents = (event, newMode) => {
    if (newMode !== null) {
      setPointerEventsEnabled(newMode);
      window.localStorage.setItem(
        "pointerEventsEnabled",
        JSON.stringify(newMode)
      );
    }
  };

  const handleTogglePointerEvents = () => {
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
  };

  const handleToggleCurrentTime = () => {
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
  };

  const handleChangePointColor = (color) => {
    setPointColor(color);
    window.localStorage.setItem("pointColor", JSON.stringify(color));
  };

  const handleChangeChatFontSize = (event, newValue) => {
    setChatFontSizeAdjustment(newValue);
    window.localStorage.setItem(
      "chatFontSizeAdjustment",
      JSON.stringify(newValue)
    );
  };

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeToNextRefresh(60);

    try {
      const entries = Object.entries(channels);
      await Promise.all(
        entries.map(async ([channelId, item]) => {
          try {
            const liveStatus = await getLiveStatus(channelId, item.platform);
            setChannels((prev) => ({
              ...prev,
              [channelId]: { ...prev[channelId], ...liveStatus },
            }));
          } catch (err) {
            console.error(`⚠️ ${channelId} 라이브 상태 갱신 실패:`, err);
          }
        })
      );
    } catch (err) {
      console.error("❌ 라이브 상태 갱신 실패:", err);
    } finally {
      setTimeout(() => setRefreshing(false), 750);
    }
  }, [channels, refreshing, setChannels]);

  useEffect(() => {
    if (Object.keys(channels).length === 0) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, 60000);

    return () => clearInterval(interval);
  }, [handleRefresh, channels]);

  useEffect(() => {
    if (Object.keys(channels).length === 0) return;

    const countdownInterval = setInterval(() => {
      setTimeToNextRefresh((prev) => (prev > 0 ? prev - 1 : 0));
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
        case "V":
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
          event.preventDefault();
          if (chatFontSizeAdjustment < 10) {
            handleChangeChatFontSize(null, chatFontSizeAdjustment + 1);
          }
          break;
        case "ARROWDOWN":
          event.preventDefault();
          if (chatFontSizeAdjustment > -5) {
            handleChangeChatFontSize(null, chatFontSizeAdjustment - 1);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleToggleController,
    handleToggleCurrentTime,
    handleTogglePointerEvents,
    handleRefresh,
    fullscreen,
    isDragging,
  ]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <Tooltip
        slotProps={tooltipSlotProps}
        title={
          <>
            {controllerExpanded ? "컨트롤러 접기" : "컨트롤러 펴기"}{" "}
            <HotkeySpan component="span" pointcolor={pointColor}>(C)</HotkeySpan>
          </>
        }
      >
        <IconButton onClick={handleToggleController}>
          {controllerExpanded ? (
            <FormatIndentIncreaseIcon sx={iconStyle} />
          ) : (
            <FormatIndentDecreaseIcon sx={iconStyle} />
          )}
        </IconButton>
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
          <IconButton onClick={() => setSettingsOpen(true)}>
            <SettingsIcon sx={iconStyle} />
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
                  {" "}{timeToNextRefresh}
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
                  disabled={Object.values(channels).filter(c => c.isVisible).length === 0 && !isRecording}
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
              title={
                <>
                  전체화면{" "}
                  <HotkeySpan component="span" pointcolor={pointColor}>(F)</HotkeySpan>
                </>
              }
            >
              <span>
                <IconButton
                  onClick={fullscreen}
                  disabled={Object.values(channels).filter(c => c.isVisible).length === 0}
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