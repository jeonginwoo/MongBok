import React, { useState, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { getAllChannelsData, getLiveStatus } from "@/api/live";
import { layouts } from "@/data/layouts";

import ViewArea from "@/components/ViewArea";
import ControllerArea from "@/components/ControllerArea";

export default function App() {
  const [channels, setChannels] = useState({});
  const [pointerEventsEnabled, setPointerEventsEnabled] = useState(false);
  const [layoutType, setLayoutType] = useState(localStorage.layout || "layout1");
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

  /** 🧱 Layout 계산 */
  const viewCount = Object.values(channels).filter((c) => c.isVisible).length;
  const layout = layouts[viewCount][layoutType];

  /** 🧭 전체화면 */
  const fullscreen = () => {
    const canvas = canvasRef.current;
    if (!document.fullscreenElement) canvas?.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <ViewArea
        channels={channels}
        setChannels={setChannels}
        layout={layout}
        canvasRef={canvasRef}
        pointerEventsEnabled={pointerEventsEnabled}
        fullscreen={fullscreen}
      />
      <ControllerArea
        channels={channels}
        setChannels={setChannels}
        layoutType={layoutType}
        setLayoutType={setLayoutType}
        pointerEventsEnabled={pointerEventsEnabled}
        setPointerEventsEnabled={setPointerEventsEnabled}
        fullscreen={fullscreen}
      />
    </Box>
  );
}
