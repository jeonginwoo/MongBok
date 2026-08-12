"use client";

import React from "react";
import { Box, Paper } from "@mui/material";
import SearchChannel from "@/components/Controller/SearchChannel";
import ChannelList from "@/components/Controller/ChannelList";
import ControlButtonGroup from "@/components/Controller/ControlButtonGroup";

import { useAtomValue } from "jotai";
import { controllerExpandedAtom } from "@/atoms/setting";

export default function ControllerArea({ fullscreen }) {
  const controllerExpanded = useAtomValue(controllerExpandedAtom);

  return (
    <Paper
      elevation={0}
      sx={{
        width: controllerExpanded ? 290 : 80,
        backgroundColor: "background.paper",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
        paddingTop: "1.6rem",
        borderLeft: "0.1rem solid",
        borderColor: "divider",
        flexShrink: 0,
      }}
    >
      {/* 🔹 검색 컴포넌트 추가 */}
      {controllerExpanded && (
        <Box sx={{ mb: 2, pr: 1.5, pl: 1.5 }}>
          <SearchChannel />
        </Box>
      )}

      {/* 🔹 채널 리스트 (남은 공간 전부 차지) */}
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <ChannelList />
      </Box>

      {/* 🔹 버튼 그룹 */}
      <ControlButtonGroup fullscreen={fullscreen} />
    </Paper>
  );
}
