import { useDroppable } from "@dnd-kit/core";
import { useEffect, useState } from "react";

export default function DropZone({ zone, canvasRef }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${zone.type}-${zone.id}` });
  const [fontSize, setFontSize] = useState(12);
  const zoneAlias = { 1: "①", 2: "②", 3: "③", 4: "④", };

  useEffect(() => {
    if (!canvasRef?.current) return;

    const updateFontSize = () => {
      const canvas = canvasRef.current;
      const canvasWidth = canvas.offsetWidth;
      const canvasHeight = canvas.offsetHeight;

      const zoneWidthPx = (parseFloat(zone.style.width) / 100) * canvasWidth;
      const zoneHeightPx = (parseFloat(zone.style.height) / 100) * canvasHeight;
      const minSize = Math.min(zoneWidthPx, zoneHeightPx);

      const ratio = 0.5;

      setFontSize(minSize * ratio);
    };

    updateFontSize();
    window.addEventListener("resize", updateFontSize);
    return () => window.removeEventListener("resize", updateFontSize);
  }, [canvasRef, zone]);

  return (
    <div
      ref={setNodeRef}
      className="zone"
      style={{
        ...zone.style,
        opacity: 1,
        zIndex: 200,
        background: isOver
          ? "rgba(100, 255, 134, 0.8)"
          : "rgba(255, 255, 255, 0.7)",
      }}
    >
      <div
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: "bold",
          color: "rgba(0, 0, 0, 0.15)",
          transform: "translateY(-3.8%)",
        }}
      >
        {zoneAlias[zone.id]}
      </div>
    </div>
  );
}
