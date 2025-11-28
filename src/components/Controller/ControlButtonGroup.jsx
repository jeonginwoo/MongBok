import React, { useState, useEffect } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import MouseIcon from "@mui/icons-material/Mouse";
import PanToolIcon from "@mui/icons-material/PanTool";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { getLiveStatus } from "@/api/live";

import { useAtom } from "jotai";
import {
  pointerEventsEnabledAtom,
  showCurrentTimeAtom,
  channelsAtom,
} from "@/atoms/setting";

// 🚨 강조할 단축키 스타일
const shortcutStyle = { color: "#4fc3f7", fontWeight: "bold" };

export default function ControlButtonGroup({ fullscreen }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pointerEventsEnabled, setPointerEventsEnabled] = useAtom(pointerEventsEnabledAtom);
  const [showCurrentTime, setShowCurrentTime] = useAtom(showCurrentTimeAtom);
  const [channels, setChannels] = useAtom(channelsAtom);

  const handleTogglePointerEvents = () => {
    setPointerEventsEnabled((prev) => {
      const nextState = !prev;
      window.localStorage.setItem("pointerEventsEnabled", JSON.stringify(nextState));
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

  const handleRefresh = async () => {
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
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
        return;
      }

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
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
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
    <Box sx={{ display: "flex", gap: 1, justifyContent: "end", mt: 2 }}>
      {/* 🔹 CurrentTime 토글 버튼 (T) */}
      <Tooltip
        title={
          // 🚨 JSX를 title로 전달
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

      {/* 🔹 포인터 이벤트 토글 (V) */}
      <Tooltip
        title={
          // 🚨 JSX를 title로 전달
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

      {/* 🔹 채널 정보 갱신 (R) */}
      <Tooltip
        title={
          // 🚨 JSX를 title로 전달
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
            // 회전 애니메이션
            "& .MuiSvgIcon-root": refreshing
              ? {
                  animation: "rotate360 1s linear",
                  "@keyframes rotate360": rotate360,
                }
              : {}, // disabled 상태일 때 밝은 색
            "&.Mui-disabled .MuiSvgIcon-root": {
              color: "#aaa", // 밝은 회색
            },
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Tooltip>

      {/* 🔹 전체화면 (F) */}
      <Tooltip
        title={
          // 🚨 JSX를 title로 전달
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
  );
}
