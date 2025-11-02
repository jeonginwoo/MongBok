import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";

export default function DraggableChat({ object, zone }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: object.id });

  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);

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
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          zoom: zoom,
          transformOrigin: "top left",
          overflow: "hidden",
        }}
      >
        <iframe
          src={`https://chzzk.naver.com/live/${object.id.substring(1)}/chat`}
          style={{
            position: "absolute",
            top: "-125px",
            left: "0px",
            width: "100%",
            height: "calc(100% + 230px)",
            border: "none",
            pointerEvents: "none",
            overflow: "hidden",
          }}
        />
      </div>
    </div>
  );
}
