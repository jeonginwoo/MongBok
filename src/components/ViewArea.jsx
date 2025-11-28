import React, { useState } from "react";
import { Box } from "@mui/material";
import {
  DndContext,
  MouseSensor, // 추가
  TouchSensor, // 추가
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
  pointerEventsEnabledAtom,
  showCurrentTimeAtom,
} from "@/atoms/setting";

export default function ViewArea({ canvasRef, fullscreen }) {
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [draggingType, setDraggingType] = useState(null);
  const [channels, setChannels] = useAtom(channelsAtom);
  const layout = useAtomValue(layoutAtom);
  const pointerEventsEnabled = useAtomValue(pointerEventsEnabledAtom);
  const showCurrentTime = useAtomValue(showCurrentTimeAtom);

  // 🔹 센서 설정 변경 (핵심 수정 부분)
  const sensors = useSensors(
    // 데스크탑: 10픽셀 움직이면 드래그 시작
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    // 모바일: 250ms 동안 꾹 누르면 드래그 시작 (스크롤 오동작 방지)
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5, // 5px 정도의 떨림은 허용
      },
    })
  );

  /** 🔄 Drop handler */
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
            maxWidth: "100%",
            maxHeight: "100%",
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
