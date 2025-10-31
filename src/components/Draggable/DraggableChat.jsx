import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";

export default function DraggableChat({ object, zone }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: object.id });
  
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  const BASE_WIDTH = 353;
  useEffect(() => {
    const updateZoom = () => {
      if (containerRef.current) {
        const currentWidth = containerRef.current.offsetWidth;
        const newZoom =
          currentWidth < BASE_WIDTH ? currentWidth / BASE_WIDTH : 1;
        setZoom(newZoom);
      }
    };
    updateZoom();
    window.addEventListener("resize", updateZoom);
    return () => window.removeEventListener("resize", updateZoom);
  }, []);

  const style = {
    position: "absolute",
    ...zone.style,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    background: isDragging ? "#91e3ff" : "#000",
    opacity: isDragging ? 0.6 : 1,
    border: "2px solid #555",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "grab",
    transition: isDragging ? "none" : "0.5s ease",
    boxSizing: "border-box",
    zIndex: isDragging ? 300 : 100,
  };

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          zoom: zoom,
          transformOrigin: "top left",
        }}
      >
        {(() => {
          if (object.platform === "chzzk") {
            return (
              <iframe
                src={`https://chzzk.naver.com/live/${object.id.substring(1)}/chat`}
                width="100%"
                height="100%"
                style={{
                  border: "none",
                  pointerEvents: "none",
                }}
              />
            );
          } else {
            return (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#555",
                }}
              >
                다른 타입: {object.type}
              </div>
            );
          }
        })()}
        {/* {object.label} */}
      </div>
    </div>
  );

}
