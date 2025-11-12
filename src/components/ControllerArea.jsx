import React from "react";
import { Box, Paper, Button, Select, MenuItem } from "@mui/material";
import { layouts } from "@/data/layouts";
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
  const viewCount =
    Object.values(channels).filter((c) => c.isVisible).length || 1;

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
        overflowY: "auto",
      }}
    >
      {/* LayoutType 선택 */}
      <Box sx={{ mb: 2 }}>
        <Select
          value={layoutType}
          onChange={(e) => setLayoutType(e.target.value)}
          fullWidth
          sx={{
            color: "#d3d3d3ff",
            border: "1px solid #d3d3d3ff",
            ".MuiOutlinedInput-notchedOutline": {
              borderColor: "#d3d3d3ff",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "d3d3d3ff",
            },
            ".MuiSvgIcon-root": { color: "#d3d3d3ff" },
          }}
        >
          {Object.keys(layouts[viewCount]).map((key) => (
            <MenuItem key={key} value={key}>
              {key}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* 채널 리스트 */}
      <Box sx={{ flex: "1 1 auto" }}>
        <ChannelList
          channels={channels}
          setChannels={setChannels}
          setLayoutType={setLayoutType}
        />
      </Box>

      {/* PointerEvents 토글 */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color={pointerEventsEnabled ? "success" : "secondary"}
          fullWidth
          onClick={() => setPointerEventsEnabled((prev) => !prev)}
        >
          {pointerEventsEnabled ? "조작 모드: ON" : "조작 모드: OFF"}
        </Button>
      </Box>

      {/* 전체화면 버튼 */}
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" color="primary" fullWidth onClick={fullscreen}>
          전체화면
        </Button>
      </Box>
    </Paper>
  );
}
