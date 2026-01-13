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
} from "@mui/icons-material";
import { getLiveStatus } from "@/api/live";
import { canvas } from "@/data/layouts";
import { palettes } from "@/data/color";

import { useAtom, useSetAtom, useAtomValue } from "jotai";
import {
  pointerEventsEnabledAtom,
  showCurrentTimeAtom,
  channelsAtom,
  controllerExpandedAtom,
  themeModeAtom,
} from "@/atoms/setting";
import { snackbarAtom, isDraggingAtom } from "@/atoms/ui";

const iconStyle = { fontSize: "2.4rem" };
const smallIconStyle = { fontSize: "2.0rem" };

const tooltipSlotProps = {
  tooltip: {
    sx: {
      fontSize: "1.2rem",
    },
  },
};

const validateData = async (dataToValidate) => {
  try {
    const parsedData = JSON.parse(dataToValidate);

    const allowedKeys = [
      "channels",
      "layout",
      "ratio",
      "pointerEventsEnabled",
      "showCurrentTime",
      "controllerExpanded",
      "themeMode",
    ];

    if (
      typeof parsedData !== "object" ||
      parsedData === null ||
      Array.isArray(parsedData)
    ) {
      return "데이터는 유효한 객체 형식이 아닙니다.";
    }

    const dataKeys = Object.keys(parsedData);
    if (!dataKeys.every((key) => allowedKeys.includes(key))) {
      const invalidKeys = dataKeys.filter((key) => !allowedKeys.includes(key));
      return `허용되지 않는 키가 포함되어 있습니다: ${invalidKeys.join(
        ", "
      )}. 허용되는 키는: ${allowedKeys.join(", ")} 입니다.`;
    }

    for (const key of dataKeys) {
      const value = parsedData[key];
      if (typeof value !== "string") {
        return `'${key}'의 값은 문자열이어야 합니다.`;
      }

      switch (key) {
        case "themeMode":
          if (!Object.keys(palettes).includes(value)) {
            return `유효하지 않은 테마 모드 값 '${value}'. 허용되는 값은: ${Object.keys(
              palettes
            ).join(", ")} 입니다.`;
          }
          break;

        case "pointerEventsEnabled":
        case "showCurrentTime":
        case "controllerExpanded":
          if (value !== "true" && value !== "false") {
            return `'${key}'에 대한 유효하지 않은 불리언 문자열 값 '${value}'. 'true' 또는 'false' 여야 합니다.`;
          }
          break;

        case "ratio":
          const validRatios = Object.entries(canvas).flatMap(
            ([group, orientations]) =>
              Object.keys(orientations).map(
                (orientation) => `${group}-${orientation}`
              )
          );
          if (!validRatios.includes(value)) {
            return `유효하지 않은 비율 값 '${value}'. 허용되는 값은: ${validRatios.join(
              ", "
            )} 입니다.`;
          }
          break;

        case "channels":
          try {
            const channelsObj = JSON.parse(value);
            if (
              typeof channelsObj !== "object" ||
              channelsObj === null ||
              Array.isArray(channelsObj)
            ) {
              return "'channels' 값이 유효한 JSON 객체가 아닙니다.";
            }
            const zoneIds = [];
            const validationPromises = Object.keys(channelsObj).map(
              (channelId) => {
                const channelData = channelsObj[channelId];
                if (typeof channelId !== "string" || !channelId) {
                  return Promise.reject({
                    error: `Validation Error: Invalid channelId '${channelId}'.`,
                  });
                }
                if (
                  typeof channelData !== "object" ||
                  channelData === null
                ) {
                  return Promise.reject({
                    error: `Validation Error: Channel data for '${channelId}' is not a valid object.`,
                  });
                }

                const { platform, zoneId } = channelData;
                if (!["chzzk", "soop"].includes(platform)) {
                  return Promise.reject({
                    error: `Validation Error: Invalid platform '${platform}' for channel '${channelId}'. Must be 'chzzk' or 'soop'.`,
                  });
                }

                if (zoneId !== null) {
                  if (
                    typeof zoneId !== "number" ||
                    !Number.isInteger(zoneId) ||
                    zoneId < 1
                  ) {
                    return Promise.reject({
                      error: `Validation Error: Invalid zoneId '${zoneId}' for channel '${channelId}'. Must be null or a positive integer.`,
                    });
                  }
                  zoneIds.push(zoneId);
                }

                return getLiveStatus(channelId, platform);
              }
            );
            
            const results = await Promise.allSettled(validationPromises);
            const invalidChannels = results.reduce((acc, result, index) => {
              if (result.status === "rejected") {
                const channelId = Object.keys(channelsObj)[index];
                acc.push(channelId);
                // console.error(
                //   `Validation Error for channel '${channelId}':`,
                //   result.reason
                // );
              }
              return acc;
            }, []);

            if (invalidChannels.length > 0) {
              return `다음 채널 ID에 대한 데이터를 가져올 수 없습니다: ${invalidChannels.join(
                ", "
              )}. 유효하지 않을 수 있습니다.`;
            }

            if (zoneIds.length > 0) {
              const uniqueZoneIds = [...new Set(zoneIds)];
              if (uniqueZoneIds.length !== zoneIds.length) {
                return "'channels'에서 중복된 zoneId가 발견되었습니다.";
              }

              const sortedZoneIds = uniqueZoneIds.sort((a, b) => a - b);
              if (
                sortedZoneIds[sortedZoneIds.length - 1] !==
                sortedZoneIds.length
              ) {
                return "'zoneId' 값이 1부터 순차적이지 않습니다.";
              }
            }
          } catch (e) {
            return `'channels' JSON 문자열을 구문 분석하지 못했습니다: ${e.message}`;
          }
          break;
        case "layout":
          // Layout validation depends on other keys, handled below.
          break;
        default:
          break;
      }
    }

    // Layout validation
    if ("layout" in parsedData) {
      const channelsStr = parsedData.channels || "{}";
      const ratio = parsedData.ratio;
      const layout = parsedData.layout;

      if (!ratio) {
        return "'layout' 유효성 검사를 위해 'ratio'가 필요합니다.";
      }

      try {
        const channelsObj = JSON.parse(channelsStr);
        const viewCount = Object.keys(channelsObj).length;

        if (viewCount > 0) {
          const [group, orientation] = ratio.split("-");
          if (!group || !orientation) {
            return `유효하지 않은 비율 형식 '${ratio}'. 'group-orientation' 형식이 예상됩니다.`;
          }

          const ratioInfo = canvas[group]?.[orientation];
          if (!ratioInfo) {
            return `비율 그룹 '${group}' 또는 방향 '${orientation}'이 캔버스 레이아웃에서 찾을 수 없습니다.`;
          }

          if (viewCount > ratioInfo.maxViewCount) {
            // console.warn(
            //   `Warning: viewCount (${viewCount}) exceeds maxViewCount (${ratioInfo.maxViewCount}) for ratio '${ratio}'. Layout validation will be skipped.`
            // );
          } else {
            const availableLayouts = ratioInfo.layouts[viewCount];
            if (!availableLayouts || !availableLayouts[layout]) {
              const validLayouts = availableLayouts
                ? Object.keys(availableLayouts)
                : [];
              return `viewCount ${viewCount} 및 비율 '${ratio}'에 대한 유효하지 않은 레이아웃 '${layout}'. 사용 가능한 레이아웃: ${validLayouts.join(
                ", "
              )}`;
            }
          }
        }
      } catch (e) {
        return `'layout' 유효성 검사 중 실패했습니다: ${e.message}`;
      }
    }

    return true;
  } catch (e) {
    return `전체 데이터 문자열을 JSON으로 구문 분석하지 못했습니다: ${e.message}`;
  }
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
  const isDragging = useAtomValue(isDraggingAtom);

  const [anchorEl, setAnchorEl] = useState(null);
  const [data, setData] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const setSnackbar = useSetAtom(snackbarAtom);

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
  };

  const handleOpenPopover = (event) => {
    setData(getLocalStorageDataString());
    setAnchorEl(event.currentTarget);
  };

  const handleCopy = () => {
    const dataString = getLocalStorageDataString();
    setData(dataString);
    navigator.clipboard.writeText(dataString);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000)
      );

      const validationResult = await Promise.race([
        validateData(data),
        timeoutPromise,
      ]);

      if (typeof validationResult === "string") {
        setSnackbar({
          open: true,
          message: validationResult,
          severity: "error",
        });
        setSaveError(true);
        setTimeout(() => setSaveError(false), 500);
        return;
      }

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

      // 먼저 모든 허용된 키를 로컬 스토리지에서 삭제합니다.
      allowedKeys.forEach((key) => window.localStorage.removeItem(key));

      // 그 다음 파싱된 데이터로 새 값을 설정합니다.
      for (const key in parsedData) {
        window.localStorage.setItem(key, parsedData[key]);
      }

      setSaveSuccess(true);
      setSnackbar({
        open: true,
        message: "설정이 성공적으로 저장되었습니다!",
        severity: "success",
      });
      setTimeout(() => {
        setSaveSuccess(false);
        setAnchorEl(null); // 팝오버 닫기
        window.location.reload();
      }, 500);
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
      setTimeout(() => setSaveError(false), 500);
    } finally {
      setIsSaving(false);
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
            <Box
              component="span"
              sx={{ color: "common.skyBlue", fontWeight: "bold" }}
            >
              S
            </Box>
            )
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

      {controllerExpanded && (
        <>
          <Tooltip
            slotProps={tooltipSlotProps}
            title={
              <>
                {themeMode === "light" ? "다크 모드 " : "화이트 모드 "}(
                <Box
                  component="span"
                  sx={{ color: "common.skyBlue", fontWeight: "bold" }}
                >
                  M
                </Box>
                )
              </>
            }
          >
            <IconButton onClick={handleToggleTheme}>
              {themeMode === "light" ? (
                <Brightness4Icon sx={iconStyle} />
              ) : (
                <Brightness7Icon sx={iconStyle} />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip
            slotProps={tooltipSlotProps}
            title={
              <>
                {showCurrentTime ? "현재 시간 on " : "현재 시간 off "}(
                <Box
                  component="span"
                  sx={{ color: "common.skyBlue", fontWeight: "bold" }}
                >
                  T
                </Box>
                )
              </>
            }
          >
            <IconButton
              onClick={handleToggleCurrentTime}
              sx={{
                "& .MuiSvgIcon-root": !showCurrentTime
                  ? { color: "text.quaternary" }
                  : {},
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
                <Box
                  component="span"
                  sx={{ color: "common.skyBlue", fontWeight: "bold" }}
                >
                  V
                </Box>
                )
              </>
            }
          >
            <IconButton
              onClick={handleTogglePointerEvents}
              sx={{ padding: 1.25 }}
            >
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
                채널 정보 갱신 (
                <Box
                  component="span"
                  sx={{ color: "common.skyBlue", fontWeight: "bold" }}
                >
                  R
                </Box>
                )
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
                "&.Mui-disabled .MuiSvgIcon-root": {
                  color: "text.quaternary",
                },
              }}
            >
              <RefreshIcon sx={iconStyle} />
            </IconButton>
          </Tooltip>

          <Tooltip slotProps={tooltipSlotProps} title="데이터 동기화">
            <IconButton onClick={handleOpenPopover}>
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
            <Box
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1,
                backgroundColor: "background.level1",
                width: "27rem",
              }}
            >
              <TextField
                label="SETTING"
                multiline
                rows={8}
                value={data}
                onChange={(e) => setData(e.target.value)}
                variant="outlined"
                fullWidth
              />
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
                      variant="contained"
                      onClick={handleCopy}
                      sx={{
                        animation: copySuccess
                          ? "successAnimation 0.5s ease"
                          : "none",
                        "@keyframes successAnimation": successAnimation,
                      }}
                    >
                      <ContentCopyIcon />
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
                      : "붙여넣은 설정 저장"
                  }
                >
                  <span>
                    <IconButton
                      disabled={saveSuccess || isSaving}
                      variant="contained"
                      onClick={handleSave}
                      sx={{
                        animation: saveSuccess
                          ? "successAnimation 0.5s ease"
                          : saveError
                          ? "errorAnimation 0.5s ease"
                          : "none",
                        "@keyframes successAnimation": successAnimation,
                        "@keyframes errorAnimation": errorAnimation,
                      }}
                    >
                      {isSaving ? (
                        <CircularProgress size={15} />
                      ) : (
                        <CheckIcon />
                      )}
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
                전체화면 (
                <Box
                  component="span"
                  sx={{ color: "common.skyBlue", fontWeight: "bold" }}
                >
                  F
                </Box>
                )
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
  );
}