import React, { useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import MouseIcon from "@mui/icons-material/Mouse";
import PanToolIcon from "@mui/icons-material/PanTool";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getLiveStatus } from "@/api/live";

export default function ControlButtonGroup({
  pointerEventsEnabled,
  setPointerEventsEnabled,
  fullscreen,
  channels,
  setChannels,
}) {
  const [refreshing, setRefreshing] = useState(false);

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
  
  const rotate360 = {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  };

  return (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "end", mt: 2 }}>
      {/* 🔹 채널 정보 갱신 */}
      <Tooltip title="채널 정보 갱신">
        <IconButton
          color="info"
          onClick={handleRefresh}
          disabled={refreshing}
          sx={{
            // 회전 애니메이션
            "& .MuiSvgIcon-root": refreshing
              ? {
                animation: "rotate360 1s linear",
                '@keyframes rotate360': rotate360,
              }
              : {},
            // disabled 상태일 때 밝은 색
            "&.Mui-disabled .MuiSvgIcon-root": {
              color: "#aaa", // 밝은 회색
            },
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Tooltip>
      
      {/* 🔹 포인터 이벤트 토글 */}
      <Tooltip
        title={
          pointerEventsEnabled
            ? "iframe 조작 모드"
            : "화면 이동 모드"
        }
      >
        <IconButton
          color={pointerEventsEnabled ? "success" : "secondary"}
          onClick={() => setPointerEventsEnabled((prev) => !prev)}
        >
          {pointerEventsEnabled ? <MouseIcon /> : <PanToolIcon />}
        </IconButton>
      </Tooltip>

      {/* 🔹 전체화면 */}
      <Tooltip title="전체화면">
        <IconButton color="primary" onClick={fullscreen}>
          <FullscreenIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
