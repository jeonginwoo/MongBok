import { useState, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin
} from "@dnd-kit/core";

import { layouts } from "./data/layouts";
import DraggableView from "./components/Draggable/DraggableView";
import DraggableChat from "./components/Draggable/DraggableChat";
import DropZone from "./components/DropZone";

export default function App() {
  const [objects, setObjects] = useState({
    // TODO: Localstroage에서 가져오기
    v1: { id: "v1", zoneId: 1, type: "view", label: "V1" },
    v2: { id: "v2", zoneId: 2, type: "view", label: "V2" },
    v3: { id: "v3", zoneId: 3, type: "view", label: "V3" },
    v4: { id: "v4", zoneId: 4, type: "view", label: "V4" },
    c1: { id: "c1", zoneId: 1, type: "chat", label: "C1" },
    c2: { id: "c2", zoneId: 2, type: "chat", label: "C2" },
    c3: { id: "c3", zoneId: 3, type: "chat", label: "C3" },
    c4: { id: "c4", zoneId: 4, type: "chat", label: "C4" },
  });

  const viewCount = 4;  // TODO: 목록에서 공개된 수
  const layoutType = "layout3";
  const layout = layouts[viewCount][layoutType];

  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [draggingType, setDraggingType] = useState(null);

  const canvasRef = useRef(null);

  // ✅ sensors 설정
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } })
  );

  const handleDrop = (objectId, targetZoneId, targetZoneType) => {
    setObjects((prev) => {
      const dragged = prev[objectId];
      const sourceZoneId = dragged.zoneId;
      const sourceType = dragged.type;

      if (sourceType !== targetZoneType) return prev;

      const updated = { ...prev };

      const targetObject = Object.values(prev).find(
        (obj) => obj.zoneId === targetZoneId && obj.type === sourceType
      );

      if (targetObject) { // 스왑
        updated[objectId] = { ...dragged, zoneId: targetZoneId };
        updated[targetObject.id] = { ...targetObject, zoneId: sourceZoneId };
      } else {
        updated[objectId] = { ...dragged, zoneId: targetZoneId };
      }

      const pairedType = sourceType === "view" ? "chat" : "view";

      const sourcePair = Object.values(prev).find(
        (obj) => obj.zoneId === sourceZoneId && obj.type === pairedType
      );
      const targetPair = Object.values(prev).find(
        (obj) => obj.zoneId === targetZoneId && obj.type === pairedType
      );

      if (sourcePair && targetPair) { // 페어 스왑
        updated[sourcePair.id] = { ...sourcePair, zoneId: targetZoneId };
        updated[targetPair.id] = { ...targetPair, zoneId: sourceZoneId };
      } else if (sourcePair) {
        updated[sourcePair.id] = { ...sourcePair, zoneId: targetZoneId };
      }

      return updated;
    });
  };

  return (
    <div className="container">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={({ active }) => {
          setIsDraggingAny(true);
          const obj = objects[active.id];
          if (obj) setDraggingType(obj.type);
        }}
        onDragEnd={({ active, over }) => {
          setIsDraggingAny(false);
          setDraggingType(null);
          if (!over) return;
          const [zoneType, zoneId] = over.id.split("-");
          handleDrop(active.id, Number(zoneId), zoneType);
        }}
      >
        <div className="canvas" ref={canvasRef}>
          {isDraggingAny &&
            draggingType &&
            layout[draggingType] &&
            Object.values(layout[draggingType]).map((zone) => (
              <DropZone key={`${zone.type}-${zone.id}`} zone={zone} canvasRef={canvasRef} />
            ))}

          {Object.values(objects).map((obj) => {
            if (!layout[obj.type]?.[obj.zoneId]) return null;
            return obj.type === "view" ? (
              <DraggableView key={obj.id} object={obj} zone={layout[obj.type][obj.zoneId]} />
            ) : (
              <DraggableChat key={obj.id} object={obj} zone={layout[obj.type][obj.zoneId]} />
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}