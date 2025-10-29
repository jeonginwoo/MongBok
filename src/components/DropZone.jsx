import { useDroppable } from "@dnd-kit/core";

export default function DropZone({ zone }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${zone.type}-${zone.id}` });

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
      {zone.type} {zone.id}
    </div>
  );
}
