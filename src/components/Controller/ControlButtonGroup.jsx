"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Popover,
  TextField,
  Button,
  CircularProgress,
  Switch,
  Typography,
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
} from "@mui/material";
import {
  Mouse as MouseIcon,
  PanTool as PanToolIcon,
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
  FormatIndentIncrease as FormatIndentIncreaseIcon,
  FormatIndentDecrease as FormatIndentDecreaseIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  ImportExport as ImportExportIcon,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
  Settings as SettingsIcon,
  FiberManualRecord as FiberManualRecordIcon,
} from "@mui/icons-material";
import { getLiveStatus } from "@/api/live";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { 
  validatePreferences, 
  applyPreferences, 
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
  recordQualityAtom,
  recordFrameRateAtom,
} from "@/atoms/setting";
import { snackbarAtom, isDraggingAtom, isRecordingAtom } from "@/atoms/ui";
import { POINT_COLORS } from "@/data/color";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-json";

const iconStyle = { fontSize: "2.4rem" };
const smallIconStyle = { fontSize: "2.0rem" };

const tooltipSlotProps = {
  tooltip: {
    sx: {
      fontSize: "1.2rem",
    },
  },
};

const sliderMarks = Array.from({ length: 16 }, (_, i) => ({ value: i - 5 }));

const CustomMark = ({ style, ownerState, markActive, ...props }) => {
  const index = props["data-index"];
  const mark = sliderMarks[index];

  if (!mark) return <span style={style} {...props} />;

  return (
    <Tooltip
      title={mark.value > 0 ? `+${mark.value}` : mark.value}
      placement="top"
      arrow
      slotProps={tooltipSlotProps}
    >
      <Box
        component="span"
        style={style}
        {...props}
        sx={{
          position: "absolute",
          width: 4,
          height: 4,
          borderRadius: "50%",
          bgcolor: "text.quaternary",
          top: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0.5,
          "&::after": {
            content: '""',
            position: "absolute",
            top: -5,
            bottom: -5,
            left: -1.5,
            right: -1.5,
          },
          "&:hover": {
            opacity: 1,
            bgcolor: "primary.main",
            transform: "translate(-50%, -50%) scale(1.5)",
          },
        }}
      />
    </Tooltip>
  );
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

  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [data, setData] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [timeToNextRefresh, setTimeToNextRefresh] = useState(60);
  const setSnackbar = useSetAtom(snackbarAtom);
  const [isRecording, setIsRecording] = useAtom(isRecordingAtom);
  const [autoRecordEnabled, setAutoRecordEnabled] = useAtom(autoRecordEnabledAtom);
  const [recordQuality, setRecordQuality] = useAtom(recordQualityAtom);
  const [recordFrameRate, setRecordFrameRate] = useAtom(recordFrameRateAtom);
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

  const handleToggleAutoRecord = () => {
    setAutoRecordEnabled((prev) => {
      const nextState = !prev;
      const validation = validateBoolean(nextState, "autoRecordEnabled");
      if (validation === true) {
        window.localStorage.setItem(
          "autoRecordEnabled",
          JSON.stringify(nextState)
        );
      } else {
        console.error("autoRecordEnabled 유효성 검사 실패:", validation);
      }
      return nextState;
    });
  };

  const handleChangeRecordQuality = (event, newQuality) => {
    if (newQuality !== null) {
      setRecordQuality(newQuality);
      window.localStorage.setItem("recordQuality", JSON.stringify(newQuality));
    }
  };

  const handleChangeRecordFrameRate = (event, newFrameRate) => {
    if (newFrameRate !== null) {
      setRecordFrameRate(newFrameRate);
      window.localStorage.setItem(
        "recordFrameRate",
        JSON.stringify(newFrameRate)
      );
    }
  };

  const handleRecordButtonClick = () => {
    setIsRecording((prev) => !prev);
  };

  const getLocalStorageDataString = useCallback(() => {
    const localStorageData = [
      "channels",
      "layout",
      "ratio",
      "pointerEventsEnabled",
      "showCurrentTime",
      "controllerExpanded",
      "themeMode",
      "pointColor",
      "chatFontSizeAdjustment",
      "autoRecordEnabled",
      "recordQuality",
      "recordFrameRate",
    ].reduce((obj, key) => {
      const value = window.localStorage.getItem(key);
      if (value) {
        try {
          obj[key] = JSON.parse(value);
        } catch (e) {
          obj[key] = value;
        }
      }
      return obj;
    }, {});
    return JSON.stringify(localStorageData, null, 2);
  }, []);

  const handleOpenSettingsPopover = (event) => {
    setData(getLocalStorageDataString());
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleCopy = () => {
    const dataString = getLocalStorageDataString();
    setData(dataString);
    navigator.clipboard.writeText(dataString);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 750);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 7500)
      );

      const validationResult = await Promise.race([
        validatePreferences(data),
        timeoutPromise,
      ]);

      if (typeof validationResult === "string") {
        setSnackbar({
          open: true,
          message: validationResult,
          severity: "error",
        });
        setSaveError(true);
        setTimeout(() => setSaveError(false), 750);
        return;
      }

      const parsedData = JSON.parse(data);

      applyPreferences(parsedData);

      
      setSaveSuccess(true);
      setSnackbar({
        open: true,
        message: "설정이 성공적으로 저장되었습니다!",
        severity: "success",
      });
      setTimeout(() => {
        setSaveSuccess(false);
        setSettingsAnchorEl(null); // 팝오버 닫기
        window.location.reload();
      }, 750);
    } catch (e) {
      let message;
      if (e.message === "Timeout") {
        message = "유효성 검사 시간이 초과되었습니다.";
      } else {
        message = "데이터를 저장하는 중 오류가 발생했습니다.";
        console.error("Failed to parse and save data:", e);
      }
      setSnackbar({
        open: true,
        message,
        severity: "error",
      });
      setSaveError(true);
      setTimeout(() => setSaveError(false), 750);
    } finally {
      setIsSaving(false);
    }
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

      switch (event.key.toUpperCase()) {
        case "S":
          event.preventDefault();
          handleToggleController();
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

  useEffect(() => {
    if (settingsAnchorEl) {
      setData(getLocalStorageDataString());
    }
  }, [
    settingsAnchorEl,
    themeMode,
    pointColor,
    chatFontSizeAdjustment,
    showCurrentTime,
    pointerEventsEnabled,
    controllerExpanded,
    channels,
    autoRecordEnabled,
    recordQuality,
    recordFrameRate,
    getLocalStorageDataString,
  ]);

  const rotate360 = {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  };

  const successAnimation = {
    "100%": { color: "success.main" },
  };

  const errorAnimation = {
    "100%": { color: "error.main" },
  };

  const availableThemes = [
    { mode: "light", color: "#ffffff", label: "Light" },
    { mode: "dark", color: "#333333", label: "Dark" },
  ];

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
            {controllerExpanded ? "사이드 접기" : "사이드 펴기"}{" "}
            <Box
              component="span"
              sx={{ color: pointColor === 'default' ? "#00bcd4" : "primary.main", fontWeight: "bold" }}
            >
              (S)
            </Box>
          </>
        }
      >
        <IconButton
          onClick={handleToggleController}
        >
          {controllerExpanded ? (
            <FormatIndentIncreaseIcon sx={iconStyle} />
          ) : (
            <FormatIndentDecreaseIcon sx={iconStyle} />
          )}
        </IconButton>
      </Tooltip>

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Tooltip slotProps={tooltipSlotProps} placement="top" title="설정">
          <IconButton
            onClick={handleOpenSettingsPopover}
            sx={{
              "& .MuiSvgIcon-root": Boolean(settingsAnchorEl)
                ? { color: "primary.main" } // 포인트 컬러 적용
                : {},
            }}
          >
            <SettingsIcon sx={iconStyle} />
          </IconButton>
        </Tooltip>
        <Popover
          open={Boolean(settingsAnchorEl)}
          anchorEl={settingsAnchorEl}
          onClose={() => setSettingsAnchorEl(null)}
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
        >
          <Box
            sx={{
              p: 2,
              width: 340,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              backgroundColor: "background.level1",
            }}
          >
            <Typography sx={{ fontWeight: "bold", fontSize: "1.6rem" }}>
              설정
            </Typography>

            {/* 테마 설정 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: "1.4rem" }}>
                테마{" "}
                <Box
                  component="span"
                  sx={{ color: pointColor === 'default' ? "#00bcd4" : "primary.main", fontWeight: "bold" }}
                >
                  (M)
                </Box>
              </Typography>
              <Stack direction="row" spacing={1}>
                {availableThemes.map((t) => (
                  <Tooltip slotProps={tooltipSlotProps} placement="top" title={t.label} key={t.mode}>
                    <Box
                      onClick={() => handleChangeTheme(t.mode)}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: t.color,
                        border:
                          themeMode === t.mode
                            ? "3px solid"
                            : "1px solid rgba(0,0,0,0.1)",
                        borderColor:
                          themeMode === t.mode ? "primary.main" : "divider",
                        cursor: "pointer",
                        boxShadow:
                          themeMode === t.mode ? 2 : 0,
                        transition: "all 0.2s",
                        "&:hover": {
                          transform: "scale(1.1)",
                        },
                      }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>

            {/* 포인트 컬러 설정 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: "1.4rem" }}>포인트 컬러</Typography>
              <Stack direction="row" spacing={1}>
                {Object.values(POINT_COLORS).map((p) => (
                  <Tooltip
                    slotProps={tooltipSlotProps}
                    placement="top"
                    title={p.label}
                    key={p.value}
                  >
                    <Box
                      onClick={() => handleChangePointColor(p.value)}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: p[themeMode],
                        border:
                          pointColor === p.value
                            ? "3px solid"
                            : "1px solid rgba(0,0,0,0.1)",
                        borderColor:
                          pointColor === p.value ? "primary.main" : "divider",
                        cursor: "pointer",
                        boxShadow: pointColor === p.value ? 2 : 0,
                        transition: "all 0.2s",
                        "&:hover": {
                          transform: "scale(1.1)",
                        },
                      }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Box>

            {/* 현재 시간 표시 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: "1.4rem" }}>
                현재 시간 표시{" "}
                <Box
                  component="span"
                  sx={{ color: pointColor === 'default' ? "#00bcd4" : "primary.main", fontWeight: "bold" }}
                >
                  (T)
                </Box>
              </Typography>
              <Switch
                checked={showCurrentTime}
                onChange={handleToggleCurrentTime}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "primary.main",
                    opacity: 0.65,
                  },
                  "& .MuiSwitch-track": {
                    backgroundColor: "rgba(0,0,0,0.5)",
                  },
                }}
              />
            </Box>

            {/* 화면 조작 모드 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: "1.4rem" }}>
                {pointerEventsEnabled ? "화면 조작 모드" : "화면 이동 모드"}{" "}
                <Box
                  component="span"
                  sx={{ color: pointColor === 'default' ? "#00bcd4" : "primary.main", fontWeight: "bold" }}
                >
                  (V)
                </Box>
              </Typography>
              <ToggleButtonGroup
                value={pointerEventsEnabled}
                exclusive
                onChange={handleChangePointerEvents}
                aria-label="pointer events"
                sx={{
                  "& .MuiToggleButton-root.Mui-selected": {
                    backgroundColor: pointColor === 'default' ? "#5f5f5f" : "primary.main",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: pointColor === 'default' ? "#5f5f5f" : "primary.main",
                      filter: "brightness(0.9)",
                    },
                  },
                }}
              >
                <ToggleButton value={false} aria-label="pan tool">
                  <Tooltip slotProps={tooltipSlotProps} title="화면 이동 모드" placement="top">
                    <PanToolIcon />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value={true} aria-label="mouse">
                  <Tooltip slotProps={tooltipSlotProps} title="화면 조작 모드" placement="top">
                    <MouseIcon />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* 채팅창 글자 크기 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: "1.4rem" }}>
                채팅창 글자 크기
                <Box
                  component="span"
                  sx={{ color: "text.secondary", fontSize: "1.2rem", ml: 0.5 }}
                >
                  ({chatFontSizeAdjustment > 0 ? "+" : ""}
                  {chatFontSizeAdjustment})
                </Box>
              </Typography>
              <Box
                sx={{ width: 170, px: 1 }}
                onMouseEnter={() => setIsSliderHovered(true)}
                onMouseLeave={() => setIsSliderHovered(false)}
              >
                <Slider
                  size="small"
                  value={chatFontSizeAdjustment}
                  min={-5}
                  max={10}
                  step={1}
                  valueLabelDisplay={isSliderHovered ? "on" : "auto"}
                  marks={sliderMarks}
                  slots={{ mark: CustomMark }}
                  onChange={handleChangeChatFontSize}
                  slotProps={{
                    thumb: {
                      sx: {
                        transition: "0.2s",
                        "&::before": { display: "none" },
                        "&:hover, &.Mui-focusVisible": {
                          boxShadow: (theme) =>
                            `0px 0px 0px 6px ${theme.palette.primary.opacity}`,
                        },
                      },
                    },
                  }}
                  sx={{
                    color: "primary.main",
                    "& .MuiSlider-mark": {
                      backgroundColor: "transparent",
                    },
                  }}
                />
              </Box>
            </Box>

            <Divider />

            {/* 녹화 설정 헤더 */}
            <Typography sx={{ fontWeight: "bold", fontSize: "1.4rem" }}>
              녹화 설정
            </Typography>

            {/* 자동 녹화 설정 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: "1.4rem" }}>
                자동 녹화{" "}
                <Box
                  component="span"
                  sx={{ color: "text.secondary", fontSize: "1.2rem" }}
                >
                  (1번 Zone)
                </Box>
              </Typography>
              <Switch
                checked={autoRecordEnabled}
                onChange={handleToggleAutoRecord}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "primary.main",
                    opacity: 0.65,
                  },
                  "& .MuiSwitch-track": {
                    backgroundColor: "rgba(0,0,0,0.5)",
                  },
                }}
              />
            </Box>

            {/* 녹화 화질 설정 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: "1.4rem" }}>녹화 화질</Typography>
              <ToggleButtonGroup
                value={recordQuality}
                exclusive
                onChange={handleChangeRecordQuality}
                size="small"
                sx={{
                  "& .MuiToggleButton-root.Mui-selected": {
                    backgroundColor:
                      pointColor === "default" ? "#5f5f5f" : "primary.main",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor:
                        pointColor === "default" ? "#5f5f5f" : "primary.main",
                      filter: "brightness(0.9)",
                    },
                  },
                }}
              >
                <ToggleButton value="high">
                  <Typography sx={{ fontSize: "1.2rem" }}>High</Typography>
                </ToggleButton>
                <ToggleButton value="medium">
                  <Typography sx={{ fontSize: "1.2rem" }}>Mid</Typography>
                </ToggleButton>
                <ToggleButton value="low">
                  <Typography sx={{ fontSize: "1.2rem" }}>Low</Typography>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* 녹화 프레임 설정 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: "1.4rem" }}>녹화 프레임</Typography>
              <ToggleButtonGroup
                value={recordFrameRate}
                exclusive
                onChange={handleChangeRecordFrameRate}
                size="small"
                sx={{
                  "& .MuiToggleButton-root.Mui-selected": {
                    backgroundColor:
                      pointColor === "default" ? "#5f5f5f" : "primary.main",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor:
                        pointColor === "default" ? "#5f5f5f" : "primary.main",
                      filter: "brightness(0.9)",
                    },
                  },
                }}
              >
                <ToggleButton value={60}>
                  <Typography sx={{ fontSize: "1.2rem" }}>60</Typography>
                </ToggleButton>
                <ToggleButton value={30}>
                  <Typography sx={{ fontSize: "1.2rem" }}>30</Typography>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Divider />

            {/* 설정 동기화 */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography sx={{ fontSize: "1.4rem" }}>
                설정 동기화
              </Typography>
              <Box
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.paper",
                  overflow: "auto",
                  height: "135px",
                  transition: "border-color 0.2s",
                  "&:hover": {
                    borderColor: "text.primary",
                  },
                  "&:focus-within": {
                    borderColor: "primary.main",
                    borderWidth: 2,
                    m: "-1px",
                  },
                  "& .token.property": { color: activePointColor },
                  "& .token.string": {
                    color: themeMode === "dark" ? "#ce9178" : "#a31515",
                  },
                  "& .token.number": {
                    color: themeMode === "dark" ? "#b5cea8" : "#098658",
                  },
                  "& .token.boolean": {
                    color: themeMode === "dark" ? "#9cdcfe" : "#0451a5",
                  },
                  "& .token.punctuation": { color: "text.secondary" },
                  "& textarea": { outline: "none" },
                }}
              >
                <Editor
                  value={data}
                  onValueChange={(code) => setData(code)}
                  highlight={(code) =>
                    Prism.highlight(code, Prism.languages.json, "json")
                  }
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: "1.2rem",
                    minHeight: "100%",
                  }}
                  placeholder="설정 데이터를 여기에 붙여넣거나 복사하세요."
                />
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}
              >
                <Tooltip
                  slotProps={tooltipSlotProps}
                  title={copySuccess ? "복사 완료!" : "현재 설정 복사"}
                >
                  <span>
                    <IconButton
                      disabled={copySuccess}
                      onClick={handleCopy}
                      size="small"
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        animation: copySuccess
                          ? "successAnimation 0.750s ease"
                          : "none",
                        "@keyframes successAnimation": successAnimation,
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip
                  slotProps={tooltipSlotProps}
                  title={
                    saveSuccess
                      ? "저장 완료!"
                      : saveError
                      ? "저장 실패"
                      : "설정 저장"
                  }
                >
                  <span>
                    <IconButton
                      disabled={saveSuccess || isSaving}
                      onClick={handleSave}
                      size="small"
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        animation: saveSuccess
                          ? "successAnimation 0.750s ease"
                          : saveError
                          ? "errorAnimation 0.750s ease"
                          : "none",
                        "@keyframes successAnimation": successAnimation,
                        "@keyframes errorAnimation": errorAnimation,
                      }}
                    >
                      {isSaving ? (
                        <CircularProgress size={12.5} />
                      ) : (
                        <CheckIcon fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Popover>

        {controllerExpanded && (
          <>
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
                채널 정보 갱신{" "}
                <Box
                  component="span"
                  sx={{ color: pointColor === 'default' ? "#00bcd4" : "primary.main", fontWeight: "bold" }}
                >
                  (R)
                </Box>
                {" "}{timeToNextRefresh}
              </>
            }
            >
              <span>
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{
                    "& .MuiSvgIcon-root": refreshing
                      ? {
                          animation: "rotate360 0.750s ease-in-out",
                          "@keyframes rotate360": rotate360,
                          color: "primary.main", // 갱신 중일 때 포인트 컬러
                        }
                      : {},
                    "&.Mui-disabled .MuiSvgIcon-root": {
                      color: "text.quaternary",
                    },
                  }}
                >
                  <RefreshIcon sx={iconStyle} />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip
              slotProps={tooltipSlotProps}
              title={
                <>
                  전체화면{" "}
                  <Box
                    component="span"
                    sx={{ color: pointColor === 'default' ? "#00bcd4" : "primary.main", fontWeight: "bold" }}
                  >
                    (F)
                  </Box>
                </>
              }
            >
              <IconButton onClick={fullscreen}>
                <FullscreenIcon sx={iconStyle} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
}