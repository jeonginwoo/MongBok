"use client";

import { useRef, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import RefreshIcon from "@mui/icons-material/Refresh";

import ChannelInfo from "@/components/Info/ChannelInfo/ViewAreaChannelInfo";
import ChatView from "@/components/View/Chat/ChatView";

import { useAtomValue, useSetAtom } from "jotai";
import { controllerExpandedAtom, chatFontSizeAdjustmentAtom, CHAT_FONT_SIZE_BASE, CHAT_FONT_SIZE_STEP, pointerEventsEnabledAtom, channelsAtom } from "@/atoms/setting";
import { fitStyleAtom } from "@/atoms/ui";
import { ENABLE_CHZZK, ENABLE_SOOP, ENABLE_YOUTUBE, ENABLE_TWITCH } from "@/data/config";
import { getLiveStatus } from "@/api/live";
import useCanvasZoom from "@/hooks/useCanvasZoom";

import useChzzkChat from "@/hooks/useChzzkChat";
import useSoopChat from "@/hooks/useSoopChat";
import useYoutubeChat from "@/hooks/useYoutubeChat";
import useTwitchChat from "@/hooks/useTwitchChat";

export default function DraggableChat({ channel, zone }) {
  // 조기 반환이 훅보다 앞에 올 수 없으므로(rules-of-hooks) channel이 null인
  // 동안은 옵셔널 체이닝으로 훅을 비활성 인자(null)로 통과시킨 뒤 아래에서 반환
  const controllerExpanded = useAtomValue(controllerExpandedAtom);
  const fitStyle = useAtomValue(fitStyleAtom);
  const chatFontSizeAdjustment = useAtomValue(chatFontSizeAdjustmentAtom);
  const pointerEventsEnabled = useAtomValue(pointerEventsEnabledAtom);

  const draggableId = `${channel?.key}-chat`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: draggableId,
    });

  const containerRef = useRef(null);
  // 캔버스 크기에 비례하는 배율 (현재시간 등 다른 오버레이와 공용 훅으로 통일)
  const zoom = useCanvasZoom(containerRef);
  const channelId = channel?.id;

  const chzzkChat = useChzzkChat(
    (ENABLE_CHZZK && channel?.platform === "chzzk") ? channelId : null
  );
  const soopChat = useSoopChat(
    (ENABLE_SOOP && channel?.platform === "soop") ? channelId : null
  );
  const youtubeChat = useYoutubeChat(
    (ENABLE_YOUTUBE && channel?.platform === "youtube") ? channelId : null
  );
  const twitchChat = useTwitchChat(
    (ENABLE_TWITCH && channel?.platform === "twitch") ? channelId : null
  );

  const { chatList, status, error, retry } = useMemo(() => {
    if (channel?.platform === "chzzk") return chzzkChat;
    if (channel?.platform === "soop") return soopChat;
    if (channel?.platform === "youtube") return youtubeChat;
    if (channel?.platform === "twitch") return twitchChat;
    return { chatList: [], status: "idle", error: null, retry: () => {} };
  }, [channel?.platform, chzzkChat, soopChat, youtubeChat, twitchChat]);

  const setChannels = useSetAtom(channelsAtom);

  if (!channel) return null;

  const handleManualRefresh = async () => {
    if (status === "offline") {
      try {
        const liveStatus = await getLiveStatus(channelId, channel.platform);
        setChannels((prev) => {
          // 갱신 도중 채널이 삭제/교체된 경우 무시 (유령 채널 생성 방지)
          if (!prev[channel.key]) return prev;
          return { ...prev, [channel.key]: { ...prev[channel.key], ...liveStatus } };
        });
      } catch (err) {
        console.error("❌ 라이브 상태 갱신 실패:", err);
      }
    }
    retry();
  };

  const layoutKey = `${zone?.style?.width}-${zone?.style?.height}-${controllerExpanded}-${JSON.stringify(fitStyle)}`;

  const style = (theme) => ({
    position: "absolute",
    transform: transform
      ? `translate3d(${transform.x / 10}rem, ${transform.y / 10}rem, 0)`
      : undefined,
    background: isDragging
      ? theme.palette.common.lightSkyBlue
      : theme.palette.background.canvas,
    opacity: isDragging ? 0.6 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: !pointerEventsEnabled ? "grab" : undefined,
    // dnd-kit이 부여하는 tabIndex 때문에 드래그 후 키 입력 시 포커스 링이 뜬다.
    // 녹화에 잡히는 UA 기본 outline(Light 검정/Dark 흰색)을 제거
    outline: "none",
    transition: isDragging ? "none" : "0.5s ease",
    boxSizing: "border-box",
    overflow: "hidden",
    touchAction: !pointerEventsEnabled ? "none" : "auto",
    ...zone?.style,
    zIndex: isDragging ? 300 : 100,
  });

  return (
    <Box ref={setNodeRef} {...attributes} {...(!pointerEventsEnabled ? listeners : {})} sx={style}>
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          zoom: zoom,
          transformOrigin: "top left",
          fontSize: `${CHAT_FONT_SIZE_BASE + chatFontSizeAdjustment * CHAT_FONT_SIZE_STEP}rem`,
        }}
      >
        <Box
          {...(pointerEventsEnabled ? listeners : {})}
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            maxHeight: "10rem",
            aspectRatio: "100/30",
            background: (theme) => theme.palette.background.gradient,
            p: "1.2rem",
            zIndex: 10,
            cursor: pointerEventsEnabled ? "grab" : undefined,
            pointerEvents: pointerEventsEnabled ? "auto" : "none",
          }}
        >
          <Box sx={{ pointerEvents: "none" }}>
            <ChannelInfo channel={channel} />
          </Box>
        </Box>
        <Box
          sx={{
            width: "100%",
            height: "100%",
            pointerEvents: pointerEventsEnabled ? "auto" : "none",
          }}
        >
          <ChatView chatList={chatList} layoutKey={layoutKey} />

          {/* 치지직 소프트 오프라인 표시 */}
          {channel.platform === "chzzk" && !channel.isLive && status === "connected" && (
            <Box
              sx={{
                position: "absolute",
                bottom: "1em",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0, 0, 0, 0.7)",
                color: "white",
                px: "1.5em",
                py: "0.5em",
                borderRadius: "2em",
                backdropFilter: "blur(4px)",
                zIndex: 20,
                pointerEvents: "none",
                whiteSpace: "nowrap",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <Typography sx={{ fontWeight: "bold", opacity: 0.9, fontSize: "1em" }}>
                방송 중이 아닙니다 (채팅 연결됨)
              </Typography>
            </Box>
          )}
          
          {(status === "loading" || status === "error" || status === "disconnected" || (status === "offline" && channel.platform !== "chzzk")) && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0, 0, 0, 0.6)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 20,
                backdropFilter: "blur(4px)",
                p: "2rem",
                textAlign: "center",
                pointerEvents: "auto",
              }}
            >
              {status === "loading" && (
                <>
                  <CircularProgress size="4em" sx={{ mb: "1.5em" }} />
                  <Typography sx={{ fontSize: "1.2em" }}>채팅에 연결 중입니다...</Typography>
                </>
              )}

              {status === "offline" && (
                <>
                  <Typography sx={{ mb: "1em", fontWeight: "bold", fontSize: "1.5em" }}>
                    채널이 오프라인 상태입니다
                  </Typography>
                  <Typography sx={{ mb: "2em", opacity: 0.8, fontSize: "1em" }}>
                    방송이 시작되면 자동으로 채팅이 연결됩니다.
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon sx={{ fontSize: "1.2em" }} />}
                    onClick={handleManualRefresh}
                    sx={{
                      borderRadius: "2em",
                      px: "2em",
                      py: "0.5em",
                      fontSize: "0.9em",
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.5)",
                      "&:hover": {
                        borderColor: "white",
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      }
                    }}
                  >
                    상태 새로고침
                  </Button>
                </>
              )}
              
              {(status === "error" || status === "disconnected") && (
                <>
                  <Typography sx={{ mb: "0.5em", color: "error.main", fontWeight: "bold", fontSize: "1.2em" }}>
                    {status === "error" ? "채팅을 불러오지 못했습니다" : "채팅 연결이 끊어졌습니다"}
                  </Typography>
                  {error && (
                    <Typography sx={{ mb: "1.5em", opacity: 0.7, fontSize: "0.8em" }}>
                      {error}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon sx={{ fontSize: "1.2em" }} />}
                    onClick={handleManualRefresh}
                    sx={{
                      borderRadius: "2em",
                      px: "2rem",
                      py: "0.5rem",
                      fontSize: "0.9em",
                    }}
                  >
                    다시 시도
                  </Button>
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
