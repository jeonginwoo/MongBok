import React from "react";
import { Box, Paper, Button } from "@mui/material";
import LayoutToggleGroup from "@/components/Controller/LayoutToggleGroup";
import SearchChannel from "@/components/Controller/SearchChannel";
import ChannelList from "@/components/Controller/ChannelList";

export default function ControllerArea({
  channels,
  setChannels,
  layoutType,
  setLayoutType,
  pointerEventsEnabled,
  setPointerEventsEnabled,
  fullscreen,
}) {
  const viewCount = Object.values(channels).filter((c) => c.isVisible).length || 1;

  return (
    <Paper
      elevation={3}
      sx={{
        width: 320,
        backgroundColor: "#1e1e1e",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: "12px 12px 12px 30px",
      }}
    >
      {/* 🔹 LayoutType 선택 */}
      <Box sx={{ mb: 2, pr: 1 }}>
        <LayoutToggleGroup
          layoutType={layoutType}
          setLayoutType={setLayoutType}
          viewCount={viewCount}
        />
      </Box>

      {/* 🔹 검색 컴포넌트 추가 */}
      <Box sx={{ mb: 2, pr: 1 }}>
        <SearchChannel setChannels={setChannels} />
      </Box>

      {/* 🔹 채널 리스트 (남은 공간 전부 차지) */}
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <ChannelList
          channels={channels}
          setChannels={setChannels}
          setLayoutType={setLayoutType}
        />
      </Box>

      {/* 🔹 PointerEvents 토글 */}
      <Box sx={{ mt: 2, pr: 1 }}>
        <Button
          variant="contained"
          color={pointerEventsEnabled ? "success" : "secondary"}
          fullWidth
          onClick={() => setPointerEventsEnabled((prev) => !prev)}
        >
          {pointerEventsEnabled ? "조작 모드: ON" : "조작 모드: OFF"}
        </Button>
      </Box>

      {/* 🔹 전체화면 버튼 */}
      <Box sx={{ mt: 1, pr: 1 }}>
        <Button variant="contained" color="primary" fullWidth onClick={fullscreen}>
          전체화면
        </Button>
      </Box>
    </Paper>
  );
}
