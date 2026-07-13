"use client";

import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import Box from "@mui/material/Box";

import { useAtomValue } from "jotai";
import { controllerExpandedAtom } from "@/atoms/setting";
import { fitStyleAtom } from "@/atoms/ui";
import ChzzkHlsPlayer from "@/components/View/ChzzkHlsPlayer";
import OfflineScreen from "@/components/View/OfflineScreen";

export default function DraggableView({ channel, zone, pointerEventsEnabled }) {
  if (!channel) return null;

  const controllerExpanded = useAtomValue(controllerExpandedAtom);
  const fitStyle = useAtomValue(fitStyleAtom);

  const draggableId = `${channel.id}-view`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: draggableId,
    });

  const baseZIndex = zone?.style.zIndex || 0;
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [hlsFailed, setHlsFailed] = useState(false);
  const channelId = channel.id;

  // 방송 세션이 바뀌면(재시작 등) 폴백 상태 초기화
  // liveHlsUrl은 폴링마다 토큰이 갱신되어 바뀔 수 있으므로 기준으로 쓰지 않는다
  useEffect(() => {
    setHlsFailed(false);
  }, [channel.isLive, channel.openDate]);

  const BASE_WIDTH = window.screen.width;

  useEffect(() => {
    const updateZoom = () => {
      if (!containerRef.current) return;

      const canvas = containerRef.current.closest(".canvas");
      if (!canvas) return;

      const canvasWidth = canvas.clientWidth;
      const widthStr = zone?.style.width;
      let percent = 1;
      if (typeof widthStr === "string" && widthStr.endsWith("%")) {
        percent = parseFloat(widthStr) / 100;
      }

      const zonePixelWidth = canvasWidth * percent;
      const newZoom =
        zonePixelWidth < BASE_WIDTH ? zonePixelWidth / BASE_WIDTH : 1;
      setZoom(newZoom);
    };

    updateZoom();
    const timer = setTimeout(updateZoom, 300);
    window.addEventListener("resize", updateZoom);
    
    return () => {
      window.removeEventListener("resize", updateZoom);
      clearTimeout(timer);
    };
    
  }, [zone?.style.width, controllerExpanded, fitStyle]);

  const style = (theme) => ({
    position: "absolute",
    transform: transform
      ? `translate3d(${transform.x/10}rem, ${transform.y/10}rem, 0)`
      : undefined,
    background: isDragging ? theme.palette.common.lightSkyBlue : theme.palette.background.canvas,
    opacity: isDragging ? 0.6 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: pointerEventsEnabled ? "default" : "grab",
    transition: isDragging ? "none" : "0.5s ease",
    boxSizing: "border-box",
    touchAction: pointerEventsEnabled ? "auto" : "none",
    ...zone?.style,
    zIndex: isDragging ? 310 : 110 + baseZIndex,
  });

  const iframeSrc =
    channel.platform === "chzzk"
      ? `https://chzzk.naver.com/live/${channelId}`
      : channel.platform === "soop"
      ? `https://play.sooplive.com/${channelId}/embed`
      : channel.platform === "youtube"
      ? channel.liveVideoId
        ? `https://www.youtube.com/embed/${channel.liveVideoId}?autoplay=1`
        : `https://www.youtube.com/embed/live_stream?channel=${channelId}`
      : channel.platform === "twitch"
      ? `https://player.twitch.tv/?channel=${channelId}&parent=${typeof window !== "undefined" ? window.location.hostname : "localhost"}&autoplay=true`
      : "";

  // 치지직: HLS URL이 있으면 iframe 대신 순수 플레이어로 재생 (실패 시 iframe 폴백)
  const useChzzkHls =
    channel.platform === "chzzk" && !!channel.liveHlsUrl && !hlsFailed;

  // 치지직 초기 로딩 중에는 iframe(페이지 전체 로드)을 띄우지 않고
  // HLS URL 확보 여부가 결정될 때까지 대기
  const isChzzkLoading = channel.platform === "chzzk" && channel._loading;

  // 치지직 오프라인: 방송이 끊겨도 liveHlsUrl이 남아 플레이어가 유지되지 않도록
  // isLive 기준으로 오프라인 화면을 우선 표시
  const isChzzkOffline =
    channel.platform === "chzzk" && !channel._loading && !channel.isLive;

  return (
    <Box ref={setNodeRef} {...(!pointerEventsEnabled && listeners)} {...(!pointerEventsEnabled && attributes)} sx={style}>
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: "100%",
          // zoom은 iframe(페이지 전체)을 zone에 맞춰 축소하는 용도.
          // HLS 플레이어/오프라인 화면은 UI가 작아지지 않게 제외
          zoom: useChzzkHls || isChzzkLoading || isChzzkOffline ? 1 : zoom,
          transformOrigin: "top left",
        }}
      >
        {isChzzkLoading ? (
          <Box sx={{ width: "100%", height: "100%", background: "#000" }} />
        ) : isChzzkOffline ? (
          <OfflineScreen channel={channel} />
        ) : useChzzkHls ? (
          <ChzzkHlsPlayer
            hlsUrl={channel.liveHlsUrl}
            channel={channel}
            pointerEventsEnabled={pointerEventsEnabled}
            onError={() => setHlsFailed(true)}
          />
        ) : (
          <Box
            component="iframe"
            key={channel?.isLive ? "live" : "offline"}
            src={iframeSrc}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write; loopback-network"
            allowFullScreen
            sx={{
              width: "100%",
              height: "100%",
              border: "none",
              pointerEvents: pointerEventsEnabled ? "auto" : "none",
            }}
          />
        )}
      </Box>
    </Box>
  );
}