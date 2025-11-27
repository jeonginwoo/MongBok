import React, { useEffect, useRef } from "react";
import { CssBaseline, Box } from "@mui/material";
import { getAllChannelsData, getLiveStatus } from "@/api/live";

import ViewArea from "@/components/ViewArea";
import ControllerArea from "@/components/ControllerArea";

import { useAtom } from 'jotai';
import { 
  channelsAtom, 
  layoutTypeAtom, 
} from '@/atoms/setting'; 

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react'; 

export default function App() {
  const [, setChannels] = useAtom(channelsAtom);
  const [, setLayoutType] = useAtom(layoutTypeAtom);
  const canvasRef = useRef(null);

  useEffect(() => {
    try {
      const savedChannels = JSON.parse(window.localStorage.getItem("channels"));
      const savedLayout = window.localStorage.getItem("layout");

      if (savedChannels && typeof savedChannels === "object") {
        loadInitialChannels(savedChannels);
      }

      if (savedLayout) {
        setLayoutType(savedLayout);
      }
    } catch (e) {
      console.error("❌ localStorage 불러오기 실패:", e);
    }
  }, []);

  /** 📦 초기 데이터 로드 */
  const loadInitialChannels = async (savedChannels) => {
    try {
      const data = await getAllChannelsData(savedChannels);
      setChannels(data);
      startLiveStatusInterval(savedChannels);
    } catch (error) {
      console.error("❌ 초기 채널 데이터 불러오기 실패:", error);
    }
  };

  /** 🔁 라이브 상태 자동 갱신 */
  const startLiveStatusInterval = (savedChannels) => {
    // 라이브 상태 갱신 로직 (생략하지 않고 포함)
    const interval = setInterval(async () => {
      try {
        const entries = Object.entries(savedChannels);

        await Promise.all(
          entries.map(async ([channelId, item]) => {
            try {
              const liveStatus = await getLiveStatus(channelId, item.platform);
              setChannels((prev) => ({
                ...prev,
                [channelId]: { ...prev[channelId], ...liveStatus },
              }));
            } catch (err) {
              console.error(`⚠️ ${channelId} 라이브 상태 갱신 실패:`, err);
            }
          })
        );
      } catch (error) {
        console.error("❌ 라이브 상태 갱신 오류:", error);
      }
    }, 60000);

    return () => clearInterval(interval);
  };

  /** 🧭 전체화면 */
  const fullscreen = () => {
    const canvas = canvasRef.current;
    if (!document.fullscreenElement) canvas?.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <>
      <Analytics />
      <SpeedInsights />
      
      <CssBaseline />
      <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <ViewArea
          canvasRef={canvasRef}
          fullscreen={fullscreen}
        />
        <ControllerArea
          fullscreen={fullscreen}
        />
      </Box>
    </>
  );
}
