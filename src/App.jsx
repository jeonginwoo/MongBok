import { useState } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin
} from "@dnd-kit/core";

export default function App() {
  const [objects, setObjects] = useState({
    v1: { id: "v1", zoneId: 1, type: "view", label: "V1" },
    v2: { id: "v2", zoneId: 2, type: "view", label: "V2" },
    v3: { id: "v3", zoneId: 3, type: "view", label: "V3" },
    v4: { id: "v4", zoneId: 4, type: "view", label: "V4" },
    c1: { id: "c1", zoneId: 1, type: "chat", label: "C1" },
    c2: { id: "c2", zoneId: 2, type: "chat", label: "C2" },
    c3: { id: "c3", zoneId: 3, type: "chat", label: "C3" },
    c4: { id: "c4", zoneId: 4, type: "chat", label: "C4" },
  });

  const zones = {
    view: {
      1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: "71.5%", height: "71.5%" } },
      2: { id: 2, type: "view", style: { top: "71.5%", left: "0%", width: "28.5%", height: "28.5%" } },
      3: { id: 3, type: "view", style: { top: "71.5%", left: "28.5%", width: "28.5%", height: "28.5%" } },
      4: { id: 4, type: "view", style: { top: "71.5%", left: "57%", width: "28.5%", height: "28.5%" } },
    },
    chat: {
      1: { id: 1, type: "chat", style: { top: "0%", left: "71.5%", width: "14%", height: "71.5%" } },
      2: { id: 2, type: "chat", style: { top: "0%", left: "85.5%", width: "14.5%", height: "34%" } },
      3: { id: 3, type: "chat", style: { top: "34%", left: "85.5%", width: "14.5%", height: "33%" } },
      4: { id: 4, type: "chat", style: { top: "67%", left: "85.5%", width: "14.5%", height: "33%" } },
    },
  };

  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [draggingType, setDraggingType] = useState(null);

  // ✅ sensors 설정
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } })
  );

  const handleDrop = (objectId, targetZoneId, targetZoneType) => {
    setObjects((prev) => {
      const dragged = prev[objectId];
      const sourceZoneId = dragged.zoneId;
      const sourceType = dragged.type;

      // 🚫 다른 타입의 zone으로는 이동 불가
      if (sourceType !== targetZoneType) return prev;

      const updated = { ...prev };

      // 🎯 같은 타입 내에서 스왑 또는 이동
      const targetObject = Object.values(prev).find(
        (obj) => obj.zoneId === targetZoneId && obj.type === sourceType
      );

      if (targetObject) {
        // ✅ 스왑
        updated[objectId] = { ...dragged, zoneId: targetZoneId };
        updated[targetObject.id] = { ...targetObject, zoneId: sourceZoneId };
      } else {
        // ✅ 단순 이동
        updated[objectId] = { ...dragged, zoneId: targetZoneId };
      }

      // 🧩 같은 zoneId의 다른 타입 object도 함께 스왑/이동
      const pairedType = sourceType === "view" ? "chat" : "view";

      const sourcePair = Object.values(prev).find(
        (obj) => obj.zoneId === sourceZoneId && obj.type === pairedType
      );
      const targetPair = Object.values(prev).find(
        (obj) => obj.zoneId === targetZoneId && obj.type === pairedType
      );

      if (sourcePair && targetPair) {
        // 두 타입 다 존재하면 스왑
        updated[sourcePair.id] = { ...sourcePair, zoneId: targetZoneId };
        updated[targetPair.id] = { ...targetPair, zoneId: sourceZoneId };
      } else if (sourcePair) {
        // 대상 zone에 다른 타입이 없으면 그냥 이동
        updated[sourcePair.id] = { ...sourcePair, zoneId: targetZoneId };
      }

      return updated;
    });
  };

  return (
    <div className="container">
      <DndContext
        sensors={sensors} // ✅ pointer sensor 적용
        collisionDetection={pointerWithin} // ✅ 마우스 포인터 기준
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
        <div className="canvas">
          {/* ✅ 드래그 중일 때만, 같은 타입의 zone만 표시 */}
          {isDraggingAny &&
            draggingType &&
            Object.values(zones[draggingType]).map((zone) => (
              <DropZone key={`${zone.type}-${zone.id}`} zone={zone} />
            ))}

          {/* ✅ object 렌더링 */}
          {Object.values(objects).map((obj) => (
            <DraggableItem
              key={obj.id}
              object={obj}
              zone={zones[obj.type][obj.zoneId]}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function DropZone({ zone }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${zone.type}-${zone.id}` });

  return (
    <div
      ref={setNodeRef}
      className="zone"
      style={{
        ...zone.style,
        opacity: 1,
        zIndex: 2,
        background: isOver
          ? "rgba(100, 150, 255, 0.5)"
          : "rgba(255, 255, 255, 0.3)",
      }}
    >
      {zone.type} {zone.id}
    </div>
  );
}

function DraggableItem({ object, zone }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: object.id });

  const style = {
    position: "absolute",
    ...zone.style,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    background: isDragging ? "#91e3ff" : "#f2f2f2",
    opacity: isDragging ? 0.6 : 1,
    border: "2px solid #555",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "grab",
    transition: isDragging ? "none" : "0.2s ease",
    boxSizing: "border-box",
    zIndex: isDragging ? 3 : 1,
  };

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      {object.label}
    </div>
  );
}
