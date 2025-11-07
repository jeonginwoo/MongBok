import React from "react";
import {
  DndContext,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Switch,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
} from "@mui/material";
import DragHandleIcon from "@mui/icons-material/DragIndicator";

export default function ChannelList({ channels, setChannels }) {
  const [activeId, setActiveId] = React.useState(null);

  const channelArray = React.useMemo(
    () => Object.values(channels).sort((a, b) => a.view.zoneId - b.view.zoneId),
    [channels]
  );

  const visible = channelArray.filter((c) => c.isVisible);
  const hidden = channelArray.filter((c) => !c.isVisible);

  const activeChannel = activeId
    ? channelArray.find((c) => c.id === activeId)
    : null;

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = visible.findIndex((c) => c.id === active.id);
    const newIndex = visible.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(visible, oldIndex, newIndex);

    setChannels((prev) => {
      const updated = { ...prev };

      // ✅ visible zoneId 재배열
      reordered.forEach((c, i) => {
        const zoneId = i + 1;
        updated[c.id].view.zoneId = zoneId;
        updated[c.id].chat.zoneId = zoneId;
      });

      // ✅ hidden은 zoneId를 'none'으로 지정
      hidden.forEach((c) => {
        updated[c.id].view.zoneId = "none";
        updated[c.id].chat.zoneId = "none";
      });

      return { ...updated };
    });
  };

  const handleToggle = (id) => {
    console.log(`[handleToggle] click received for id=${id} at ${new Date().toISOString()}`);

    setChannels((prev) => {
      const updated = { ...prev };
      const target = { ...updated[id] };
      const visibleList = Object.values(updated).filter((c) => c.isVisible);

      if (!target.isVisible) {
        if (visibleList.length >= 4) {
          alert("표시 가능한 채널은 최대 4개입니다.");
          return prev;
        }
        target.isVisible = true;
        console.log(`[handleToggle] toggling ON id=${id}`);
      } else {
        target.isVisible = false;
        console.log(`[handleToggle] toggling OFF id=${id}`);
      }

      updated[id] = target;

      // ✅ zoneId 재정렬
      const sorted = Object.values(updated).sort((a, b) => {
        const getValue = (v) => (v.view.zoneId === "none" ? Infinity : v.view.zoneId);
        return getValue(a) - getValue(b);
      });

      let visibleCount = 0;
      sorted.forEach((c) => {
        if (c.isVisible) {
          visibleCount += 1;
          updated[c.id] = {
            ...updated[c.id],
            view: { ...updated[c.id].view, zoneId: visibleCount },
            chat: { ...updated[c.id].chat, zoneId: visibleCount },
          };
        } else {
          updated[c.id] = {
            ...updated[c.id],
            view: { ...updated[c.id].view, zoneId: "none" },
            chat: { ...updated[c.id].chat, zoneId: "none" },
          };
        }
      });

      console.log("[handleToggle] result:", JSON.parse(JSON.stringify(updated)));
      return updated;
    });
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragEnd={handleDragEnd}
    >
      {/* ✅ visible만 드래그 가능 */}
      <SortableContext
        items={visible.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <List>
          {visible.map((channel) => (
            <SortableItem
              key={channel.id}
              channel={channel}
              onToggle={handleToggle}
            />
          ))}
        </List>
      </SortableContext>

      {/* 🔹 hidden 목록 */}
      {hidden.length > 0 && (
        <>
          <Box sx={{ my: 2, textAlign: "center" }}>
            <Divider sx={{ borderColor: "#555" }} />
          </Box>
          <List>
            {hidden.map((channel) => (
              <HiddenItem
                key={channel.id}
                channel={channel}
                onToggle={handleToggle}
              />
            ))}
          </List>
        </>
      )}

      {/* ✅ 드래그 중 표시 */}
      <DragOverlay adjustScale={false}>
        {activeChannel ? (
          <ListItem
            sx={{
              border: "1px solid #00bfff",
              borderRadius: "8px",
              background: "#2c2c2c",
              cursor: "grabbing",
              boxShadow: "0 0 10px rgba(0,191,255,0.4)",
            }}
            secondaryAction={<Switch checked={activeChannel.isVisible} disabled />}
          >
            <ListItemText
              primary={`View: ${activeChannel.view.label}`}
              secondary={`Chat: ${activeChannel.chat.label}`}
            />
          </ListItem>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/** ✅ 드래그 가능한 아이템 */
function SortableItem({ channel, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: channel.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        position: "relative",
        borderRadius: "8px",
        mb: "8px",
        background: "#2f2f2f",
        border: "1px solid #444",
        transition: "all 0.2s ease",
        "&:hover .drag-handle-area": {
          opacity: 1,
          transform: "translateX(0)",
        },
      }}
      secondaryAction={
        <Switch checked={channel.isVisible} onChange={() => onToggle(channel.id)} />
      }
    >
      {/* ✅ 핸들 영역 */}
      <Box
        className="drag-handle-area"
        sx={{
          position: "absolute",
          left: "-30px",
          top: 0,
          height: "100%",
          width: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0,
          transition: "all 0.2s ease",
          "&:active": { cursor: "grabbing" },
          "&:hover": { color: "#00bfff" },
        }}
      >
        <DragHandleIcon
          {...listeners}
          {...attributes}
          sx={{
            fontSize: 18,
            color: "#aaa",
            cursor: "grab",
            outline: "none",
            border: "none",
            "&:focus": { outline: "none", border: "none" },
            "&:active": { cursor: "grabbing" },
          }}
        />
      </Box>

      <ListItemText
        primary={`View: ${channel.view.label}`}
        secondary={`Chat: ${channel.chat.label}`}
        secondaryTypographyProps={{ color: "#888" }}
      />
    </ListItem>
  );
}

/** ❌ 드래그 불가한 숨김 아이템 */
function HiddenItem({ channel, onToggle }) {
  return (
    <ListItem
      sx={{
        borderRadius: "8px",
        mb: "8px",
        background: "#262626",
        border: "1px solid #333",
        opacity: 1,
      }}
      secondaryAction={
        <Switch checked={channel.isVisible} onChange={() => onToggle(channel.id)} />
      }
    >
      <ListItemText
        primary={`View: ${channel.view.label}`}
        secondary={`Chat: ${channel.chat.label}`}
        secondaryTypographyProps={{ color: "#888" }}
      />
    </ListItem>
  );
}
