import React from "react";
import { Box, Paper } from "@mui/material";
import LayoutToggleGroup from "@/components/Controller/LayoutToggleGroup";
import SearchChannel from "@/components/Controller/SearchChannel";
import ChannelList from "@/components/Controller/ChannelList";
import ControlButtonGroup from "@/components/Controller/ControlButtonGroup";
import GlobalSnackbar from "@/components/Info/GlobalSnackbar";

import { useAtomValue } from "jotai";
import { viewCountAtom } from "@/atoms/setting";

export default function ControllerArea({ fullscreen }) {
  const viewCount = useAtomValue(viewCountAtom);

  return (
    <Paper
      elevation={3}
      sx={{
        width: 320,
        backgroundColor: "#1e1e1e",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        padding: "12px 12px 12px 24px",
      }}
    >
      {/* 🔹 LayoutType 선택 */}
      <Box sx={{ mb: 2, pr: 1.5 }}>
        <LayoutToggleGroup viewCount={viewCount} />
      </Box>

      {/* 🔹 검색 컴포넌트 추가 */}
      <Box sx={{ mb: 2, pr: 1.5 }}>
        <SearchChannel />
      </Box>

      {/* 🔹 채널 리스트 (남은 공간 전부 차지) */}
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <ChannelList />
      </Box>

      {/* 🔹 버튼 그룹 */}
      <ControlButtonGroup fullscreen={fullscreen} />

      {/* 🔹 스넥바 */}
      <GlobalSnackbar />
    </Paper>
  );
}
