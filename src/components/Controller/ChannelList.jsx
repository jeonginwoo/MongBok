import React, { useState } from "react";
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Switch, List, ListItem, Divider, Box } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { COLORS } from "@/data/color";
import DragHandleIcon from "@mui/icons-material/DragIndicator";
import ChannelInfo from "@/components/Info/ChannelInfo/ChannelListChannelInfo";
import ChannelSnackbar from "@/components/Info/ChannelSnackbar";

import { useAtom, useSetAtom } from "jotai";
import { channelsAtom, layoutTypeAtom } from "@/atoms/setting";

export default function ChannelList() {
  const [activeId, setActiveId] = useState(null);
  const [channels, setChannels] = useAtom(channelsAtom);
  const setLayoutType = useSetAtom(layoutTypeAtom);

  const channelArray = React.useMemo(
    () =>
      Object.values(channels).sort(
        (a, b) => (a.zoneId ?? Infinity) - (b.zoneId ?? Infinity)
      ),
    [channels]
  );

  const visible = channelArray.filter((c) => c.isVisible);
  const hidden = channelArray.filter((c) => !c.isVisible);

  // ✅ hidden 목록 정렬: userCount (내림차순), name (오름차순)
  const sortedHidden = React.useMemo(() => {
    return [...hidden].sort((a, b) => {
      if ((b.userCount ?? 0) !== (a.userCount ?? 0)) {
        return (b.userCount ?? 0) - (a.userCount ?? 0);
      }
      return (a.name || "").localeCompare(b.name || "");
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

      hidden.forEach((c) => {
        updated[c.id].zoneId = null;
      });

      window.localStorage.setItem(
        "channels",
        JSON.stringify(
          Object.fromEntries(
            Object.entries(updated).map(([id, ch]) => [
              id,
              { platform: ch.platform, zoneId: ch.zoneId },
            ])
          )
        )
      );

      return updated;
    });
  };

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleToggle = (id) => {
    setChannels((prev) => {
      const updated = structuredClone(prev);
      const target = updated[id];
      
      const currentVisibleCount = Object.values(updated).filter(
        (c) => c.isVisible && c.id !== id
      ).length;

      if (!target.isVisible) {
        if (currentVisibleCount >= 4) {
          setSnackbarMessage("표시 가능한 채널은 최대 4개입니다.");
          setSnackbarOpen(true);
          return prev;
        }
        target.isVisible = true;
        target.zoneId = Infinity; 
      } else {
        target.isVisible = false;
        target.zoneId = null;
      }

      const visibleList = Object.values(updated)
        .filter((c) => c.isVisible)
        .sort((a, b) => (a.zoneId ?? Infinity) - (b.zoneId ?? Infinity));

      visibleList.forEach((c, index) => {
        updated[c.id].zoneId = index + 1;
      });

      window.localStorage.setItem(
        "channels",
        JSON.stringify(
          Object.fromEntries(
            Object.entries(updated).map(([id, ch]) => [
              id,
              { platform: ch.platform, zoneId: ch.zoneId },
            ])
          )
        )
      );

      return updated;
    });

    setLayoutType("layout1");
    window.localStorage.setItem("layout", "layout1");
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleDelete = (id) => {
    setChannels((prev) => {
      const updated = structuredClone(prev);
      delete updated[id];

      const storeObj = Object.fromEntries(
        Object.entries(updated).map(([id, ch]) => [
          id,
          { platform: ch.platform },
        ])
      );
      window.localStorage.setItem("channels", JSON.stringify(storeObj));

      return updated;
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visible.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <List sx={{ pr: 1.5 }}>
            {visible.map((channel) => (
              <SortableItem
                key={channel.id}
                channel={channel}
                onToggle={handleToggle}
              />
            ))}
          </List>
        </SortableContext>

        <DragOverlay adjustScale={false}>
          {activeChannel ? (
            <ListItem
              sx={{
                pr: 1,
                border: `1px solid ${COLORS[activeChannel.platform].main}`,
                borderRadius: "8px",
                background: "#2c2c2c",
                cursor: "grabbing",
                boxShadow: `0 0 10px ${COLORS[activeChannel.platform].shadow}`,
              }}
              secondaryAction={<Switch checked={activeChannel.isVisible} />}
            >
              <ChannelInfo channel={activeChannel} />
            </ListItem>
          ) : null}
        </DragOverlay>
      </DndContext>

      {sortedHidden.length > 0 && (
        <>
          <Divider sx={{ borderColor: "#555", my: 2, mr: 1.5 }} />
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "scroll",
              pr: 1,
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#555",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#777" },
            }}
          >
            <List disablePadding>
              {sortedHidden.map((channel) => (
                <HiddenItem
                  key={channel.id}
                  channel={channel}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </List>
          </Box>
        </>
      )}

      <ChannelSnackbar
        open={snackbarOpen}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Box>
  );
}

/** ✅ 드래그 가능한 아이템 */
function SortableItem({ channel, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: channel.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms ease",
    opacity: isDragging ? 0.3 : 1,
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
        <Switch
          checked={channel.isVisible}
          onChange={() => onToggle(channel.id)}
        />
      }
    >
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
function HiddenItem({ channel, onToggle, onDelete }) {
  return (
    <ListItem
      sx={{
        position: "relative",
        borderRadius: "8px",
        mb: "8px",
        background: "#262626",
        border: "1px solid #333",
        opacity: 1,
      }}
      secondaryAction={
        <Switch
          checked={channel.isVisible}
          onChange={() => onToggle(channel.id)}
        />
      }
    >
      <DeleteOutlineIcon
        onClick={() => onDelete(channel.id)}
        sx={{
          zIndex: 10,
          position: "absolute",
          right: "5px",
          bottom: "5px",
          fontSize: 18,
          cursor: "pointer",
          color: "#aaa",
          opacity: 0.5,
          "&:hover": { color: "#ff5555" },
        }}
      />
      <ChannelInfo channel={channel} />
    </ListItem>
  );
}
