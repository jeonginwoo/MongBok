"use client";

import React, { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { WarningAmber as WarningAmberIcon } from "@mui/icons-material";

import ManualArea from "@/components/ManualArea";
import ViewArea from "@/components/ViewArea";
import ControllerArea from "@/components/ControllerArea";
import SettingsArea from "@/components/SettingsArea";
import GlobalSnackbar from "@/components/Info/GlobalSnackbar";
import SettingChangeIndicator from "@/components/Info/SettingChangeIndicator";

import { useAtom, useAtomValue } from "jotai";
import { viewCountAtom } from "@/atoms/setting";
import { settingsOpenAtom, isSavingRecordingAtom } from "@/atoms/ui";

export default function App() {
  const viewCount = useAtomValue(viewCountAtom);
  const [settingsOpen, setSettingsOpen] = useAtom(settingsOpenAtom);
  const isSavingRecording = useAtomValue(isSavingRecordingAtom);
  const canvasRef = useRef(null);

  /** 🧭 전체화면 */
  const fullscreen = () => {
    const canvas = canvasRef.current;
    if (!document.fullscreenElement) canvas?.requestFullscreen();
    else document.exitFullscreen();
  };

  // 📱 모바일 브라우저 100vh 높이 보정 로직
  useEffect(() => {
    const setScreenHeight = () => {
      const vh = window.innerHeight * 0.001;
      document.documentElement.style.setProperty("--vh", `${vh}rem`);
    };
    setScreenHeight();
    window.addEventListener("resize", setScreenHeight);
    return () => window.removeEventListener("resize", setScreenHeight);
  }, []);

  return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "calc(var(--vh, 1vh) * 100)",
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        {isSavingRecording && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              px: 2,
              py: 0.8,
              bgcolor: "warning.main",
              color: "warning.contrastText",
              flexShrink: 0,
            }}
          >
            <WarningAmberIcon sx={{ fontSize: "1.6rem" }} />
            <Typography sx={{ fontSize: "1.3rem", fontWeight: "bold" }}>
              녹화 파일 저장 중... 브라우저를 닫으면 녹화본이 훼손될 수 있습니다.
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {(viewCount > 0)
          ? <ViewArea canvasRef={canvasRef} fullscreen={fullscreen} />
          : <ManualArea />}
          <ControllerArea fullscreen={fullscreen} />
          {settingsOpen && <SettingsArea onClose={() => setSettingsOpen(false)} />}
          <GlobalSnackbar />
          <SettingChangeIndicator />
        </Box>
      </Box>
  );
}