"use client";

import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { WarningAmber as WarningAmberIcon } from "@mui/icons-material";
import { useAtomValue } from "jotai";
import { controllerExpandedAtom } from "@/atoms/setting";
import { isSavingRecordingAtom, settingsOpenAtom } from "@/atoms/ui";

const SAVING_MESSAGE = "녹화 파일 저장 중... 브라우저를 닫으면 녹화본이 훼손될 수 있습니다.";

/**
 * 녹화 파일 저장 중 경고 배너.
 * 앱 상단이 아닌 리모컨(컨트롤러+설정) 블록 상단에 두는 이유:
 * 앱 상단에 있으면 배너가 뜰 때마다 캔버스 높이가 줄어 화면이 출렁인다.
 */
export default function RecordingSavingBanner() {
  const isSavingRecording = useAtomValue(isSavingRecordingAtom);
  const controllerExpanded = useAtomValue(controllerExpandedAtom);
  const settingsOpen = useAtomValue(settingsOpenAtom);

  if (!isSavingRecording) return null;

  // 접힌 컨트롤러(80px)만 있을 때는 긴 문구가 한 단어씩 깨지므로 아이콘+툴팁으로 축약
  const showText = controllerExpanded || settingsOpen;

  return (
    <Tooltip title={showText ? "" : SAVING_MESSAGE} placement="left" arrow>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          px: 1.5,
          py: 0.8,
          bgcolor: "warning.main",
          color: "warning.contrastText",
          flexShrink: 0,
          // 리모컨 팝업 root가 max-content 폭이라 긴 문구가 컬럼 폭을 늘릴 수 있다.
          // 내재 폭 기여를 0으로 두고 레이아웃 시점에 컬럼 폭(100%)으로 늘린다.
          width: 0,
          minWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <WarningAmberIcon sx={{ fontSize: "1.6rem", flexShrink: 0 }} />
        {showText && (
          <Typography sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>
            {SAVING_MESSAGE}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}
