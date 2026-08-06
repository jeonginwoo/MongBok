"use client";

import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { canvas } from "@/data/canvas";
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
  currentTimePositionAtom,
} from "@/atoms/setting";
import { fitStyleAtom, isDraggingAtom } from "@/atoms/ui";
import {
  useLayoutManager,
  getRatioConfig,
} from "@/hooks/useLayoutManager";
import { useScreenRecorder } from "@/hooks/useScreenRecorder";

export default function ViewArea({ canvasRef, fullscreen }) {
  const [isDraggingAny, setIsDraggingAny] = useAtom(isDraggingAtom);
  const [draggingType, setDraggingType] = useState(null);
  const [fitStyle, setFitStyle] = useAtom(fitStyleAtom);
  const [dynamicOverrides, setDynamicOverrides] = useState({});
  const [channels, setChannels] = useAtom(channelsAtom);
  const [ratioKey] = useAtom(ratioAtom);
  const layout = useAtomValue(layoutAtom);
  const pointerEventsEnabled = useAtomValue(pointerEventsEnabledAtom);
  const showCurrentTime = useAtomValue(showCurrentTimeAtom);
  const currentTimePosition = useAtomValue(currentTimePositionAtom);
  const { selectRatio } = useLayoutManager();

  const canvasContentRef = useScreenRecorder();

  const ratioConfig = getRatioConfig(ratioKey);

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
          selectRatio(newRatioKey);
        }
      }
    };

    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [ratioKey, selectRatio]);

  useEffect(() => {
    const element = canvasRef?.current;
    if (!element) return;

    const currentRatio = ratioConfig?.style?.aspectRatio;
    if (!currentRatio) {
      setFitStyle({ width: "100%", height: "100%" });
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: containerWidth, height: containerHeight } =
          entry.contentRect;

        if (containerWidth === 0 || containerHeight === 0) {
          setFitStyle({ width: 0, height: 0 }); // Hide if container is zero
          return;
        }

        const [ratioW, ratioH] = currentRatio.split("/").map(Number);
        const aspectRatio = ratioW / ratioH;

        let newWidth;
        let newHeight;

        if (containerWidth / containerHeight > aspectRatio) {
          newHeight = containerHeight;
          newWidth = containerHeight * aspectRatio;
        } else {
          newWidth = containerWidth;
          newHeight = containerWidth / aspectRatio;
        }

        setFitStyle({
          width: `${newWidth}px`,
          height: `${newHeight}px`,
        });
      }
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [canvasRef, ratioKey, ratioConfig, setFitStyle]);

  useEffect(() => {
    if (!layout?.dynamicView) {
      setDynamicOverrides({});
      return;
    }

    const element = canvasContentRef?.current;
    if (!element) return;

    const { ratio, viewCount } = layout.dynamicView;
    const N = Object.values(channels).filter((c) => c.isVisible).length || 1;

    const compute = () => {
      const canvasWidth = element.clientWidth;
      const canvasHeight = element.clientHeight;
      if (!canvasWidth || !canvasHeight) return;

      const overrides = {};

      if (viewCount === 1) {
        // Only zone 1 video at top (full width), all chats split below
        const viewHeightPx = canvasWidth / ratio;
        const viewHeightPct = Math.min((viewHeightPx / canvasHeight) * 100, 70);
        const chatTopPct = viewHeightPct;
        const chatHeightPct = 100 - chatTopPct;
        const chatColWidthPct = 100 / N;

        overrides[`view-1`] = {
          top: "0%",
          left: "0%",
          width: "100%",
          height: `${viewHeightPct}%`,
        };
        for (let i = 1; i <= N; i++) {
          overrides[`chat-${i}`] = {
            top: `${chatTopPct}%`,
            left: `${chatColWidthPct * (i - 1)}%`,
            width: `${chatColWidthPct}%`,
            height: `${chatHeightPct}%`,
          };
        }
      } else {
        const colWidthPct = 100 / N;
        const viewHeightPx = (canvasWidth / N) / ratio;
        const viewHeightPct = Math.min((viewHeightPx / canvasHeight) * 100, 70);
        const chatTopPct = viewHeightPct;
        const chatHeightPct = 100 - chatTopPct;

        for (let i = 1; i <= N; i++) {
          const leftPct = colWidthPct * (i - 1);
          overrides[`view-${i}`] = {
            top: "0%",
            left: `${leftPct}%`,
            width: `${colWidthPct}%`,
            height: `${viewHeightPct}%`,
          };
          overrides[`chat-${i}`] = {
            top: `${chatTopPct}%`,
            left: `${leftPct}%`,
            width: `${colWidthPct}%`,
            height: `${chatHeightPct}%`,
          };
        }
      }

      setDynamicOverrides(overrides);
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(element);
    return () => observer.disconnect();
  }, [canvasContentRef, layout, channels]);

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
          const lastDash = active.id.lastIndexOf("-");
          const type = active.id.slice(lastDash + 1);
          setDraggingType(type);
        }}
        onDragEnd={({ active, over }) => {
          setIsDraggingAny(false);
          setDraggingType(null);
          if (!over) return;
          const [, zoneId] = over.id.split("-");
          const lastDash = active.id.lastIndexOf("-");
          const baseId = active.id.slice(0, lastDash);
          handleDrop(baseId, Number(zoneId));
        }}
      >
        <Box
          className="canvas"
          ref={canvasContentRef}
          sx={{
            position: "relative",
            backgroundColor: "background.canvas",
            overflow: "hidden",
            transition: "width 0.25s ease-out, height 0.25s ease-out",
            ...fitStyle,
            ...ratioConfig?.style,
            ...(layout?.canvasStyle ?? {}),
          }}
        >
          {/* DropZone */}
          {isDraggingAny &&
            draggingType &&
            layout[draggingType] &&
            Object.values(layout[draggingType]).map((zone) => {
              const override = dynamicOverrides[`${zone.type}-${zone.id}`];
              const effectiveZone = override
                ? { ...zone, style: { ...zone.style, ...override } }
                : zone;
              return (
                <DropZone
                  key={`${effectiveZone.type}-${effectiveZone.id}`}
                  zone={effectiveZone}
                  canvasRef={canvasRef}
                />
              );
            })}

          {/* 채널 렌더링 */}
          {Object.values(channels)
            .filter((c) => c.isVisible)
            .map((channel) => (
              <ChannelRenderer
                key={channel.key}
                channel={channel}
                layout={layout}
                pointerEventsEnabled={pointerEventsEnabled}
                dynamicOverrides={dynamicOverrides}
              />
            ))}

          {showCurrentTime && (
            <CurrentTime
              onClick={fullscreen}
              sx={{
                [currentTimePosition]: 0,
              }}
            />
          )}
        </Box>
      </DndContext>
    </Box>
  );
}
