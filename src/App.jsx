import React, { useState, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { getAllChannelsData, getLiveStatus } from "@/api/liveApi";
import { layouts } from "@/data/layouts";

import ViewArea from "@/components/ViewArea";
import ControllerArea from "@/components/ControllerArea";

export default function App() {
  const localStorage = {
    "34ea2a834c0022212290c26ac5e170a1": { zoneId: 1, platform: "chzzk" },
    "b3e262a2795f17734c149afc738ad250": { platform: "chzzk" },
    "b2854dc0735e55fa86c53bd15242d30f": { platform: "chzzk" },
    "6086f17b054010b0657af00aff6e6d05": { platform: "chzzk" },
    "93fe884808459fb4e4a3c7d64f0eef03": { platform: "chzzk" },
    "80b36a0ae8e887e893ce0014dbfece4a": { platform: "chzzk" },
    "5f800579267362c952f76f3c6fe695b2": { platform: "chzzk" },
    "60e2a319d889b3ef6979f68dc3c3fd79": { platform: "chzzk" },
    "f2607c885c65b6776b9cf5bfb473753c": { platform: "chzzk" },
    "w2rdoo": { platform: "soop" },
    "ooojoijo": { platform: "soop" },
  };

  const [channels, setChannels] = useState({});
  const [pointerEventsEnabled, setPointerEventsEnabled] = useState(false);
  const [layoutType, setLayoutType] = useState("layout1");
  const canvasRef = useRef(null);

  /** 📦 초기 데이터 + 라이브 상태 주기적 갱신 */
  useEffect(() => {
    const fetchInitialChannels = async () => {
      try {
        const data = await getAllChannelsData(localStorage);
        setChannels(data);
      } catch (error) {
        console.error("❌ 초기 채널 데이터 불러오기 실패:", error);
      }
    };

    const updateLiveStatus = async () => {
      try {
        const entries = Object.entries(localStorage);
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
    };

    fetchInitialChannels();
    const interval = setInterval(updateLiveStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  /** 🧱 Layout 계산 */
  const viewCount = Object.values(channels).filter((c) => c.isVisible).length || 1;
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
