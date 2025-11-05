import React, { useState, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin
} from "@dnd-kit/core";
import { Box, Paper, Button, Select, MenuItem, Typography } from "@mui/material";

import { layouts } from "@/data/layouts";
import DraggableView from "@/components/DnD/Draggable/DraggableView";
import DraggableChat from "@/components/DnD/Draggable/DraggableChat";
import DropZone from "@/components/DnD/DropZone";
import CurrentTime from "@/components/Info/CurrentTime";

export default function App() {
  // TODO: localstorage에서 가져오기
  const [channels, setChannels] = useState({
    "93fe884808459fb4e4a3c7d64f0eef03": {
      id: "93fe884808459fb4e4a3c7d64f0eef03",
      view: { id: "93fe884808459fb4e4a3c7d64f0eef03", zoneId: 1, type: "view", platform: "chzzk", label: "V1" },
      chat: { id: "93fe884808459fb4e4a3c7d64f0eef03", zoneId: 1, type: "chat", platform: "chzzk", label: "C1" },
    },
    "34ea2a834c0022212290c26ac5e170a1": {
      id: "34ea2a834c0022212290c26ac5e170a1",
      view: { id: "34ea2a834c0022212290c26ac5e170a1", zoneId: 5, type: "view", platform: "chzzk", label: "V1" },
      chat: { id: "34ea2a834c0022212290c26ac5e170a1", zoneId: 5, type: "chat", platform: "chzzk", label: "C1" },
    },
    "b3e262a2795f17734c149afc738ad250": {
      id: "b3e262a2795f17734c149afc738ad250",
      view: { id: "b3e262a2795f17734c149afc738ad250", zoneId: 2, type: "view", platform: "chzzk", label: "V2" },
      chat: { id: "b3e262a2795f17734c149afc738ad250", zoneId: 2, type: "chat", platform: "chzzk", label: "C2" },
    },
    "b2854dc0735e55fa86c53bd15242d30f": {
      id: "b2854dc0735e55fa86c53bd15242d30f",
      view: { id: "b2854dc0735e55fa86c53bd15242d30f", zoneId: 3, type: "view", platform: "chzzk", label: "V3" },
      chat: { id: "b2854dc0735e55fa86c53bd15242d30f", zoneId: 3, type: "chat", platform: "chzzk", label: "C3" },
    },
    "6086f17b054010b0657af00aff6e6d05": {
      id: "6086f17b054010b0657af00aff6e6d05",
      view: { id: "6086f17b054010b0657af00aff6e6d05", zoneId: 4, type: "view", platform: "chzzk", label: "V4" },
      chat: { id: "6086f17b054010b0657af00aff6e6d05", zoneId: 4, type: "chat", platform: "chzzk", label: "C4" },
    },
  });

  const [pointerEventsEnabled, setPointerEventsEnabled] = useState(false);
  const togglePointerEvents = () => setPointerEventsEnabled((prev) => !prev);

  // TODO: localstorage에서 가져오기
  const [viewCount, setViewCount] = useState(1);
  const [layoutType, setLayoutType] = useState("layout1");
  const layout = layouts[viewCount][layoutType];

  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [draggingType, setDraggingType] = useState(null);
  const canvasRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } })
  );

  const handleDrop = (baseId, targetZoneId, targetZoneType, objectType) => {
    setChannels((prev) => {
      const updated = structuredClone(prev); // 깊은 복사 권장
      const dragged = updated[baseId][objectType];
      const sourceZoneId = dragged.zoneId;

      if (dragged.type !== targetZoneType) return prev;

      // 같은 type의 타겟 찾기
      const targetEntry = Object.values(updated).find(
        (obj) => obj[objectType].zoneId === targetZoneId
      );

      if (targetEntry) {
        const temp = targetEntry[objectType].zoneId;
        updated[baseId][objectType].zoneId = targetZoneId;
        targetEntry[objectType].zoneId = sourceZoneId;
      } else {
        updated[baseId][objectType].zoneId = targetZoneId;
      }

      // paired type도 같이 이동
      const pairedType = objectType === "view" ? "chat" : "view";

      const sourcePair = Object.values(updated).find(
        (obj) => obj[pairedType].zoneId === sourceZoneId
      );
      const targetPair = Object.values(updated).find(
        (obj) => obj[pairedType].zoneId === targetZoneId
      );

      if (sourcePair && targetPair) {
        const temp = sourcePair[pairedType].zoneId;
        sourcePair[pairedType].zoneId = targetPair[pairedType].zoneId;
        targetPair[pairedType].zoneId = temp;
      } else if (sourcePair) {
        sourcePair[pairedType].zoneId = targetZoneId;
      }

      return updated;
    });
  };

  const fullscreen = () => {
    const canvas = canvasRef.current;

    if (!document.fullscreenElement) {
      if (canvas) canvas.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* View */}
      <Box
        ref={canvasRef}
        sx={{
          flex: "1 1 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1b1b1bff",
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
            const [baseId, objectType] = active.id.split("-");
            handleDrop(baseId, Number(zoneId), zoneType, objectType);
          }}
        >
          <Box
            className="canvas"
            sx={{
              position: "relative",
              aspectRatio: "16/9",
              width: "100%",
              backgroundColor: "#000",
              overflow: "hidden",
            }}
          >
            {isDraggingAny &&
              draggingType &&
              layout[draggingType] &&
              Object.values(layout[draggingType]).map((zone) => (
                <DropZone key={`${zone.type}-${zone.id}`} zone={zone} canvasRef={canvasRef} />
              ))}

            {Object.values(channels).map((channel) => {
              if (
                !layout[channel.view.type]?.[channel.view.zoneId] ||
                !layout[channel.chat.type]?.[channel.chat.zoneId]
              ) return null;

              return (
                <React.Fragment key={channel.id}>
                  {channel.view && (
                    <DraggableView
                      object={channel.view}
                      zone={layout[channel.view.type][channel.view.zoneId]}
                      pointerEventsEnabled={pointerEventsEnabled}
                    />
                  )}
                  {channel.chat && (
                    <DraggableChat
                      object={channel.chat}
                      zone={layout[channel.chat.type][channel.chat.zoneId]}
                    />
                  )}
                </React.Fragment>
              );
            })}
            <CurrentTime onClick={fullscreen} />
          </Box>
        </DndContext>
      </Box>

      {/* Controller */}
      <Paper
        elevation={3}
        sx={{
          width: 320,
          backgroundColor: "#1e1e1e",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: 2,
          overflowY: "auto",
        }}
      >
        
        {/* ViewCount 선택 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">View Count</Typography>
          <Select
            value={viewCount}
            onChange={(e) => {
              setViewCount(Number(e.target.value));
              setLayoutType("layout1");
            }}
            fullWidth
          >
            {Object.keys(layouts).map((key) => (
              <MenuItem key={key} value={Number(key)}>
                {key}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* LayoutType 선택 */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Layout Type</Typography>
          <Select
            value={layoutType}
            onChange={(e) => setLayoutType(e.target.value)}
            fullWidth
          >
            {Object.keys(layouts[viewCount]).map((key) => (
              <MenuItem key={key} value={key}>
                {key}
              </MenuItem>
            ))}
          </Select>
        </Box>

        {/* pointerEvents 토글 버튼 */}
        <Box sx={{ flex: "0 0 auto", mb: 2 }}>
          <Button
            variant="contained"
            color={pointerEventsEnabled ? "success" : "secondary"}
            fullWidth
            onClick={togglePointerEvents}
          >
            {pointerEventsEnabled ? "조작 모드: ON" : "조작 모드: OFF"}
          </Button>
        </Box>

        {/* 전체화면 버튼 */}
        <Box sx={{ flex: "0 0 auto", mb: 2 }}>
          <Button variant="contained" color="primary" fullWidth onClick={fullscreen}>
            전체화면
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
