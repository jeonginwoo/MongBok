import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { getChzzkLiveDetail } from "@/api/chzzkApi";
import Box from "@mui/material/Box";

import LiveTime from "@/components/Info/LiveTime";
import UserCount from "@/components/Info/UserCount";

export default function DraggableChat({ object, zone }) {
  if (!object) return null;

  const draggableId = `${object.id}-${object.type}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
  });

  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const channelId = object.id;
  
  const [liveDetail, setLiveDetail] = useState(null);
  useEffect(() => {
    const fetchLiveDetail = async () => {
      try {
        const data = await getChzzkLiveDetail(channelId);
        setLiveDetail(data);
      } catch (error) {
        console.error("❌ 라이브 정보 가져오기 실패:", error);
      }
    };

    fetchLiveDetail();
  }, []);

  const BASE_WIDTH = 360;
  useEffect(() => {
    const updateZoom = () => {
      if (!containerRef.current) return;

      const canvas = containerRef.current.closest(".canvas");
      if (!canvas) return;

      const canvasWidth = canvas.clientWidth;

      const widthStr = zone.style.width;
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
    window.addEventListener("resize", updateZoom);
    return () => window.removeEventListener("resize", updateZoom);
  }, [zone.style.width]);

  const style = {
    position: "absolute",
    ...zone.style,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
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
  };

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={style}
    >
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
          src={`https://chzzk.naver.com/live/${channelId}/chat`}
          sx={{
            position: "absolute",
            top: "-145px",
            left: "0px",
            width: "100%",
            height: "calc(100% + 250px)",
            border: "none",
            pointerEvents: "none",
            overflow: "hidden",
          }}
        />
        <Box
          sx={{
            display: "flex",
            gap: "2.5%",
            padding: "3%",
            position: "absolute",
            left: "0px",
            width: "100%",
            maxHeight: "130px",
            aspectRatio: "100/40",
            border: "none",
            background: `
              linear-gradient(
                to bottom,
                rgba(0,0,0,0.9) 0%,
                rgba(0,0,0,0.7) 40%,
                rgba(0,0,0,0.2) 60%,
                rgba(0,0,0,0) 100%
              )
            `,
          }}
        >
          {/* Channel Image */}
          <Box
            sx={{
              height: "40%",
              aspectRatio: "1/1",
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img
              src={liveDetail?.content.channel.channelImageUrl}
              alt="profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>
          
          {/* Channel Info */}
          <Box>
            <Box
              sx={{
                color: "white",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {liveDetail?.content.liveTitle}
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 1,
              }}
            >
              <LiveTime status={liveDetail?.content.status} openDate={liveDetail?.content.openDate} />
              <UserCount channelId={channelId} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
