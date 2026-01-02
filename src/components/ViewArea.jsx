import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { getTheme } from "@/theme";
import { canvas } from "@/data/layouts";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";

import ChannelRenderer from "@/components/View/ChannelRenderer";
import DropZone from "@/components/View/DropZone";
import CurrentTime from "@/components/Info/CurrentTime";

import { useAtom, useAtomValue } from "jotai";
import {
  channelsAtom,
  layoutAtom,
  ratioAtom,
  pointerEventsEnabledAtom,
  showCurrentTimeAtom,
} from "@/atoms/setting";
import { fitStyleAtom } from "@/atoms/ui";

export default function ViewArea({ canvasRef, fullscreen }) {
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [draggingType, setDraggingType] = useState(null);
  const [fitStyle, setFitStyle] = useAtom(fitStyleAtom);
  const [channels, setChannels] = useAtom(channelsAtom);
  const [ratioKey, setRatio] = useAtom(ratioAtom);
  const layout = useAtomValue(layoutAtom);
  const pointerEventsEnabled = useAtomValue(pointerEventsEnabledAtom);
  const showCurrentTime = useAtomValue(showCurrentTimeAtom);

  const [group, orientation] = ratioKey.split("-");
  const ratioConfig =
    group && orientation ? canvas[group]?.[orientation] : null;

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      const currentOrientation = window.screen.orientation.type;
      const [group] = ratioKey.split("-");

      if (!group || !canvas[group]) return;

      let newOrientation;
      if (currentOrientation.includes("landscape")) {
        newOrientation = "landscape";
      } else if (currentOrientation.includes("portrait")) {
        newOrientation = "portrait";
      } else {
        return;
      }

      if (canvas[group][newOrientation]) {
        const newRatioKey = `${group}-${newOrientation}`;
        if (newRatioKey !== ratioKey) {
          setRatio(newRatioKey);
          window.localStorage.setItem("ratio", newRatioKey);
        }
      }
    };

    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [ratioKey, setRatio]);

  useEffect(() => {
    const element = canvasRef?.current;
    if (!element) return;

    const currentRatio = ratioConfig?.style?.aspectRatio;
    if (!currentRatio) return;

    const [ratioW, ratioH] = currentRatio.split("/").map(Number);

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;

        if (width === 0 || height === 0) return;
        if (width * ratioH >= height * ratioW) {
          setFitStyle({ height: "100%" });
        } else {
          setFitStyle({ width: "100%" });
        }
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [canvasRef, ratioKey, ratioConfig, setFitStyle]);

  const handleDrop = (baseId, targetZoneId) => {
    setChannels((prev) => {
      const updated = structuredClone(prev);
      if (!updated[baseId]) return prev;

      const dragged = updated[baseId];
      const sourceZoneId = dragged.zoneId;

      const targetEntry = Object.values(updated).find(
        (obj) => obj.zoneId === targetZoneId
      );

      if (targetEntry) {
        updated[baseId].zoneId = targetZoneId;
        targetEntry.zoneId = sourceZoneId;
      } else {
        updated[baseId].zoneId = targetZoneId;
      }

      return updated;
    });
  };

  return (
    <Box
      ref={canvasRef}
      sx={{
        flex: "1 1 auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "background.default",
        overflow: "hidden",
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={({ active }) => {
          setIsDraggingAny(true);
          const [baseId, type] = active.id.split("-");
          setDraggingType(type);
        }}
        onDragEnd={({ active, over }) => {
          setIsDraggingAny(false);
          setDraggingType(null);
          if (!over) return;
          const [zoneType, zoneId] = over.id.split("-");
          const [baseId] = active.id.split("-");
          handleDrop(baseId, Number(zoneId));
        }}
      >
        <Box
          className="canvas"
          sx={{
            position: "relative",
            backgroundColor: "background.canvas",
            overflow: "hidden",
            ...fitStyle,
            ...ratioConfig?.style,
          }}
        >
          {/* DropZone */}
          {isDraggingAny &&
            draggingType &&
            layout[draggingType] &&
            Object.values(layout[draggingType]).map((zone) => (
              <DropZone
                key={`${zone.type}-${zone.id}`}
                zone={zone}
                canvasRef={canvasRef}
              />
            ))}

          {/* 채널 렌더링 */}
          {Object.values(channels)
            .filter((c) => c.isVisible)
            .map((channel) => (
              <ChannelRenderer
                key={channel.id}
                channel={channel}
                layout={layout}
                pointerEventsEnabled={pointerEventsEnabled}
              />
            ))}

          {showCurrentTime && <CurrentTime onClick={fullscreen} />}
        </Box>
      </DndContext>
    </Box>
  );
}
