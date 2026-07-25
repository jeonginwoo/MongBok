"use client";

import { useEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import Box from "@mui/material/Box";

import ChzzkHlsPlayer from "@/components/View/ChzzkHlsPlayer";
import OfflineScreen from "@/components/View/OfflineScreen";

// HLS 실패 후 iframe 폴백에서 HLS 재시도까지 대기 시간.
// 60초 폴링 주기와 맞춰 새로 서명된 HLS URL이 확보된 뒤 재시도하게 한다
const HLS_RETRY_DELAY = 60 * 1000;

export default function DraggableView({ channel, zone, pointerEventsEnabled }) {
  if (!channel) return null;

  const draggableId = `${channel.key}-view`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: draggableId,
    });

  const baseZIndex = zone?.style.zIndex || 0;
  const [hlsFailed, setHlsFailed] = useState(false);
  const channelId = channel.id;

  // 방송 세션이 바뀌면(재시작 등) 폴백 상태 초기화
  // liveHlsUrl은 폴링마다 토큰이 갱신되어 바뀔 수 있으므로 기준으로 쓰지 않는다
  useEffect(() => {
    setHlsFailed(false);
  }, [channel.isLive, channel.openDate]);

  // iframe 폴백은 임시 상태로만 사용: 일정 시간 뒤 최신 URL로 HLS를 재시도한다.
  // 폴백 상태를 방치하면 iframe(치지직 전체 페이지)이 깨져도 감시하는 로직이
  // 없어 방송이 끝날 때까지 복구가 불가능하다 (밤샘 녹화 중 흰 화면 고착 원인)
  useEffect(() => {
    if (!hlsFailed) return;
    const timerId = setTimeout(() => setHlsFailed(false), HLS_RETRY_DELAY);
    return () => clearTimeout(timerId);
  }, [hlsFailed]);

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
    // dnd-kit이 부여하는 tabIndex 때문에 드래그 후 키 입력 시 포커스 링이 뜬다.
    // 녹화에 잡히는 UA 기본 outline(Light 검정/Dark 흰색)을 제거
    outline: "none",
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
        sx={{
          width: "100%",
          height: "100%",
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