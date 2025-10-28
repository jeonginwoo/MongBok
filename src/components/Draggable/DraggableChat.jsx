import { useDraggable } from "@dnd-kit/core";

export default function DraggableChat({ object, zone }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: object.id });

  const style = {
    position: "absolute",
    ...zone.style,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    background: isDragging ? "#91e3ff" : "#ffffffff",
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
