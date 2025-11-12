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
  Divider,
  Box,
} from "@mui/material";
import { COLORS } from "@/data/color";
import DragHandleIcon from "@mui/icons-material/DragIndicator";
import ChannelInfo from "@/components/Info/ChannelInfo";

export default function ChannelList({ channels, setChannels, setLayoutType }) {
  const [activeId, setActiveId] = React.useState(null);

  const channelArray = React.useMemo(
    () => Object.values(channels).sort((a, b) => a.zoneId - b.zoneId),
    [channels]
  );

  const visible = channelArray.filter((c) => c.isVisible);
  const hidden = channelArray.filter((c) => !c.isVisible);

  // ✅ hidden 목록 정렬: userCount (내림차순), name (오름차순)
  const sortedHidden = React.useMemo(() => {
    return [...hidden].sort((a, b) => {
      if ((b.userCount ?? 0) !== (a.userCount ?? 0)) {
        return (b.userCount ?? 0) - (a.userCount ?? 0); // userCount 기준 내림차순
      }
      return (a.name || "").localeCompare(b.name || ""); // 이름 기준 오름차순
    });
  }, [hidden]);

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
      const updated = structuredClone(prev);

      // ✅ visible zoneId 재배열
      reordered.forEach((c, i) => {
        const zoneId = i + 1;
        updated[c.id].zoneId = zoneId;
      });

      // ✅ hidden은 zoneId를 'none'으로 지정
      hidden.forEach((c) => {
        updated[c.id].zoneId = null;
      });

      return { ...updated };
    });
  };

  const handleToggle = (id) => {

    setChannels((prev) => {
      const updated = structuredClone(prev);
      const target = { ...updated[id] };
      const visibleList = Object.values(updated).filter((c) => c.isVisible);

      if (!target.isVisible) {
        if (visibleList.length >= 4) {
          alert("표시 가능한 채널은 최대 4개입니다.");
          return prev;
        }
        target.isVisible = true;
      } else {
        target.isVisible = false;
      }

      updated[id] = target;

      // ✅ zoneId 재정렬
      const sorted = Object.values(updated).sort((a, b) => {
        const getValue = (v) => (v.zoneId === null ? Infinity : v.zoneId);
        return getValue(a) - getValue(b);
      });

      let visibleCount = 0;
      sorted.forEach((c) => {
        if (c.isVisible) {
          visibleCount += 1;
          updated[c.id] = {
            ...updated[c.id],
            zoneId: visibleCount,
          };
        } else {
          updated[c.id] = {
            ...updated[c.id],
            zoneId: null,
          };
        }
      });

      return updated;
    });

    setLayoutType("layout1");
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

      {/* 🔹 hidden 목록 (정렬) */}
      {sortedHidden.length > 0 && (
        <>
          <Box sx={{ my: 2, textAlign: "center" }}>
            <Divider sx={{ borderColor: "#555" }} />
          </Box>
          <List>
            {sortedHidden.map((channel) => (
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
              border: `1px solid ${COLORS[activeChannel.platform].main}`,
              borderRadius: "8px",
              background: "#2c2c2c",
              cursor: "grabbing",
              boxShadow: `0 0 10px ${COLORS[activeChannel.platform].shadow}`,
            }}
            secondaryAction={<Switch checked={activeChannel.isVisible} disabled />}
          >
            <ChannelInfo channel={activeChannel} />
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
            outline: null,
            border: null,
            "&:focus": { outline: null, border: null },
            "&:active": { cursor: "grabbing" },
          }}
        />
      </Box>
      <ChannelInfo channel={channel} />
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
      <ChannelInfo channel={channel} />
    </ListItem>
  );
}
