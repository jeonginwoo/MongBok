import React, { useState } from "react";
import { Box } from "@mui/material";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";

import ChannelRenderer from "@/components/View/ChannelRenderer";
import DropZone from "@/components/View/DropZone";
import CurrentTime from "@/components/Info/CurrentTime";

export default function ViewArea({
  channels,
  setChannels,
  layout,
  canvasRef,
  pointerEventsEnabled,
  fullscreen,
  showCurrentTime, 
}) {
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [draggingType, setDraggingType] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } })
  );

  /** 🔄 Drop handler */
  const handleDrop = (baseId, targetZoneId) => {
    setChannels((prev) => {
      const updated = structuredClone(prev);
      const dragged = updated[baseId];
      const sourceZoneId = dragged.zoneId;

      const targetEntry = Object.values(updated).find(
        (obj) => obj.zoneId === targetZoneId
      );

      if (targetEntry) {
        updated[baseId].zoneId = targetZoneId;
        targetEntry.zoneId = sourceZoneId;
      } else {
        updated[baseId].zoneId = targetZoneId;
      }

      return updated;
    });
  };

  return (
    <Box
      ref={canvasRef}
      sx={{
        flex: "1 1 auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1b1b1bff",
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={({ active }) => {
          setIsDraggingAny(true);
          const [baseId, type] = active.id.split("-");
          setDraggingType(type);
        }}
        onDragEnd={({ active, over }) => {
          setIsDraggingAny(false);
          setDraggingType(null);
          if (!over) return;
          const [zoneType, zoneId] = over.id.split("-");
          const [baseId] = active.id.split("-");
          handleDrop(baseId, Number(zoneId));
        }}
      >
        <Box
          className="canvas"
          sx={{
            position: "relative",
            aspectRatio: "16/9",
            width: "100%",
            backgroundColor: "#000",
            overflow: "hidden",
          }}
        >
          {/* DropZone */}
          {isDraggingAny &&
            draggingType &&
            layout[draggingType] &&
            Object.values(layout[draggingType]).map((zone) => (
              <DropZone
                key={`${zone.type}-${zone.id}`}
                zone={zone}
                canvasRef={canvasRef}
              />
            ))}

          {/* 채널 렌더링 */}
          {Object.values(channels)
            .filter((c) => c.isVisible)
            .map((channel) => (
              <ChannelRenderer
                key={channel.id}
                channel={channel}
                layout={layout}
                pointerEventsEnabled={pointerEventsEnabled}
              />
            ))}

          {showCurrentTime && <CurrentTime onClick={fullscreen} />}
        </Box>
      </DndContext>
    </Box>
  );
}
