import React, { useEffect, useRef } from "react";
import { CssBaseline, Box } from "@mui/material";
import { getLiveStatus } from "@/api/live";

import ViewArea from "@/components/ViewArea";
import ControllerArea from "@/components/ControllerArea";

import { useAtom } from "jotai";
import { channelsAtom } from "@/atoms/setting";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

export default function App() {
  const [channels, setChannels] = useAtom(channelsAtom);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (Object.keys(channels).length === 0) return;

    const interval = setInterval(async () => {
      const entries = Object.entries(channels);
      await Promise.all(
        entries.map(async ([channelId, item]) => {
          const liveStatus = await getLiveStatus(channelId, item.platform);
          setChannels((prev) => ({
            ...prev,
            [channelId]: { ...prev[channelId], ...liveStatus },
          }));
        })
      );
    }, 60000);

    return () => clearInterval(interval);
  }, [channels]);

  /** 🧭 전체화면 */
  const fullscreen = () => {
    const canvas = canvasRef.current;
    if (!document.fullscreenElement) canvas?.requestFullscreen();
    else document.exitFullscreen();
  };

  // 📱 모바일 브라우저 100vh 높이 보정 로직
  useEffect(() => {
    const setScreenHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setScreenHeight();
    window.addEventListener("resize", setScreenHeight);
    return () => window.removeEventListener("resize", setScreenHeight);
  }, []);

  return (
    <>
      <Analytics />
      <SpeedInsights />
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          height: "calc(var(--vh, 1vh) * 100)",
          overflow: "hidden",
        }}
      >
        <ViewArea canvasRef={canvasRef} fullscreen={fullscreen} />
        <ControllerArea fullscreen={fullscreen} />
      </Box>
    </>
  );
}
