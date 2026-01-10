import React, { useState, useEffect, useCallback } from "react";
import { Box, IconButton, Tooltip, Popover, TextField, Button } from "@mui/material";
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
} from "@mui/icons-material";
import { getLiveStatus } from "@/api/live";

import { useAtom } from "jotai";
import {
  pointerEventsEnabledAtom,
  showCurrentTimeAtom,
  channelsAtom,
  controllerExpandedAtom,
  themeModeAtom,
} from "@/atoms/setting";

const iconStyle = { fontSize: "2.4rem" };
const smallIconStyle = { fontSize: "2.0rem" };

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

  const [anchorEl, setAnchorEl] = useState(null);
  const [data, setData] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const getLocalStorageDataString = () => {
    const localStorageData = [
      "channels",
      "layout",
      "ratio",
      "pointerEventsEnabled",
      "showCurrentTime",
      "controllerExpanded",
      "themeMode",
    ].reduce((obj, key) => {
      const value = window.localStorage.getItem(key);
      if (value) {
        obj[key] = value;
      }
      return obj;
    }, {});
    return JSON.stringify(localStorageData, null, 2);
  }

  const handleOpenPopover = (event) => {
    setData(getLocalStorageDataString());
    setAnchorEl(event.currentTarget);
  };

  const handleCopy = () => {
    const dataString = getLocalStorageDataString();
    setData(dataString);
    navigator.clipboard.writeText(dataString);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1000);
  };

  const handleSave = () => {
    try {
      const parsedData = JSON.parse(data);

      const allowedKeys = [
        "channels",
        "layout",
        "ratio",
        "pointerEventsEnabled",
        "showCurrentTime",
        "controllerExpanded",
        "themeMode",
      ];
      
      if (typeof parsedData !== 'object' || parsedData === null) {
        setSaveError(true);
        setTimeout(() => setSaveError(false), 1000);
        return;
      }

      const hasOnlyAllowedKeys = Object.keys(parsedData).every((key) => allowedKeys.includes(key));

      if (!hasOnlyAllowedKeys) {
        setSaveError(true);
        setTimeout(() => setSaveError(false), 1000);
        return;
      }
      
      // 먼저 모든 허용된 키를 로컬 스토리지에서 삭제합니다.
      allowedKeys.forEach(key => window.localStorage.removeItem(key));

      // 그 다음 파싱된 데이터로 새 값을 설정합니다.
      for (const key in parsedData) {
        if (typeof parsedData[key] !== 'string') {
          setSaveError(true);
          setTimeout(() => setSaveError(false), 1000);
          return;
        }
        window.localStorage.setItem(key, parsedData[key]);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        window.location.reload();
      }, 1000);
    } catch (e) {
      console.error("Failed to parse and save data:", e);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 1000);
    }
  };

  const handleToggleController = () => {
    setControllerExpanded((prev) => {
      const nextState = !prev;
      window.localStorage.setItem(
        "controllerExpanded",
        JSON.stringify(nextState)
      );
      return nextState;
    });
  };

  const handleToggleTheme = () => {
    setThemeMode((prev) => {
      const nextState = prev === "light" ? "dark" : "light";
      window.localStorage.setItem("themeMode", nextState);
      return nextState;
    });
  };

  const handleTogglePointerEvents = () => {
    setPointerEventsEnabled((prev) => {
      const nextState = !prev;
      window.localStorage.setItem(
        "pointerEventsEnabled",
        JSON.stringify(nextState)
      );
      return nextState;
    });
  };

  const handleToggleCurrentTime = () => {
    setShowCurrentTime((prev) => {
      const nextState = !prev;
      window.localStorage.setItem("showCurrentTime", JSON.stringify(nextState));
      return nextState;
    });
  };

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);

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
      setTimeout(() => setRefreshing(false), 1000);
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
    const handleKeyDown = (event) => {
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      )
        return;
      if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey)
        return;

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
  ]);

  const rotate360 = {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  };

  const successAnimation = {
    "50%": { color: "success.main" },
  };

  const errorAnimation = {
    "50%": { color: "error.main" },
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: controllerExpanded ? "space-between" : "center",
      }}
    >
      <Tooltip
        slotProps={tooltipSlotProps}
        title={
          <>
            {controllerExpanded ? "사이드 접기 " : "사이드 펴기 "}(
            <Box component="span" sx={{ color: "common.skyBlue", fontWeight: "bold" }}>S</Box>)
          </>
        }
      >
        <IconButton  onClick={handleToggleController}>
          {controllerExpanded ? (
            <FormatIndentIncreaseIcon sx={iconStyle} />
          ) : (
            <FormatIndentDecreaseIcon sx={iconStyle} />
          )}
        </IconButton>
      </Tooltip>

      {controllerExpanded && (
        <>
          <Tooltip
            slotProps={tooltipSlotProps}
            title={
              <>
                {themeMode === "light" ? "다크 모드 " : "화이트 모드 "}(
                <Box component="span" sx={{ color: "common.skyBlue", fontWeight: "bold" }}>M</Box>)
              </>
            }
          >
            <IconButton onClick={handleToggleTheme}>
              {themeMode === 'light' ? <Brightness4Icon sx={iconStyle}/> : <Brightness7Icon sx={iconStyle}/>}
            </IconButton>
          </Tooltip>

          <Tooltip
            slotProps={tooltipSlotProps}
            title={
              <>
                {showCurrentTime ? "현재 시간 on " : "현재 시간 off "}(
                <Box component="span" sx={{ color: "common.skyBlue", fontWeight: "bold" }}>T</Box>)
              </>
            }
          >
            <IconButton
              
              onClick={handleToggleCurrentTime}
              sx={{
                "& .MuiSvgIcon-root": !showCurrentTime ? { color: "text.quaternary" } : {},
              }}
            >
              <AccessTimeIcon sx={iconStyle} />
            </IconButton>
          </Tooltip>

          <Tooltip
            slotProps={tooltipSlotProps}
            title={
              <>
                {pointerEventsEnabled ? "화면 조작 모드 " : "화면 이동 모드 "}(
                <Box component="span" sx={{ color: "common.skyBlue", fontWeight: "bold" }}>V</Box>)
              </>
            }
          >
            <IconButton  onClick={handleTogglePointerEvents} sx={{ padding: 1.25 }}>
              {pointerEventsEnabled ? (
                <MouseIcon sx={smallIconStyle} />
              ) : (
                <PanToolIcon sx={smallIconStyle} />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip
            slotProps={tooltipSlotProps}
            title={
              <>
                채널 정보 갱신 (<Box component="span" sx={{ color: "common.skyBlue", fontWeight: "bold" }}>R</Box>)
              </>
            }
          >
            <IconButton
              
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                "& .MuiSvgIcon-root": refreshing
                  ? {
                      animation: "rotate360 1s ease-in-out",
                      "@keyframes rotate360": rotate360,
                    }
                  : {},
                "&.Mui-disabled .MuiSvgIcon-root": { color: "text.quaternary" },
              }}
            >
              <RefreshIcon sx={iconStyle} />
            </IconButton>
          </Tooltip>

          <Tooltip slotProps={tooltipSlotProps} title="데이터 동기화">
            <IconButton
              onClick={handleOpenPopover}
            >
              <ImportExportIcon sx={iconStyle} />
            </IconButton>
          </Tooltip>
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
          >
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1, backgroundColor: "background.level1", width: "27rem" }}>
              <TextField
                label="SETTING"
                multiline
                rows={8}
                value={data}
                onChange={(e) => setData(e.target.value)}
                variant="outlined"
                fullWidth
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Tooltip slotProps={tooltipSlotProps} title={copySuccess ? "복사 완료!" : "현재 설정 복사"}>
                  <span>
                    <IconButton
                      disabled={copySuccess}
                      variant="contained"
                      onClick={handleCopy}
                      sx={{
                        animation: copySuccess ? "successAnimation 1s ease" : "none",
                        "@keyframes successAnimation": successAnimation,
                      }}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip slotProps={tooltipSlotProps} title={saveSuccess ? "저장 완료!" : (saveError ? "저장 실패" : "붙여넣은 설정 저장")}>
                  <span>
                    <IconButton
                      disabled={saveSuccess || saveError}
                      variant="contained"
                      onClick={handleSave}
                      sx={{
                        animation: saveSuccess
                          ? "successAnimation 1s ease"
                          : saveError
                          ? "errorAnimation 1s ease"
                          : "none",
                        "@keyframes successAnimation": successAnimation,
                        "@keyframes errorAnimation": errorAnimation,
                      }}
                    >
                      <CheckIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Popover>

          <Tooltip
            slotProps={tooltipSlotProps}
            title={
              <>
                전체화면 (<Box component="span" sx={{ color: "common.skyBlue", fontWeight: "bold" }}>F</Box>)
              </>
            }
          >
            <IconButton  onClick={fullscreen}>
              <FullscreenIcon sx={iconStyle} />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Box>
  );
}