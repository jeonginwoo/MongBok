import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { List, ListItem, Divider, Box } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { COLORS } from "@/data/color";
import ChannelInfo from "@/components/Info/ChannelInfo/ChannelListChannelInfo";

import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { channelsAtom, layoutTypeAtom, controllerExpandedAtom } from "@/atoms/setting";
import { snackbarAtom } from "@/atoms/snackbar";

export default function ChannelList() {
  const [activeId, setActiveId] = useState(null);
  const [channels, setChannels] = useAtom(channelsAtom);
  const setLayoutType = useSetAtom(layoutTypeAtom);
  const setSnackbar = useSetAtom(snackbarAtom);
  const controllerExpanded = useAtomValue(controllerExpandedAtom);

  const channelArray = React.useMemo(
    () =>
      Object.values(channels).sort(
        (a, b) => (a.zoneId ?? Infinity) - (b.zoneId ?? Infinity)
      ),
    [channels]
  );

  const visible = channelArray.filter((c) => c.isVisible);
  const hidden = channelArray.filter((c) => !c.isVisible);

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

  const handleToggle = (id) => {
    setChannels((prev) => {
      const updated = structuredClone(prev);
      const target = updated[id];
      
      const currentVisibleCount = Object.values(updated).filter(
        (c) => c.isVisible && c.id !== id
      ).length;

      if (!target.isVisible) {
        if (currentVisibleCount >= 4) {
          setSnackbar({
            open: true,
            message: "표시 가능한 채널은 최대 4개입니다.",
            severity: "warning",
          });
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

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );
  
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visible.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <List sx={{ pr: 1.5, pl: 1.5, pt: 0, pb: 0 }}>
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
                padding: controllerExpanded ? "0 23px 0 0" : "0",
                overflow: "hidden",
                border: `1px solid ${COLORS[activeChannel.platform].main}`,
                borderRadius: "100px",
                background: "#2c2c2c",
                cursor: "grabbing",
                boxShadow: `0 0 10px ${COLORS[activeChannel.platform].shadow}`,
              }}
            >
              <ChannelInfo channel={activeChannel} isDragging={true} />
            </ListItem>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Divider sx={{ borderColor: "#555", mt: 1, mr: 1.5, ml: 1.5, mb: 2 }} />

      {sortedHidden.length > 0 && (
        <>
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "scroll",
              pr: 1,
              pl: 1.5,
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
    </Box>
  );
}

function SortableItem({ channel, onToggle }) {
  const controllerExpanded = useAtomValue(controllerExpandedAtom);
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
      {...listeners}
      {...attributes}
      onClick={() => onToggle(channel.id)}
      sx={{
        position: "relative",
        mb: 1,
        padding: controllerExpanded ? "0 23px 0 0" : "0",
        overflow: "hidden",
        borderRadius: "100px",
        background: "#2f2f2f",
        border: "1px solid #444",
        transition: "all 0.2s ease",
        cursor: "grab",
        "&:hover .drag-handle-area": {
          opacity: 1,
          transform: "translateX(0)",
        },
      }}
    >
      <ChannelInfo channel={channel} />
    </ListItem>
  );
}

function HiddenItem({ channel, onToggle, onDelete }) {
  const controllerExpanded = useAtomValue(controllerExpandedAtom);

  return (
    <ListItem
      onClick={() => onToggle(channel.id)}
      sx={{
        position: "relative",
        padding: controllerExpanded ? "0 23px 0 0" : "0",
        overflow: "hidden",
        borderRadius: "100px",
        mb: 1,
        background: "#262626",
        border: "1px solid #333",
        opacity: 1,
        cursor: "pointer",
        "&:hover": {
          borderColor: "#666",
          "& .delete-icon": {
            opacity: 0.5,
          },
        },
      }}
    >
      {controllerExpanded && (
        <DeleteOutlineIcon
          className="delete-icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(channel.id);
          }}
          sx={{
            zIndex: 10,
            position: "absolute",
            right: "10px",
            fontSize: 18,
            cursor: "pointer",
            color: "#aaa",
            opacity: 0, 
            "&:hover": { 
                color: "#ff5555",
                opacity: 0.5 + " !important"
            },
          }}
        />
      )}
      <ChannelInfo channel={channel} />
    </ListItem>
  );
}
