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
import { layouts } from "./data/layouts";

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

  const viewCount = 4;
  const layoutType = "layout1";
  const layout = layouts[viewCount][layoutType];

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
        <div className="canvas">
          {isDraggingAny &&
            draggingType &&
            layout[draggingType] &&
            Object.values(layout[draggingType]).map((zone) => (
              <DropZone key={`${zone.type}-${zone.id}`} zone={zone} />
            ))}

          {Object.values(objects).map((obj) => 
            layout[obj.type]?.[obj.zoneId] ? (
              <DraggableItem
                key={obj.id}
                object={obj}
                zone={layout[obj.type][obj.zoneId]}
              />
            ) : null
          )}
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
