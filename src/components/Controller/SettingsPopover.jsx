"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Popover,
  Switch,
  Typography,
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
} from "@mui/material";
import {
  Mouse as MouseIcon,
  PanTool as PanToolIcon,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { useAtom, useSetAtom } from "jotai";
import { 
  validatePreferences, 
  applyPreferences, 
  validateThemeMode,
  validateBoolean 
} from "@/utils/preferences";
import {
  pointerEventsEnabledAtom,
  showCurrentTimeAtom,
  themeModeAtom,
  pointColorAtom,
  chatFontSizeAdjustmentAtom,
  autoRecordEnabledAtom,
  recordQualityAtom,
  recordFrameRateAtom,
  recordCodecAtom,
  recordSoundEnabledAtom,
  recordSoundTypeAtom,
  recordSoundVolumeAtom,
} from "@/atoms/setting";
import { snackbarAtom } from "@/atoms/ui";
import { POINT_COLORS } from "@/data/color";
import { playNotificationSound } from "@/utils/audio";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-json";

const tooltipSlotProps = {
  tooltip: {
    sx: {
      fontSize: "1.2rem",
    },
  },
};

const sliderMarks = Array.from({ length: 16 }, (_, i) => ({ value: i - 5 }));
const volumeSliderMarks = Array.from({ length: 9 }, (_, i) => ({ value: i * 25 }));

export default function SettingsPopover({ anchorEl, onClose }) {
  const [pointerEventsEnabled, setPointerEventsEnabled] = useAtom(
    pointerEventsEnabledAtom
  );
  const [showCurrentTime, setShowCurrentTime] = useAtom(showCurrentTimeAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const [pointColor, setPointColor] = useAtom(pointColorAtom);
  const [chatFontSizeAdjustment, setChatFontSizeAdjustment] = useAtom(
    chatFontSizeAdjustmentAtom
  );
  const [autoRecordEnabled, setAutoRecordEnabled] = useAtom(autoRecordEnabledAtom);
  const [recordQuality, setRecordQuality] = useAtom(recordQualityAtom);
  const [recordFrameRate, setRecordFrameRate] = useAtom(recordFrameRateAtom);
  const [recordCodec, setRecordCodec] = useAtom(recordCodecAtom);
  const [recordSoundEnabled, setRecordSoundEnabled] = useAtom(recordSoundEnabledAtom);
  const [recordSoundType, setRecordSoundType] = useAtom(recordSoundTypeAtom);
  const [recordSoundVolume, setRecordSoundVolume] = useAtom(recordSoundVolumeAtom);
  
  const setSnackbar = useSetAtom(snackbarAtom);

  const [data, setData] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [isVolumeSliderHovered, setIsVolumeSliderHovered] = useState(false);

  const activePointColor =
    POINT_COLORS[pointColor]?.[themeMode] || POINT_COLORS["default"][themeMode];

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
      "recordCodec",
      "recordSoundEnabled",
      "recordSoundType",
      "recordSoundVolume",
      "selectedSearchPlatform",
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

  useEffect(() => {
    if (anchorEl) {
      setData(getLocalStorageDataString());
    }
  }, [
    anchorEl,
    themeMode,
    pointColor,
    chatFontSizeAdjustment,
    showCurrentTime,
    pointerEventsEnabled,
    autoRecordEnabled,
    recordQuality,
    recordFrameRate,
    recordCodec,
    recordSoundEnabled,
    recordSoundType,
    recordSoundVolume,
    getLocalStorageDataString,
  ]);

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

  const handleChangeRecordCodec = (event, newCodec) => {
    if (newCodec !== null) {
      setRecordCodec(newCodec);
      window.localStorage.setItem(
        "recordCodec",
        JSON.stringify(newCodec)
      );
    }
  };

  const handleToggleRecordSound = () => {
    setRecordSoundEnabled((prev) => {
      const nextState = !prev;
      window.localStorage.setItem("recordSoundEnabled", JSON.stringify(nextState));
      setData(getLocalStorageDataString());
      if (nextState) {
        playNotificationSound(recordSoundType, recordSoundVolume);
      }
      return nextState;
    });
  };

  const handleChangeRecordSoundType = (event) => {
    const newType = event.target.value;
    setRecordSoundType(newType);
    window.localStorage.setItem("recordSoundType", JSON.stringify(newType));
    setData(getLocalStorageDataString());
    playNotificationSound(newType, recordSoundVolume);
  };

  const handleChangeRecordSoundVolume = (event, newVolume) => {
    setRecordSoundVolume(newVolume);
    window.localStorage.setItem("recordSoundVolume", JSON.stringify(newVolume));
    setData(getLocalStorageDataString());
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

      const parsedData = data.trim() === "" ? {} : JSON.parse(data);

      applyPreferences(parsedData);

      setSaveSuccess(true);
      setSnackbar({
        open: true,
        message: "설정이 성공적으로 저장되었습니다!",
        severity: "success",
      });
      setTimeout(() => {
        setSaveSuccess(false);
        onClose(); 
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

  const handleChangeTheme = (newMode) => {
    const validation = validateThemeMode(newMode);
    if (validation === true) {
      setThemeMode(newMode);
    } else {
      console.error("테마 모드 유효성 검사 실패:", validation);
    }
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
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
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

        <Divider />

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

        {/* 녹화 코덱 설정 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontSize: "1.4rem" }}>녹화 코덱</Typography>
          <ToggleButtonGroup
            value={recordCodec}
            exclusive
            onChange={handleChangeRecordCodec}
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
            <ToggleButton value="h264">
              <Typography sx={{ fontSize: "1.2rem" }}>H.264</Typography>
            </ToggleButton>
            <ToggleButton value="vp9">
              <Typography sx={{ fontSize: "1.2rem" }}>VP9</Typography>
            </ToggleButton>
            <ToggleButton value="vp8">
              <Typography sx={{ fontSize: "1.2rem" }}>VP8</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* 녹화 알림음 설정 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontSize: "1.4rem", whiteSpace: "nowrap" }}>
            녹화 알림음
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* 알림음 타입 선택 드롭다운 */}
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={recordSoundType}
                onChange={handleChangeRecordSoundType}
                disabled={!recordSoundEnabled}
                sx={{
                  height: 30,
                  fontSize: "1.2rem",
                  color: pointColor === "default" ? "inherit" : "primary.main",
                  ".MuiSelect-select": {
                    paddingTop: "4px",
                    paddingBottom: "4px",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      pointColor === "default"
                        ? "rgba(140, 140, 140, 0.5)"
                        : "primary.main",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      pointColor === "default"
                        ? "text.primary"
                        : "primary.main",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "primary.main",
                  },
                  "&.Mui-disabled": {
                    opacity: 0.5,
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      "& .MuiMenuItem-root": {
                        fontSize: "1.2rem",
                      },
                    },
                  },
                }}
              >
                <MenuItem value="ding">Ding</MenuItem>
                <MenuItem value="chime">Chime</MenuItem>
                <MenuItem value="alert">Alert</MenuItem>
                <MenuItem value="beep">Beep</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="fanfare">Fanfare</MenuItem>
                <MenuItem value="blip">Blip</MenuItem>
                <MenuItem value="swoosh">Swoosh</MenuItem>
                <MenuItem value="pop">Pop</MenuItem>
              </Select>
            </FormControl>

            {/* ON/OFF 토글 */}
            <Switch
              checked={recordSoundEnabled}
              onChange={handleToggleRecordSound}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: pointColor === "default" ? "primary.main" : activePointColor,
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: pointColor === "default" ? "primary.main" : activePointColor,
                },
              }}
            />
          </Box>
        </Box>

        {/* 알림음 볼륨 조절 - ON일 때만 표시 */}
        {recordSoundEnabled && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography sx={{ fontSize: "1.4rem" }}>
              알림음 크기
              <Box
                component="span"
                sx={{ color: "text.secondary", fontSize: "1.2rem", ml: 0.5 }}
              >
                ({recordSoundVolume}%)
              </Box>
            </Typography>
            <Box
              sx={{ width: 170, px: 1 }}
              onMouseEnter={() => setIsVolumeSliderHovered(true)}
              onMouseLeave={() => setIsVolumeSliderHovered(false)}
            >
              <Slider
                size="small"
                value={recordSoundVolume}
                min={0}
                max={200}
                step={5}
                valueLabelDisplay={isVolumeSliderHovered ? "on" : "auto"}
                onChange={handleChangeRecordSoundVolume}
                onChangeCommitted={(e, value) => playNotificationSound(recordSoundType, value)}
                sx={{
                  color: "primary.main",
                  "& .MuiSlider-mark": {
                    backgroundColor: "transparent",
                  },
                }}
              />
            </Box>
          </Box>
        )}

        <Divider />

        {/* 설정 동기화 */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: "1.4rem" }}>
              설정 동기화
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
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
        </Box>
      </Box>
    </Popover>
  );
}
