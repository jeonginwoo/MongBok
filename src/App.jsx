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
    V34ea2a834c0022212290c26ac5e170a1: { id: "V34ea2a834c0022212290c26ac5e170a1", zoneId: 1, type: "view", platform: "chzzk", label: "V1" },
    Vb3e262a2795f17734c149afc738ad250: { id: "Vb3e262a2795f17734c149afc738ad250", zoneId: 2, type: "view", platform: "chzzk", label: "V2" },
    Vb2854dc0735e55fa86c53bd15242d30f: { id: "Vb2854dc0735e55fa86c53bd15242d30f", zoneId: 3, type: "view", platform: "chzzk", label: "V3" },
    V6086f17b054010b0657af00aff6e6d05: { id: "V6086f17b054010b0657af00aff6e6d05", zoneId: 4, type: "view", platform: "chzzk", label: "V4" },
    C34ea2a834c0022212290c26ac5e170a1: { id: "C34ea2a834c0022212290c26ac5e170a1", zoneId: 1, type: "chat", platform: "chzzk", label: "C1" },
    Cb3e262a2795f17734c149afc738ad250: { id: "Cb3e262a2795f17734c149afc738ad250", zoneId: 2, type: "chat", platform: "chzzk", label: "C2" },
    Cb2854dc0735e55fa86c53bd15242d30f: { id: "Cb2854dc0735e55fa86c53bd15242d30f", zoneId: 3, type: "chat", platform: "chzzk", label: "C3" },
    C6086f17b054010b0657af00aff6e6d05: { id: "C6086f17b054010b0657af00aff6e6d05", zoneId: 4, type: "chat", platform: "chzzk", label: "C4" },
  });

  const viewCount = 4;  // TODO: 목록에서 공개된 수
  const layoutType = "layout1";
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

  const fullscreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.requestFullscreen();
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
        <div className="canvas" ref={canvasRef} overflow="hidden">
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
      <div
        style={{
          marginTop: "5px",
          textAlign: "right",
        }}
      >
        <button
          onClick={fullscreen}
          style={{
            zIndex: 1000,
            background: "rgba(0,0,0,0.6)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          전체화면
        </button>
      </div>
    </div>
  );
}