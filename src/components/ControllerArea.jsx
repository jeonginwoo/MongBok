import React from "react";
import { Box, Paper } from "@mui/material";
import LayoutToggleGroup from "@/components/Controller/LayoutToggleGroup";
import SearchChannel from "@/components/Controller/SearchChannel";
import ChannelList from "@/components/Controller/ChannelList";
import ControlButtonGroup from "@/components/Controller/ControlButtonGroup";

export default function ControllerArea({
  channels,
  setChannels,
  layoutType,
  setLayoutType,
  pointerEventsEnabled,
  setPointerEventsEnabled,
  fullscreen,
}) {
  const viewCount = Object.values(channels).filter((c) => c.isVisible).length;

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

      {/* 🔹 버튼 그룹 */}
      <ControlButtonGroup
        pointerEventsEnabled={pointerEventsEnabled}
        setPointerEventsEnabled={setPointerEventsEnabled}
        fullscreen={fullscreen}
        channels={channels}
        setChannels={setChannels}
      />
    </Paper>
  );
}
