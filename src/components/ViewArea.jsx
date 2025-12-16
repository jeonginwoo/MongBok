import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";

import ChannelRenderer from "@/components/View/ChannelRenderer";
import DropZone from "@/components/View/DropZone";
import CurrentTime from "@/components/Info/CurrentTime";

import { useAtom, useAtomValue } from "jotai";
import {
  channelsAtom,
  layoutAtom,
  ratioAtom,
  pointerEventsEnabledAtom,
  showCurrentTimeAtom,
} from "@/atoms/setting";
import { fitStyleAtom } from "@/atoms/ui";

export default function ViewArea({ canvasRef, fullscreen }) {
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [draggingType, setDraggingType] = useState(null);
  const [fitStyle, setFitStyle] = useAtom(fitStyleAtom);
  const [channels, setChannels] = useAtom(channelsAtom);
  const layout = useAtomValue(layoutAtom);
  const ratio = useAtomValue(ratioAtom);
  const pointerEventsEnabled = useAtomValue(pointerEventsEnabledAtom);
  const showCurrentTime = useAtomValue(showCurrentTimeAtom);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    const element = canvasRef?.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        
        if (width === 0 || height === 0) return;
        if (width * 9 >= height * 16) {
          setFitStyle({ height: "100%" }); 
        } else {
          setFitStyle({ width: "100%" });
        }
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [canvasRef]);

  const handleDrop = (baseId, targetZoneId) => {
    setChannels((prev) => {
      const updated = structuredClone(prev);
      if (!updated[baseId]) return prev;

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
        overflow: "hidden",
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
            aspectRatio: `${ratio}`,
            backgroundColor: "#000",
            overflow: "hidden",
            ...fitStyle,
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
