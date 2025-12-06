// useCallback을 추가로 import 해야 합니다.
import React, { useState, useEffect, useCallback } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import {
  Mouse as MouseIcon,
  PanTool as PanToolIcon,
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
  FormatIndentIncrease as FormatIndentIncreaseIcon,
  FormatIndentDecrease as FormatIndentDecreaseIcon,
} from "@mui/icons-material";
import { getLiveStatus } from "@/api/live";

import { useAtom } from "jotai";
import {
  pointerEventsEnabledAtom,
  showCurrentTimeAtom,
  channelsAtom,
  controllerExpandedAtom,
} from "@/atoms/setting";

const shortcutStyle = { color: "#4fc3f7", fontWeight: "bold" };

export default function ControlButtonGroup({ fullscreen, sx = {} }) {
  const [controllerExpanded, setControllerExpanded] = useAtom(
    controllerExpandedAtom
  );
  const [refreshing, setRefreshing] = useState(false);
  const [pointerEventsEnabled, setPointerEventsEnabled] = useAtom(
    pointerEventsEnabledAtom
  );
  const [showCurrentTime, setShowCurrentTime] = useAtom(showCurrentTimeAtom);
  const [channels, setChannels] = useAtom(channelsAtom);

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
        case "C":
          event.preventDefault();
          handleToggleController();
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

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: controllerExpanded ? "space-between" : "center",
        ...sx,
      }}
    >
      <Tooltip
        title={
          <>
            {controllerExpanded ? "컨트롤러 접기 " : "컨트롤러 펴기 "}(
            <span style={shortcutStyle}>C</span>)
          </>
        }
      >
        <IconButton color="primary" onClick={handleToggleController}>
          {controllerExpanded ? (
            <FormatIndentIncreaseIcon />
          ) : (
            <FormatIndentDecreaseIcon />
          )}
        </IconButton>
      </Tooltip>

      {controllerExpanded && (
        <Box>
          <Tooltip
            title={
              <>
                {showCurrentTime ? "현재 시간 on " : "현재 시간 off "}(
                <span style={shortcutStyle}>T</span>)
              </>
            }
          >
            <IconButton
              color="primary"
              onClick={handleToggleCurrentTime}
              sx={{
                "& .MuiSvgIcon-root": !showCurrentTime ? { color: "#aaa" } : {},
              }}
            >
              <AccessTimeIcon />
            </IconButton>
          </Tooltip>

          <Tooltip
            title={
              <>
                {pointerEventsEnabled ? "화면 조작 모드 " : "화면 이동 모드 "}(
                <span style={shortcutStyle}>V</span>)
              </>
            }
          >
            <IconButton color="primary" onClick={handleTogglePointerEvents}>
              {pointerEventsEnabled ? (
                <MouseIcon fontSize="small" />
              ) : (
                <PanToolIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip
            title={
              <>
                채널 정보 갱신 (<span style={shortcutStyle}>R</span>)
              </>
            }
          >
            <IconButton
              color="primary"
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                "& .MuiSvgIcon-root": refreshing
                  ? {
                      animation: "rotate360 1s linear",
                      "@keyframes rotate360": rotate360,
                    }
                  : {},
                "&.Mui-disabled .MuiSvgIcon-root": { color: "#aaa" },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip
            title={
              <>
                전체화면 (<span style={shortcutStyle}>F</span>)
              </>
            }
          >
            <IconButton color="primary" onClick={fullscreen}>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
