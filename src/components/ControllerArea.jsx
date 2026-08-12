"use client";

import React from "react";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import { WarningAmber as WarningAmberIcon } from "@mui/icons-material";
import SearchChannel from "@/components/Controller/SearchChannel";
import ChannelList from "@/components/Controller/ChannelList";
import ControlButtonGroup from "@/components/Controller/ControlButtonGroup";

import { useAtomValue } from "jotai";
import { controllerExpandedAtom } from "@/atoms/setting";
import { isSavingRecordingAtom } from "@/atoms/ui";

const SAVING_MESSAGE = "녹화 파일 저장 중... 브라우저를 닫으면 녹화본이 훼손될 수 있습니다.";

export default function ControllerArea({ fullscreen }) {
  const controllerExpanded = useAtomValue(controllerExpandedAtom);
  const isSavingRecording = useAtomValue(isSavingRecordingAtom);

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
      {/* 저장 중 경고는 캔버스 크기에 영향을 주지 않도록 리모컨 컬럼 안에만 표시.
          리모컨 분리 시 컨트롤러와 함께 팝업으로 portal 되어 팝업 상단에 뜬다. */}
      {isSavingRecording && (
        <Tooltip title={controllerExpanded ? "" : SAVING_MESSAGE} placement="left" arrow>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              px: 1.5,
              py: 0.8,
              mt: "-1.6rem", // Paper의 paddingTop을 상쇄해 컬럼 맨 위에 붙인다
              mb: 1.5,
              bgcolor: "warning.main",
              color: "warning.contrastText",
              flexShrink: 0,
            }}
          >
            <WarningAmberIcon sx={{ fontSize: "1.6rem", flexShrink: 0 }} />
            {controllerExpanded && (
              <Typography sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                {SAVING_MESSAGE}
              </Typography>
            )}
          </Box>
        </Tooltip>
      )}

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
