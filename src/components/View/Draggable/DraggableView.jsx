import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import Box from "@mui/material/Box";

import { useAtomValue } from "jotai";
import { controllerExpandedAtom } from "@/atoms/setting";

export default function DraggableView({ channel, zone, pointerEventsEnabled }) {
  if (!channel) return null;

  const controllerExpanded = useAtomValue(controllerExpandedAtom);

  const draggableId = `${channel.id}-view`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: draggableId,
    });

  const baseZIndex = zone?.style.zIndex || 0;
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const channelId = channel.id;

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
    zIndex: isDragging ? 310 : 110 + baseZIndex,
    touchAction: "none",
  };

  const iframeSrc =
    channel.platform === "chzzk"
      ? `https://chzzk.naver.com/live/${channelId}`
      : channel.platform === "soop"
      ? `https://play.sooplive.co.kr/${channelId}/embed`
      : "";

  return (
    <Box ref={setNodeRef} {...listeners} {...attributes} sx={style}>
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: "100%",
          zoom: zoom,
          transformOrigin: "top left",
        }}
      >
        <Box
          component="iframe"
          key={channel?.isLive ? "live" : "offline"} 
          src={iframeSrc}
          sx={{
            width: "100%",
            height: "100%",
            border: "none",
            pointerEvents: pointerEventsEnabled ? "auto" : "none",
          }}
        />
      </Box>
    </Box>
  );
}