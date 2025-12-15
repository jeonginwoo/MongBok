import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import Box from "@mui/material/Box";

import ChannelInfo from "@/components/Info/ChannelInfo/ViewAreaChannelInfo";

import { useAtomValue } from "jotai";
import { controllerExpandedAtom } from "@/atoms/setting";

export default function DraggableChat({ channel, zone }) {
  if (!channel) return null;

  const controllerExpanded = useAtomValue(controllerExpandedAtom);

  const draggableId = `${channel.id}-chat`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: draggableId,
    });

  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const channelId = channel.id;

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
    
  }, [zone?.style.width, controllerExpanded]);

  const style = {
    position: "absolute",
    ...zone?.style,
    transform: transform
      ? `translate3d(${transform.x/10}rem, ${transform.y/10}rem, 0)`
      : undefined,
    background: isDragging ? "#91e3ff" : "#000",
    opacity: isDragging ? 0.6 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "grab",
    transition: isDragging ? "none" : "0.5s ease",
    boxSizing: "border-box",
    zIndex: isDragging ? 300 : 100,
    overflow: "hidden",
    touchAction: "none",
  };

  let iframeSrc = "";
  let iframeStyle = {};

  if (channel.platform === "chzzk") {
    iframeSrc = `https://chzzk.naver.com/live/${channelId}/chat`;
    iframeStyle = {
      width: "100%",
      height: "calc(100% + 45.0rem)",
      top: "-34.5rem",
    };
  } else if (channel.platform === "soop") {
    iframeSrc = `https://chazzy.vercel.app/--${channelId}-`;
    iframeStyle = {
      width: "calc(100% + 11.0rem)",
      height: "calc(100% + .0rem)",
      left: "-6.0rem",
    };
  }

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
        }}
      >
        <Box
          component="iframe"
          src={iframeSrc}
          sx={{
            position: "absolute",
            top: ".0rem",
            left: ".0rem",
            border: "none",
            pointerEvents: "none",
            overflow: "hidden",
            ...iframeStyle,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: 0,
            width: "100%",
            maxHeight: "10rem",
            aspectRatio: "100/30",
            background: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,0.9) 0%,
                rgba(0,0,0,0.7) 40%,
                rgba(0,0,0,0.3) 70%,
                rgba(0,0,0,0) 100%
              )
            `,
            p: "3%",
          }}
        >
          <Box>
            <ChannelInfo channel={channel} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
