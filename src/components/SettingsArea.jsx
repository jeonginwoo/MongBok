"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Paper,
  IconButton,
  Tooltip,
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
  Close as CloseIcon,
  Settings as SettingsIcon,
  FolderOpen as FolderOpenIcon,
  ClearAll as ClearAllIcon,
  InfoOutlined as InfoOutlinedIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  TouchApp as TouchAppIcon,
} from "@mui/icons-material";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  validatePreferences,
  applyPreferences,
  validateThemeMode,
  validateBoolean,
} from "@/utils/preferences";
import {
  pointerEventsEnabledAtom,
  showCurrentTimeAtom,
  currentTimePositionAtom,
  themeModeAtom,
  pointColorAtom,
  chatFontSizeAdjustmentAtom,
  autoHideOfflineAtom,
  chzzkHlsLatencyAtom,
  CHZZK_HLS_LATENCY_MIN,
  CHZZK_HLS_LATENCY_MAX,
  CHZZK_HLS_LATENCY_DEFAULT,
  autoRecordEnabledAtom,
  recordStopConditionAtom,
  recordSplitOnZone1ChangeAtom,
  recordQualityAtom,
  recordFrameRateAtom,
  recordCodecAtom,
  recordSoundEnabledAtom,
  recordSoundTypeAtom,
  recordSoundVolumeAtom,
  recordSaveDirHandleAtom,
  recordSaveDirNameAtom,
  layoutTypeAtom,
  ratioAtom,
  viewCountAtom,
  channelsAtom,
  controllerExpandedAtom,
  selectedSearchPlatformAtom,
  platformEnabledAtom,
  applySettingsSnapshotAtom,
} from "@/atoms/setting";
import { captureSnapshot } from "@/utils/settingPresets";
import { getRecordDirectory, setRecordDirectory, clearRecordDirectory } from "@/utils/recordDirectoryStorage";
import { snackbarAtom } from "@/atoms/ui";
import { POINT_COLORS } from "@/data/color";
import { playNotificationSound } from "@/utils/audio";
import RatioSelector from "@/components/Settings/RatioSelector";
import LayoutToggleGroup from "@/components/Settings/LayoutToggleGroup";
import PresetSelector from "@/components/Settings/PresetSelector";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import { ALL_SETTINGS } from "@/data/settingsOrder";
import { CHANNEL_PLATFORMS, parseChannelKey } from "@/utils/channelKey";
import "prismjs/components/prism-json";
import { styled } from "@mui/material/styles";

// ── Shared constants ─────────────────────────────────────────────

const selectMenuProps = {
  PaperProps: {
    sx: {
      "& .MuiMenuItem-root": { fontSize: "1.2rem" },
    },
  },
};

const tooltipSlotProps = {
  tooltip: { sx: { fontSize: "1.2rem" } },
};

// ── Styled components ────────────────────────────────────────────

const SettingRow = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

const SettingLabel = styled(Typography)({
  fontSize: "1.4rem",
});

const SmallText = styled(Typography)({
  fontSize: "1.2rem",
});

const SettingSwitch = styled(Switch)(({ theme }) => ({
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: theme.palette.primary.main,
    opacity: 0.65,
  },
  "& .MuiSwitch-track": {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
}));

const HotkeySpan = styled(Box, {
  shouldForwardProp: (prop) => prop !== "pointcolor",
})(({ theme, pointcolor }) => ({
  color: pointcolor === "default" ? "#00bcd4" : theme.palette.primary.main,
  fontWeight: "bold",
}));

const SettingToggleGroup = styled(ToggleButtonGroup, {
  shouldForwardProp: (prop) => prop !== "pointcolor",
})(({ theme, pointcolor }) => ({
  "& .MuiToggleButton-root.Mui-selected": {
    backgroundColor:
      pointcolor === "default" ? "#5f5f5f" : theme.palette.primary.main,
    color: "#fff",
    "&:hover": {
      backgroundColor:
        pointcolor === "default" ? "#5f5f5f" : theme.palette.primary.main,
      filter: "brightness(0.9)",
    },
  },
}));

function SettingSelect({ pointcolor, sx, children, ...props }) {
  return (
    <FormControl size="small" sx={{ minWidth: 100 }}>
      <Select
        MenuProps={selectMenuProps}
        sx={{
          height: 30,
          fontSize: "1.2rem",
          color: pointcolor === "default" ? "inherit" : "primary.main",
          ".MuiSelect-select": { paddingTop: "4px", paddingBottom: "4px" },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor:
              pointcolor === "default"
                ? "rgba(140, 140, 140, 0.5)"
                : "primary.main",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor:
              pointcolor === "default" ? "text.primary" : "primary.main",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "primary.main",
          },
          ...sx,
        }}
        {...props}
      >
        {children}
      </Select>
    </FormControl>
  );
}

// 설정 동기화 JSON 표시용 포맷터.
// channels는 채널당 한 줄로 압축해, 긴 채널ID(치지직 등)로 인한 줄넘김 정렬 깨짐을 줄인다.
// 채널은 플랫폼별로 모이게만 하고, 같은 플랫폼 내에서는 기존 순서를 유지한다 (안정 정렬)
const platformOrder = (channelKey) => {
  const index = CHANNEL_PLATFORMS.indexOf(parseChannelKey(channelKey)?.platform);
  return index === -1 ? CHANNEL_PLATFORMS.length : index;
};

const formatSettingsJson = (settings) => {
  const entries = Object.entries(settings);
  if (entries.length === 0) return "{}";

  const lines = entries.map(([key, value]) => {
    if (key === "channels" && value && Object.keys(value).length > 0) {
      const channelLines = Object.entries(value)
        .sort(([aKey], [bKey]) => platformOrder(aKey) - platformOrder(bKey))
        .map(([channelKey, data]) => {
          const inlineData = JSON.stringify(data, null, 1).replace(/\n\s*/g, " ");
          return `    ${JSON.stringify(channelKey)}: ${inlineData}`;
        });
      return `  "channels": {\n${channelLines.join(",\n")}\n  }`;
    }
    const nested = JSON.stringify(value, null, 2).replace(/\n/g, "\n  ");
    return `  ${JSON.stringify(key)}: ${nested}`;
  });

  return `{\n${lines.join(",\n")}\n}`;
};

// ── Main component ────────────────────────────────────────────────

export default function SettingsArea({ onClose }) {
  const [pointerEventsEnabled, setPointerEventsEnabled] = useAtom(pointerEventsEnabledAtom);
  const [showCurrentTime, setShowCurrentTime] = useAtom(showCurrentTimeAtom);
  const [currentTimePosition, setCurrentTimePosition] = useAtom(currentTimePositionAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const [pointColor, setPointColor] = useAtom(pointColorAtom);
  const [chatFontSizeAdjustment, setChatFontSizeAdjustment] = useAtom(chatFontSizeAdjustmentAtom);
  const [autoHideOffline, setAutoHideOffline] = useAtom(autoHideOfflineAtom);
  const [chzzkHlsLatency, setChzzkHlsLatency] = useAtom(chzzkHlsLatencyAtom);
  const [autoRecordEnabled, setAutoRecordEnabled] = useAtom(autoRecordEnabledAtom);
  const [recordStopCondition, setRecordStopCondition] = useAtom(recordStopConditionAtom);
  const [recordSplitOnZone1Change, setRecordSplitOnZone1Change] = useAtom(recordSplitOnZone1ChangeAtom);
  const [recordQuality, setRecordQuality] = useAtom(recordQualityAtom);
  const [recordFrameRate, setRecordFrameRate] = useAtom(recordFrameRateAtom);
  const [recordCodec, setRecordCodec] = useAtom(recordCodecAtom);
  const [recordSoundEnabled, setRecordSoundEnabled] = useAtom(recordSoundEnabledAtom);
  const [recordSoundType, setRecordSoundType] = useAtom(recordSoundTypeAtom);
  const [recordSoundVolume, setRecordSoundVolume] = useAtom(recordSoundVolumeAtom);
  const [recordSaveDirHandle, setRecordSaveDirHandle] = useAtom(recordSaveDirHandleAtom);
  const [recordSaveDirName, setRecordSaveDirName] = useAtom(recordSaveDirNameAtom);
  const layoutType = useAtomValue(layoutTypeAtom);
  const ratioKey = useAtomValue(ratioAtom);
  const viewCount = useAtomValue(viewCountAtom);
  const channels = useAtomValue(channelsAtom);
  const controllerExpanded = useAtomValue(controllerExpandedAtom);
  const selectedSearchPlatform = useAtomValue(selectedSearchPlatformAtom);
  const platformEnabled = useAtomValue(platformEnabledAtom);

  const setSnackbar = useSetAtom(snackbarAtom);
  const applySettingsSnapshot = useSetAtom(applySettingsSnapshotAtom);

  const paperRef = useRef(null);
  const [data, setData] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [isVolumeSliderHovered, setIsVolumeSliderHovered] = useState(false);
  const [isLatencySliderHovered, setIsLatencySliderHovered] = useState(false);
  // 치지직 딜레이 슬라이더 드래그 중 임시값 (null이면 드래그 중 아님)
  const [chzzkHlsLatencyDraft, setChzzkHlsLatencyDraft] = useState(null);

  // 페이지 로드 시 IndexedDB에서 저장된 디렉토리 핸들 복원
  useEffect(() => {
    getRecordDirectory().then((handle) => {
      if (handle) setRecordSaveDirHandle(handle);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePointColor =
    POINT_COLORS[pointColor]?.[themeMode] || POINT_COLORS["default"][themeMode];

  const getLocalStorageDataString = useCallback(() => {
    const settings = ALL_SETTINGS.reduce((obj, key) => {
      if (key === "layout") {
        if (viewCount > 0 && layoutType) obj[key] = layoutType;
        return obj;
      }
      const value = window.localStorage.getItem(key);
      if (value) {
        try {
          obj[key] = JSON.parse(value);
        } catch {
          obj[key] = value;
        }
      }
      return obj;
    }, {});

    // channelsAtom의 현재 상태를 직접 반영하여 localStorage 저장 지연 문제 해결
    if (channels && Object.keys(channels).length > 0) {
      settings.channels = Object.fromEntries(
        Object.entries(channels).map(([key, channel]) => [
          key,
          { zoneId: channel.zoneId ?? null },
        ])
      );
    }

    return formatSettingsJson(settings);
  }, [channels, layoutType, viewCount]);

  useEffect(() => {
    setData(getLocalStorageDataString());
  }, [
    themeMode,
    pointColor,
    ratioKey,
    layoutType,
    showCurrentTime,
    currentTimePosition,
    pointerEventsEnabled,
    chatFontSizeAdjustment,
    autoHideOffline,
    chzzkHlsLatency,
    autoRecordEnabled,
    recordStopCondition,
    recordSplitOnZone1Change,
    recordFrameRate,
    recordQuality,
    recordCodec,
    recordSoundEnabled,
    recordSoundType,
    recordSoundVolume,
    channels,
    controllerExpanded,
    selectedSearchPlatform,
    platformEnabled,
    getLocalStorageDataString,
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    // 메인 창 + (리모컨 분리 시) 설정 패널이 올라간 팝업 창 양쪽에 등록
    const targets = new Set([window]);
    const ownerWin = paperRef.current?.ownerDocument?.defaultView;
    if (ownerWin) targets.add(ownerWin);
    targets.forEach((t) => t.addEventListener("keydown", handleKeyDown));
    return () => targets.forEach((t) => t.removeEventListener("keydown", handleKeyDown));
  }, [onClose]);

  const handlePickRecordDirectory = async () => {
    if (!window.showDirectoryPicker) return;
    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      await setRecordDirectory(handle);
      setRecordSaveDirHandle(handle);
      setRecordSaveDirName(handle.name);
      window.localStorage.setItem("recordSaveDirName", JSON.stringify(handle.name));
    } catch (e) {
      if (e.name !== "AbortError") console.error("폴더 선택 실패:", e);
    }
  };

  const handleClearRecordDirectory = async () => {
    await clearRecordDirectory();
    setRecordSaveDirHandle(null);
    setRecordSaveDirName("");
    window.localStorage.removeItem("recordSaveDirName");

    // 녹화 분할은 저장 폴더가 전제이므로 폴더 해제 시 함께 끈다
    // ("폴더 미지정 + 분할 켜짐" 상태가 남지 않도록)
    if (recordSplitOnZone1Change) {
      setRecordSplitOnZone1Change(false);
      window.localStorage.setItem("recordSplitOnZone1Change", JSON.stringify(false));
      setSnackbar({
        open: true,
        message: "녹화 저장 폴더가 해제되어 녹화 분할도 함께 꺼졌습니다.",
        severity: "info",
      });
    }
  };

  const handleToggleAutoHideOffline = () => {
    setAutoHideOffline((prev) => {
      const nextState = !prev;
      const validation = validateBoolean(nextState, "autoHideOffline");
      if (validation === true) {
        window.localStorage.setItem("autoHideOffline", JSON.stringify(nextState));
      }
      return nextState;
    });
  };

  const handleToggleAutoRecord = () => {
    setAutoRecordEnabled((prev) => {
      const nextState = !prev;
      const validation = validateBoolean(nextState, "autoRecordEnabled");
      if (validation === true) {
        window.localStorage.setItem("autoRecordEnabled", JSON.stringify(nextState));
      }
      return nextState;
    });
  };

  const handleToggleRecordSplitOnZone1Change = () => {
    // 저장 폴더 없이는 분할 시점에 새 파일을 열 수 없으므로 켜기 자체를 막는다
    if (!recordSplitOnZone1Change && !recordSaveDirHandle) {
      setSnackbar({
        open: true,
        message: "녹화 분할을 켜려면 먼저 녹화 저장 폴더를 지정하세요.",
        severity: "warning",
      });
      return;
    }
    setRecordSplitOnZone1Change((prev) => {
      const nextState = !prev;
      const validation = validateBoolean(nextState, "recordSplitOnZone1Change");
      if (validation === true) {
        window.localStorage.setItem("recordSplitOnZone1Change", JSON.stringify(nextState));
      }
      return nextState;
    });
  };

  const handleChangeRecordStopCondition = (event, newCondition) => {
    if (newCondition !== null) {
      setRecordStopCondition(newCondition);
      window.localStorage.setItem("recordStopCondition", JSON.stringify(newCondition));
    }
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
      window.localStorage.setItem("recordFrameRate", JSON.stringify(newFrameRate));
    }
  };

  const handleChangeRecordCodec = (event, newCodec) => {
    if (newCodec !== null) {
      setRecordCodec(newCodec);
      window.localStorage.setItem("recordCodec", JSON.stringify(newCodec));
    }
  };

  const handleToggleRecordSound = () => {
    setRecordSoundEnabled((prev) => {
      const nextState = !prev;
      window.localStorage.setItem("recordSoundEnabled", JSON.stringify(nextState));
      setData(getLocalStorageDataString());
      if (nextState) playNotificationSound(recordSoundType, recordSoundVolume);
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
      const validationResult = await Promise.race([
        validatePreferences(data),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 7500)),
      ]);

      if (typeof validationResult === "string") {
        setSnackbar({ open: true, message: validationResult, severity: "error" });
        setSaveError(true);
        setTimeout(() => setSaveError(false), 750);
        return;
      }

      applyPreferences(validationResult);
      // localStorage에 반영된 결과를 새로고침 없이 메모리 상태에 즉시 적용 (설정창 유지)
      applySettingsSnapshot(captureSnapshot());

      setSaveSuccess(true);
      setSnackbar({ open: true, message: "설정이 성공적으로 저장되었습니다!", severity: "success" });
      setTimeout(() => setSaveSuccess(false), 750);
    } catch (e) {
      const message =
        e.message === "Timeout"
          ? "유효성 검사 시간이 초과되었습니다."
          : "데이터를 저장하는 중 오류가 발생했습니다.";
      setSnackbar({ open: true, message, severity: "error" });
      setSaveError(true);
      setTimeout(() => setSaveError(false), 750);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeTheme = (newMode) => {
    if (validateThemeMode(newMode) === true) setThemeMode(newMode);
  };

  const handleChangePointerEvents = (event, newMode) => {
    if (newMode !== null) {
      setPointerEventsEnabled(newMode);
      window.localStorage.setItem("pointerEventsEnabled", JSON.stringify(newMode));
    }
  };

  const handleToggleCurrentTime = () => {
    setShowCurrentTime((prev) => {
      const nextState = !prev;
      if (validateBoolean(nextState, "showCurrentTime") === true) {
        window.localStorage.setItem("showCurrentTime", JSON.stringify(nextState));
      }
      return nextState;
    });
  };

  const handleChangeCurrentTimePosition = (event, newPosition) => {
    if (newPosition !== null) {
      setCurrentTimePosition(newPosition);
    }
  };

  const handleChangePointColor = (color) => {
    setPointColor(color);
    window.localStorage.setItem("pointColor", JSON.stringify(color));
  };

  const handleChangeChatFontSize = (event, newValue) => {
    setChatFontSizeAdjustment(newValue);
    window.localStorage.setItem("chatFontSizeAdjustment", JSON.stringify(newValue));
  };

  // 값이 바뀌면 치지직 플레이어가 재생성되므로, 드래그 중에는 draft로만 표시하고
  // 슬라이더를 놓았을 때(onChangeCommitted)만 실제 설정에 반영한다
  const handleCommitChzzkHlsLatency = (event, newValue) => {
    setChzzkHlsLatencyDraft(null);
    setChzzkHlsLatency(newValue);
    window.localStorage.setItem("chzzkHlsLatency", JSON.stringify(newValue));
  };

  const successAnimation = { "100%": { color: "success.main" } };
  const errorAnimation = { "100%": { color: "error.main" } };

  const availableThemes = [
    { mode: "light", color: "#ffffff", label: "Light" },
    { mode: "dark", color: "#333333", label: "Dark" },
  ];

  return (
    <Paper
      ref={paperRef}
      elevation={0}
      sx={{
        width: 340,
        backgroundColor: "background.paper",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
        borderLeft: "0.1rem solid",
        borderColor: "divider",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* 헤더 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 1.5,
          py: 1.5,
          borderBottom: "0.1rem solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <SettingsIcon sx={{ fontSize: "1.8rem", color: "text.secondary" }} />
          <Typography sx={{ fontWeight: "bold", fontSize: "1.6rem" }}>설정</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon sx={{ fontSize: "2rem" }} />
        </IconButton>
      </Box>

      {/* 스크롤 가능한 콘텐츠 영역 */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          overflowX: "hidden",
          pt: 1.5,
          px: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* 설정 프리셋 */}
        <SettingRow>
          <SettingLabel sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            프리셋
            <Tooltip
              slotProps={tooltipSlotProps}
              placement="top"
              title={
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>설정 전체(채널, 레이아웃, 레이아웃별 시계 위치 포함)를 번호별로 저장해두고 전환합니다</li>
                  <li>전환 시 현재 설정은 사용 중이던 프리셋에 자동 저장됩니다</li>
                  <li>처음 사용하는 프리셋은 기본 설정에서 시작합니다</li>
                </Box>
              }
            >
              <InfoOutlinedIcon sx={{ fontSize: "1.4rem", color: "text.secondary", cursor: "default" }} />
            </Tooltip>
          </SettingLabel>
          <PresetSelector />
        </SettingRow>

        <Divider />

        {/* 테마 설정 */}
        <SettingRow>
          <SettingLabel>
            테마{" "}
            <HotkeySpan component="span" pointcolor={pointColor}>(M)</HotkeySpan>
          </SettingLabel>
          <Stack direction="row" spacing={1}>
            {availableThemes.map((t) => (
              <Tooltip slotProps={tooltipSlotProps} placement="top" title={t.label} key={t.mode}>
                <Box
                  onClick={() => handleChangeTheme(t.mode)}
                  sx={{
                    width: 28, height: 28, borderRadius: "50%",
                    backgroundColor: t.color,
                    border: themeMode === t.mode ? "3px solid" : "1px solid rgba(0,0,0,0.1)",
                    borderColor: themeMode === t.mode ? "primary.main" : "divider",
                    cursor: "pointer",
                    boxShadow: themeMode === t.mode ? 2 : 0,
                    transition: "all 0.2s",
                    "&:hover": { transform: "scale(1.1)" },
                  }}
                />
              </Tooltip>
            ))}
          </Stack>
        </SettingRow>

        {/* 포인트 컬러 설정 */}
        <SettingRow>
          <SettingLabel>포인트 컬러</SettingLabel>
          <Stack direction="row" spacing={1}>
            {Object.values(POINT_COLORS).map((p) => (
              <Tooltip slotProps={tooltipSlotProps} placement="top" title={p.label} key={p.value}>
                <Box
                  onClick={() => handleChangePointColor(p.value)}
                  sx={{
                    width: 28, height: 28, borderRadius: "50%",
                    backgroundColor: p[themeMode],
                    border: pointColor === p.value ? "3px solid" : "1px solid rgba(0,0,0,0.1)",
                    borderColor: pointColor === p.value ? "primary.main" : "divider",
                    cursor: "pointer",
                    boxShadow: pointColor === p.value ? 2 : 0,
                    transition: "all 0.2s",
                    "&:hover": { transform: "scale(1.1)" },
                  }}
                />
              </Tooltip>
            ))}
          </Stack>
        </SettingRow>

        <Divider />

        {/* 화면 비율 */}
        <SettingRow>
          <SettingLabel>
            화면 비율{" "}
            <HotkeySpan component="span" pointcolor={pointColor}>(⇅)</HotkeySpan>
          </SettingLabel>
          <RatioSelector />
        </SettingRow>

        {/* 레이아웃 */}
        <SettingRow>
          <SettingLabel sx={{ whiteSpace: "nowrap" }}>
            레이아웃{" "}
            <HotkeySpan component="span" pointcolor={pointColor}>(1, 2, ...)</HotkeySpan>
          </SettingLabel>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <LayoutToggleGroup settingsMode />
          </Box>
        </SettingRow>

        {/* 현재 시간 표시 */}
        <SettingRow>
          <SettingLabel>
            현재 시간 표시{" "}
            <HotkeySpan component="span" pointcolor={pointColor}>(T)</HotkeySpan>
          </SettingLabel>
          <SettingSwitch checked={showCurrentTime} onChange={handleToggleCurrentTime} />
        </SettingRow>

        {/* 현재 시간 위치 */}
        {showCurrentTime && (
          <SettingRow>
            <SettingLabel>
              현재 시간 위치{" "}
              <HotkeySpan component="span" pointcolor={pointColor}>(P)</HotkeySpan>
            </SettingLabel>
            <SettingToggleGroup
              value={viewCount === 0 ? null : currentTimePosition}
              exclusive
              onChange={handleChangeCurrentTimePosition}
              aria-label="current time position"
              pointcolor={pointColor}
              size="small"
              disabled={viewCount === 0}
            >
              <ToggleButton value="left" aria-label="left" sx={{ minWidth: '35px' }}>
                <SmallText>L</SmallText>
              </ToggleButton>
              <ToggleButton value="right" aria-label="right" sx={{ minWidth: '35px' }}>
                <SmallText>R</SmallText>
              </ToggleButton>
            </SettingToggleGroup>
          </SettingRow>
        )}

        {/* 화면 조작 모드 */}
        <SettingRow>
          <SettingLabel sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {pointerEventsEnabled ? "화면 조작 모드" : "화면 이동 모드"}{" "}
            <HotkeySpan component="span" pointcolor={pointColor}>(V)</HotkeySpan>
            <Tooltip
              slotProps={tooltipSlotProps}
              placement="top"
              title={
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>화면 이동 모드: 패널을 드래그해 자유롭게 위치 조정</li>
                  <li>화면 조작 모드: 영상 플레이어를 직접 클릭·조작, 채팅창 스크롤</li>
                  <li>화면 조작 모드여도 채팅 상단을 잡고 드래그하여 이동할 수 있습니다</li>
                </Box>
              }
            >
              <InfoOutlinedIcon sx={{ fontSize: "1.4rem", color: "text.secondary", cursor: "default" }} />
            </Tooltip>
          </SettingLabel>
          <SettingToggleGroup
            value={pointerEventsEnabled}
            exclusive
            onChange={handleChangePointerEvents}
            aria-label="pointer events"
            pointcolor={pointColor}
          >
            <ToggleButton value={false} aria-label="pan tool">
              <Tooltip slotProps={tooltipSlotProps} placement="top" title="화면 이동 모드">
                <PanToolIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value={true} aria-label="mouse">
              <Tooltip slotProps={tooltipSlotProps} placement="top" title="화면 조작 모드">
                <MouseIcon />
              </Tooltip>
            </ToggleButton>
          </SettingToggleGroup>
        </SettingRow>

        {/* 채팅창 글자 크기 */}
        <SettingRow>
          <SettingLabel>
            채팅창 글자 크기{" "}
            <HotkeySpan component="span" pointcolor={pointColor}>(⇄)</HotkeySpan>
          </SettingLabel>
          <Box
            sx={{ px: 1, display: "flex", alignItems: "center", gap: 1 }}
            onMouseEnter={() => setIsSliderHovered(true)}
            onMouseLeave={() => setIsSliderHovered(false)}
          >
            <Box component="span" sx={{ color: "text.secondary", fontSize: "1.2rem" }}>
              {chatFontSizeAdjustment > 0 ? "+" : ""}{chatFontSizeAdjustment}
            </Box>
            <Slider
              size="small"
              value={chatFontSizeAdjustment}
              min={-10} max={10} step={1}
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
              sx={{ color: "primary.main", width: 130, "& .MuiSlider-mark": { backgroundColor: "transparent" } }}
            />
          </Box>
        </SettingRow>

        {/* 오프라인 자동 숨김 */}
        <SettingRow>
          <SettingLabel sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            오프라인 자동 숨김
            <Tooltip
              slotProps={tooltipSlotProps}
              title="화면에 배치된 채널이 라이브 상태에서 오프라인 전환 시 자동으로 목록으로 복귀합니다"
              placement="top"
            >
              <InfoOutlinedIcon sx={{ fontSize: "1.4rem", color: "text.secondary", cursor: "default" }} />
            </Tooltip>
          </SettingLabel>
          <SettingSwitch checked={autoHideOffline} onChange={handleToggleAutoHideOffline} />
        </SettingRow>

        {/* 치지직 딜레이 */}
        <SettingRow>
          <SettingLabel sx={{ display: "flex", alignItems: "center", gap: 0.5, whiteSpace: "nowrap" }}>
            치지직 딜레이
            <Tooltip
              slotProps={tooltipSlotProps}
              placement="top"
              title={
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>치지직 플레이어가 실시간으로부터 유지할 딜레이입니다 (기본 {CHZZK_HLS_LATENCY_DEFAULT}초 = 치지직 서버 권장값)</li>
                  <li>낮출수록 실시간에 가깝지만, 너무 낮으면 버퍼링이 잦아지고 화면이 자주 끊길 수 있습니다</li>
                  <li>실제 체감 딜레이는 여기에 방송 송출·서버 처리 지연(약 1~2초)이 더해집니다</li>
                  <li>변경 시 치지직 플레이어가 새 설정으로 다시 로드됩니다</li>
                </Box>
              }
            >
              <InfoOutlinedIcon sx={{ fontSize: "1.4rem", color: "text.secondary", cursor: "default" }} />
            </Tooltip>
          </SettingLabel>
          <Box
            sx={{ px: 1, display: "flex", alignItems: "center", gap: 1 }}
            onMouseEnter={() => setIsLatencySliderHovered(true)}
            onMouseLeave={() => setIsLatencySliderHovered(false)}
          >
            <Box component="span" sx={{ color: "text.secondary", fontSize: "1.2rem", whiteSpace: "nowrap" }}>
              {Number(chzzkHlsLatencyDraft ?? chzzkHlsLatency).toFixed(1)}초
            </Box>
            <Slider
              size="small"
              value={chzzkHlsLatencyDraft ?? chzzkHlsLatency}
              min={CHZZK_HLS_LATENCY_MIN}
              max={CHZZK_HLS_LATENCY_MAX}
              step={0.1}
              valueLabelDisplay={isLatencySliderHovered ? "on" : "auto"}
              valueLabelFormat={(v) => `${v.toFixed(1)}초`}
              onChange={(e, v) => setChzzkHlsLatencyDraft(v)}
              onChangeCommitted={handleCommitChzzkHlsLatency}
              sx={{ color: "primary.main", width: 130, "& .MuiSlider-mark": { backgroundColor: "transparent" } }}
            />
          </Box>
        </SettingRow>

        <Divider />

        {/* 녹화 저장 위치 */}
        <SettingRow>
          <SettingLabel>녹화 저장 위치</SettingLabel>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {recordSaveDirName ? (
              <Tooltip slotProps={tooltipSlotProps} title={recordSaveDirName}>
                <Box
                  sx={{
                    maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", fontSize: "1.2rem", color: "text.secondary",
                  }}
                >
                  {recordSaveDirName}
                </Box>
              </Tooltip>
            ) : (
              <Box sx={{ fontSize: "1.2rem", color: "text.disabled" }}>미지정</Box>
            )}
            <Tooltip slotProps={tooltipSlotProps} title="폴더 선택">
              <span>
                <IconButton
                  size="small"
                  onClick={handlePickRecordDirectory}
                  disabled={!window.showDirectoryPicker}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                >
                  <FolderOpenIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {recordSaveDirName && (
              <Tooltip slotProps={tooltipSlotProps} title="위치 초기화">
                <IconButton
                  size="small"
                  onClick={handleClearRecordDirectory}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
                >
                  <ClearAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </SettingRow>

        {/* 자동 녹화 설정 */}
        <SettingRow>
          <SettingLabel sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            자동 녹화
            <Tooltip
              slotProps={tooltipSlotProps}
              placement="top"
              title={
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>1번 위치의 채널이 라이브 시작 시 자동으로 녹화를 시작합니다 (브라우저 동의 필요)</li>
                  <li>녹화 종료는 아래 '녹화 종료 기준' 설정을 따릅니다</li>
                </Box>
              }
            >
              <InfoOutlinedIcon sx={{ fontSize: "1.4rem", color: "text.secondary", cursor: "default" }} />
            </Tooltip>
          </SettingLabel>
          <SettingSwitch checked={autoRecordEnabled} onChange={handleToggleAutoRecord} />
        </SettingRow>

        {/* 녹화 종료 기준 설정 */}
        <SettingRow>
          <SettingLabel sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            녹화 종료 기준
            <Tooltip
              slotProps={tooltipSlotProps}
              placement="top"
              title={
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>전체 채널: 화면에 배치된 채널이 모두 오프라인이 되면 녹화를 종료합니다</li>
                  <li>1번 채널: 1번 위치의 채널이 오프라인이 되면 녹화를 종료합니다</li>
                  <li>수동 종료: 자동으로 종료하지 않으며, 녹화 버튼을 직접 눌러야 종료됩니다</li>
                </Box>
              }
            >
              <InfoOutlinedIcon sx={{ fontSize: "1.4rem", color: "text.secondary", cursor: "default" }} />
            </Tooltip>
          </SettingLabel>
          <SettingToggleGroup value={recordStopCondition} exclusive onChange={handleChangeRecordStopCondition} size="small" pointcolor={pointColor}>
            <ToggleButton value="all">
              <Tooltip slotProps={tooltipSlotProps} placement="top" title="전체 채널">
                <GroupsIcon sx={{ fontSize: "1.8rem" }} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="zone1">
              <Tooltip slotProps={tooltipSlotProps} placement="top" title="1번 채널">
                <PersonIcon sx={{ fontSize: "1.8rem" }} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="manual">
              <Tooltip slotProps={tooltipSlotProps} placement="top" title="수동 종료">
                <TouchAppIcon sx={{ fontSize: "1.8rem" }} />
              </Tooltip>
            </ToggleButton>
          </SettingToggleGroup>
        </SettingRow>

        {/* 방제/카테고리 변경 시 녹화 분할 설정 */}
        <SettingRow>
          <SettingLabel sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            녹화 분할
            <Tooltip
              slotProps={tooltipSlotProps}
              placement="top"
              title={
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>녹화 중 1번 위치의 채널이 바뀌거나 그 채널의 방송 제목·라이브 카테고리가 바뀌면, 현재 파일을 저장하고 새 파일로 끊김 없이 이어서 녹화합니다 (화면 공유 권한을 다시 묻지 않음)</li>
                  <li>켜려면 '녹화 저장 폴더' 지정이 필요합니다 — 폴더를 해제하면 분할도 함께 꺼집니다</li>
                  <li>방송 정보는 1분 주기로 갱신되므로 변경 감지에 최대 1분이 걸립니다</li>
                </Box>
              }
            >
              <InfoOutlinedIcon sx={{ fontSize: "1.4rem", color: "text.secondary", cursor: "default" }} />
            </Tooltip>
          </SettingLabel>
          <SettingSwitch checked={recordSplitOnZone1Change} onChange={handleToggleRecordSplitOnZone1Change} />
        </SettingRow>

        {/* 녹화 프레임 설정 */}
        <SettingRow>
          <SettingLabel>녹화 프레임</SettingLabel>
          <SettingToggleGroup value={recordFrameRate} exclusive onChange={handleChangeRecordFrameRate} size="small" pointcolor={pointColor}>
            <ToggleButton value={60}><SmallText>60</SmallText></ToggleButton>
            <ToggleButton value={30}><SmallText>30</SmallText></ToggleButton>
          </SettingToggleGroup>
        </SettingRow>

        {/* 녹화 화질 설정 */}
        <SettingRow>
          <SettingLabel>녹화 화질</SettingLabel>
          <SettingToggleGroup value={recordQuality} exclusive onChange={handleChangeRecordQuality} size="small" pointcolor={pointColor}>
            <ToggleButton value="high"><SmallText>High</SmallText></ToggleButton>
            <ToggleButton value="medium"><SmallText>Mid</SmallText></ToggleButton>
            <ToggleButton value="low"><SmallText>Low</SmallText></ToggleButton>
          </SettingToggleGroup>
        </SettingRow>

        {/* 녹화 코덱 설정 */}
        <SettingRow>
          <SettingLabel sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            녹화 코덱
            <Tooltip
              slotProps={tooltipSlotProps}
              placement="top"
              title={
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>H.264: 호환성 최고, 대부분의 기기에서 재생 가능 (기본 권장) · GPU 하드웨어 인코딩 지원</li>
                  <li>VP9: 파일 크기 약 30~50% 작음, 최신 브라우저 지원 · CPU 인코딩 위주, 부하 높음</li>
                  <li>VP8: 구형 코덱, VP9보다 압축 효율 낮음 · CPU 인코딩, 부하 낮음</li>
                </Box>
              }
            >
              <InfoOutlinedIcon sx={{ fontSize: "1.4rem", color: "text.secondary", cursor: "default" }} />
            </Tooltip>
          </SettingLabel>
          <SettingToggleGroup value={recordCodec} exclusive onChange={handleChangeRecordCodec} size="small" pointcolor={pointColor}>
            <ToggleButton value="h264"><SmallText>H.264</SmallText></ToggleButton>
            <ToggleButton value="vp9"><SmallText>VP9</SmallText></ToggleButton>
            <ToggleButton value="vp8"><SmallText>VP8</SmallText></ToggleButton>
          </SettingToggleGroup>
        </SettingRow>

        {/* 녹화 알림음 설정 */}
        <SettingRow>
          <SettingLabel sx={{ whiteSpace: "nowrap" }}>녹화 알림음</SettingLabel>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SettingSelect
              pointcolor={pointColor}
              value={recordSoundType}
              onChange={handleChangeRecordSoundType}
              disabled={!recordSoundEnabled}
              sx={{ "&.Mui-disabled": { opacity: 0.5 } }}
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
            </SettingSelect>
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
        </SettingRow>

        {/* 알림음 볼륨 */}
        {recordSoundEnabled && (
          <SettingRow>
            <SettingLabel>
              알림음 크기
            </SettingLabel>
            <Box
              sx={{ px: 1, display: "flex", alignItems: "center", gap: 1 }}
              onMouseEnter={() => setIsVolumeSliderHovered(true)}
              onMouseLeave={() => setIsVolumeSliderHovered(false)}
            >
              <Box component="span" sx={{ color: "text.secondary", fontSize: "1.2rem" }}>
                {recordSoundVolume}%
              </Box>
              <Slider
                size="small"
                value={recordSoundVolume}
                min={0} max={100} step={5}
                valueLabelDisplay={isVolumeSliderHovered ? "on" : "auto"}
                onChange={handleChangeRecordSoundVolume}
                onChangeCommitted={(e, value) => playNotificationSound(recordSoundType, value)}
                sx={{ color: "primary.main", width: 130, "& .MuiSlider-mark": { backgroundColor: "transparent" } }}
              />
            </Box>
          </SettingRow>
        )}

        <Divider />

        {/* 설정 동기화 */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flexGrow: 1, minHeight: 0 }}>
          <SettingRow>
            <SettingLabel>설정 동기화</SettingLabel>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip slotProps={tooltipSlotProps} title={copySuccess ? "복사 완료!" : "현재 설정 복사"}>
                <span>
                  <IconButton
                    disabled={copySuccess}
                    onClick={handleCopy}
                    size="small"
                    sx={{
                      border: "1px solid", borderColor: "divider", borderRadius: 1,
                      animation: copySuccess ? "successAnimation 0.750s ease" : "none",
                      "@keyframes successAnimation": successAnimation,
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip
                slotProps={tooltipSlotProps}
                title={saveSuccess ? "저장 완료!" : saveError ? "저장 실패" : "설정 저장"}
              >
                <span>
                  <IconButton
                    disabled={saveSuccess || isSaving}
                    onClick={handleSave}
                    size="small"
                    sx={{
                      border: "1px solid", borderColor: "divider", borderRadius: 1,
                      animation: saveSuccess
                        ? "successAnimation 0.750s ease"
                        : saveError
                        ? "errorAnimation 0.750s ease"
                        : "none",
                      "@keyframes successAnimation": successAnimation,
                      "@keyframes errorAnimation": errorAnimation,
                    }}
                  >
                    {isSaving ? <CircularProgress size={12.5} /> : <CheckIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </SettingRow>
          <Box
            sx={{
              border: 1, borderColor: "divider", borderRadius: 1,
              bgcolor: "background.paper", overflow: "auto", minHeight: "240px", flexGrow: 1,
              transition: "border-color 0.2s",
              "&:hover": { borderColor: "text.primary" },
              "&:focus-within": { borderColor: "primary.main", borderWidth: 2, m: "-1px" },
              "& .token.property": { color: activePointColor },
              "& .token.string": { color: themeMode === "dark" ? "#ce9178" : "#a31515" },
              "& .token.number": { color: themeMode === "dark" ? "#b5cea8" : "#098658" },
              "& .token.boolean": { color: themeMode === "dark" ? "#9cdcfe" : "#0451a5" },
              "& .token.punctuation": { color: "text.secondary" },
              "& textarea": { outline: "none" },
              // 긴 채널ID 등은 줄바꿈 대신 가로 스크롤로 처리 (라이브러리 인라인 스타일 오버라이드)
              "& textarea, & pre": {
                whiteSpace: "pre !important",
                wordBreak: "normal !important",
                overflowWrap: "normal !important",
              },
            }}
          >
            <Editor
              value={data}
              onValueChange={(code) => setData(code)}
              highlight={(code) => Prism.highlight(code, Prism.languages.json, "json")}
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: "1.2rem",
                // 내용 폭만큼 늘어나 바깥 Box가 가로 스크롤을 담당하게 한다
                overflow: "visible",
                width: "max-content",
                minWidth: "100%",
              }}
              placeholder="설정 데이터를 여기에 붙여넣거나 복사하세요."
            />
          </Box>
          <Box sx={{ minHeight: 6, height: 6, width: '100%' }} />
        </Box>
      </Box>
    </Paper>
  );
}
