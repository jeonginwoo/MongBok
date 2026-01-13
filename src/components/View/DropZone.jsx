"use client";

import { useDroppable } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { Box } from "@mui/material";

export default function DropZone({ zone, canvasRef }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${zone.type}-${zone.id}`,
  });
  const [fontSize, setFontSize] = useState(1.2);
  const zoneAlias = { 1: "①", 2: "②", 3: "③", 4: "④", 5: "⑤" };

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

      setFontSize(minSize * ratio / 10);
    };

    updateFontSize();
    window.addEventListener("resize", updateFontSize);
    return () => window.removeEventListener("resize", updateFontSize);
  }, [canvasRef, zone]);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        ...zone.style,
        position: "absolute",
        border: (theme) => `0.2rem dashed ${theme.palette.common.dropZone.border}`,
        borderRadius: "0.8rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "0.2s",
        pointerEvents: "none",
        backdropFilter: "blur(0.4rem)",
        zIndex: 200,
        opacity: 1,
        bgcolor: (theme) => isOver ? theme.palette.common.dropZone.backgroundOver : theme.palette.common.dropZone.background,
      }}
    >
      <Box
        sx={{
          fontSize: `${fontSize}rem`,
          fontWeight: "bold",
          color: "common.dropZone.text",
          transform: "translateY(-3.8%)",
        }}
      >
        {zoneAlias[zone.id]}
      </Box>
    </Box>
  );
}
