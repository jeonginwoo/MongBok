"use client";

import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import Box from "@mui/material/Box";

import ChannelInfo from "@/components/Info/ChannelInfo/ViewAreaChannelInfo";
import ChatView from "@/components/View/Chat/ChatView";

import { useAtomValue } from "jotai";
import { controllerExpandedAtom, chatFontSizeAdjustmentAtom, CHAT_FONT_SIZE_STEP } from "@/atoms/setting";
import { fitStyleAtom } from "@/atoms/ui";

import useChzzkChat from "@/hooks/useChzzkChat";
import useSoopChat from "@/hooks/useSoopChat";

export default function DraggableChat({ channel, zone }) {
  if (!channel) return null;

  const controllerExpanded = useAtomValue(controllerExpandedAtom);
  const fitStyle = useAtomValue(fitStyleAtom);
  const chatFontSizeAdjustment = useAtomValue(chatFontSizeAdjustmentAtom);

  const draggableId = `${channel.id}-chat`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: draggableId,
    });

  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const channelId = channel.id;

  const chzzkChatList = useChzzkChat(
    channel.platform === "chzzk" ? channelId : null
  );
  const soopChatList = useSoopChat(
    channel.platform === "soop" ? channelId : null
  );

  const chatList =
    channel.platform === "chzzk"
      ? chzzkChatList
      : channel.platform === "soop"
      ? soopChatList
      : [];

  const BASE_WIDTH = 360;

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
    cursor: "grab",
    transition: isDragging ? "none" : "0.5s ease",
    boxSizing: "border-box",
    overflow: "hidden",
    touchAction: "none",
    ...zone?.style,
    zIndex: isDragging ? 300 : 100,
  });

  return (
    <Box ref={setNodeRef} {...listeners} {...attributes} sx={style}>
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          zoom: zoom,
          transformOrigin: "top left",
          overflow: "hidden",
          fontSize: `${1 + chatFontSizeAdjustment * CHAT_FONT_SIZE_STEP}rem`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0,
            width: "100%",
            maxHeight: "10rem",
            aspectRatio: "100/30",
            background: (theme) => theme.palette.background.gradient,
            p: "3%",
            zIndex: 10,
          }}
        >
          <Box>
            <ChannelInfo channel={channel} />
          </Box>
        </Box>
        <ChatView chatList={chatList} />
      </Box>
    </Box>
  );
}
