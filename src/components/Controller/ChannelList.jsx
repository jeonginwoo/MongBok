"use client";

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
import { alpha } from "@mui/material/styles";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ChannelInfo from "@/components/Info/ChannelInfo/ChannelListChannelInfo";

import { canvas } from "@/data/canvas";
import { updatePreferences, validateChannels } from "@/utils/preferences";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import {
  channelsAtom,
  controllerExpandedAtom,
  ratioAtom,
} from "@/atoms/setting";
import { snackbarAtom } from "@/atoms/ui";

export default function ChannelList() {
  const [activeId, setActiveId] = useState(null);
  const [channels, setChannels] = useAtom(channelsAtom);
  const setSnackbar = useSetAtom(snackbarAtom);
  const controllerExpanded = useAtomValue(controllerExpandedAtom);
  const ratioKey = useAtomValue(ratioAtom);

  const [ratio, orientation] = ratioKey.split("-");
  const maxViewCount = canvas[ratio]?.[orientation]?.maxViewCount ?? 1;

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
      if (!!a._loading !== !!b._loading) {
        return a._loading ? 1 : -1;
      }
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
        if (currentVisibleCount >= maxViewCount) {
          setSnackbar({
            open: true,
            message: `표시 가능한 채널은 최대 ${maxViewCount}개입니다.`,
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
  };

  const handleDelete = async (id) => {
    setChannels((prev) => {
      const updated = structuredClone(prev);
      delete updated[id];

      const storeObj = Object.fromEntries(
        Object.entries(updated).map(([id, ch]) => [
          id,
          { platform: ch.platform, zoneId: ch.zoneId },
        ])
      );
      
      updatePreferences({ channels: storeObj });

      return updated;
    });
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
      pointerType: "mouse",
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 10,
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
                padding: controllerExpanded ? "0 2.3rem 0 0" : "0",
                overflow: "hidden",
                border: (theme) =>
                  `0.1rem solid ${
                    theme.palette.platform[activeChannel.platform].main
                  }`,
                borderRadius: "10rem",
                background: (theme) => theme.palette.background.level5,
                cursor: "grabbing",
                boxShadow: (theme) =>
                  `0 0 1rem ${
                    theme.palette.platform[activeChannel.platform].shadow
                  }`,
              }}
            >
              <ChannelInfo channel={activeChannel} isDragging={true} />
            </ListItem>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Divider sx={{ mt: 1, mb: 2, mx: 1.5, fontSize: "1.2rem", color: "text.disabled", borderColor: "border.primary", userSelect: "none" }}>
        {visible.length} / {maxViewCount}
      </Divider>

      {sortedHidden.length > 0 && (
        <>
          <Box
            sx={{
              flexGrow: 1,
              pr: 1,
              pl: 1.5,
              overflowY: "scroll",
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
        padding: controllerExpanded ? "0 2.3rem 0 0" : "0",
        overflow: "hidden",
        borderRadius: "10rem",
        backgroundColor: "background.level4",
        border: "0.1rem solid",
        borderColor: "border.tertiary",
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
        padding: controllerExpanded ? "0 2.3rem 0 0" : "0",
        overflow: "hidden",
        borderRadius: "10rem",
        mb: 1,
        backgroundColor: "background.level3",
        border: "0.1rem solid",
        borderColor: "border.quaternary",
        opacity: 1,
        cursor: "pointer",
        "&:hover": {
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.1),
          "& .delete-icon": {
            opacity: 0.5,
          },
        },
        WebkitTapHighlightColor: "transparent",
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
            right: "0.7rem",
            fontSize: 18,
            cursor: "pointer",
            color: "text.quaternary",
            opacity: 0,
            "&:hover": {
              color: "common.redHover",
              opacity: 0.5 + " !important",
            },
          }}
        />
      )}
      <ChannelInfo channel={channel} />
    </ListItem>
  );
}
