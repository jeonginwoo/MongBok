"use client";

import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import Box from "@mui/material/Box";

import ChannelInfo from "@/components/Info/ChannelInfo/ViewAreaChannelInfo";
import ChatView from "@/components/View/Chat/ChatView";

import { useAtomValue } from "jotai";
import { controllerExpandedAtom, chatFontSizeAdjustmentAtom, CHAT_FONT_SIZE_STEP, pointerEventsEnabledAtom } from "@/atoms/setting";
import { fitStyleAtom } from "@/atoms/ui";
import { ENABLE_CHZZK, ENABLE_SOOP, ENABLE_YOUTUBE } from "@/data/config";

import useChzzkChat from "@/hooks/useChzzkChat";
import useSoopChat from "@/hooks/useSoopChat";
import useYoutubeChat from "@/hooks/useYoutubeChat";

export default function DraggableChat({ channel, zone }) {
  if (!channel) return null;

  const controllerExpanded = useAtomValue(controllerExpandedAtom);
  const fitStyle = useAtomValue(fitStyleAtom);
  const chatFontSizeAdjustment = useAtomValue(chatFontSizeAdjustmentAtom);
  const pointerEventsEnabled = useAtomValue(pointerEventsEnabledAtom);

  const draggableId = `${channel.id}-chat`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: draggableId,
    });

  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const channelId = channel.id;

  const chzzkChatList = useChzzkChat(
    (ENABLE_CHZZK && channel.platform === "chzzk") ? channelId : null
  );
  const soopChatList = useSoopChat(
    (ENABLE_SOOP && channel.platform === "soop") ? channelId : null
  );
  const youtubeChatList = useYoutubeChat(
    (ENABLE_YOUTUBE && channel.platform === "youtube") ? channelId : null
  );

  const chatList =
    (ENABLE_CHZZK && channel.platform === "chzzk")
      ? chzzkChatList
      : (ENABLE_SOOP && channel.platform === "soop")
      ? soopChatList
      : (ENABLE_YOUTUBE && channel.platform === "youtube")
      ? youtubeChatList
      : [];

  const BASE_WIDTH = 360;

  const layoutKey = `${zone?.style?.width}-${zone?.style?.height}-${controllerExpanded}-${JSON.stringify(fitStyle)}`;

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
          fontSize: `${1 + chatFontSizeAdjustment * CHAT_FONT_SIZE_STEP}rem`,
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
        </Box>
      </Box>
    </Box>
  );
}
