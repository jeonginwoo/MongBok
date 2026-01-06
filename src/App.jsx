import React, { useEffect, useRef } from "react";
import { CssBaseline, Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { getTheme } from "@/theme";

import ManualArea from "@/components/ManualArea";
import ViewArea from "@/components/ViewArea";
import ControllerArea from "@/components/ControllerArea";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import { useAtomValue } from "jotai";
import { viewCountAtom, themeModeAtom } from "@/atoms/setting";

export default function App() {
  const viewCount = useAtomValue(viewCountAtom);
  const themeMode = useAtomValue(themeModeAtom);
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
    <ThemeProvider theme={getTheme(themeMode)}>
      <CssBaseline />
      <Analytics />
      <SpeedInsights />
      <Box
        sx={{
          display: "flex",
          height: "calc(var(--vh, 1vh) * 100)",
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        {(viewCount > 0)
        ? <ViewArea canvasRef={canvasRef} fullscreen={fullscreen} />
        : <ManualArea />}
        <ControllerArea fullscreen={fullscreen} />
      </Box>
    </ThemeProvider>
  );
}