import React, { useState, useEffect, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import {
  Box,
  Paper,
  Button,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";

import { layouts } from "@/data/layouts";
import ChannelRenderer from "@/components/DnD/ChannelRenderer";
import DropZone from "@/components/DnD/DropZone";
import CurrentTime from "@/components/Info/CurrentTime";
import ChannelList from "@/components/Controller/ChannelList";
import { getChzzkAllChannelsData } from "@/api/chzzkApi";

export default function App() {
  const localStorage = {
    "34ea2a834c0022212290c26ac5e170a1": {
      isVisible: true,
      zoneId: 1,
      platform: "chzzk",
    },
    "b3e262a2795f17734c149afc738ad250": {
      isVisible: false,
      zoneId: null,
      platform: "chzzk",
    },
    "b2854dc0735e55fa86c53bd15242d30f": {
      isVisible: false,
      zoneId: null,
      platform: "chzzk",
    },
    "6086f17b054010b0657af00aff6e6d05": {
      isVisible: false,
      zoneId: null,
      platform: "chzzk",
    },
    "93fe884808459fb4e4a3c7d64f0eef03": {
      isVisible: false,
      zoneId: null,
      platform: "chzzk",
    },
    "80b36a0ae8e887e893ce0014dbfece4a": {
      isVisible: false,
      zoneId: null,
      platform: "chzzk",
    },
    "5f800579267362c952f76f3c6fe695b2": {
      isVisible: false,
      zoneId: null,
      platform: "chzzk",
    },
    "60e2a319d889b3ef6979f68dc3c3fd79": {
      isVisible: false,
      zoneId: null,
      platform: "chzzk",
    },
    "f2607c885c65b6776b9cf5bfb473753c": {
      isVisible: false,
      zoneId: null,
      platform: "chzzk",
    },
  };

  const [channels, setChannels] = useState({});
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const data = await getChzzkAllChannelsData(localStorage);
        setChannels(data);
      } catch (error) {
        console.error("❌ 채널 데이터 불러오기 실패:", error);
      }
    };
    fetchChannels();
  }, []);

  const [pointerEventsEnabled, setPointerEventsEnabled] = useState(false);
  const togglePointerEvents = () => setPointerEventsEnabled((prev) => !prev);

  const viewCount = Object.values(channels).filter((c) => c.isVisible).length || 1;
  const [layoutType, setLayoutType] = useState("layout1");
  const layout = layouts[viewCount][layoutType];
  useEffect(() => {
    setLayoutType("layout1");
  }, [viewCount]);

  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [draggingType, setDraggingType] = useState(null);
  const canvasRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } })
  );

  // Drop handler (기존 zone 이동 로직)
  const handleDrop = (baseId, targetZoneId, targetZoneType, objectType) => {
    setChannels((prev) => {
      const updated = structuredClone(prev);
      const dragged = updated[baseId][objectType];
      const sourceZoneId = dragged.zoneId;

      if (dragged.type !== targetZoneType) return prev;

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
      {/* View 영역 */}
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

              {Object.values(channels)
                .filter((c) => c.isVisible) // 👈 보이는 것만 렌더링
                .map((channel) => {
                  if (
                    !layout[channel.view.type]?.[channel.view.zoneId] ||
                    !layout[channel.chat.type]?.[channel.chat.zoneId]
                  ) return null;

                  return (
                    <React.Fragment key={channel.id}>
                      <ChannelRenderer
                        channel={channel}
                        layout={layout}
                        pointerEventsEnabled={pointerEventsEnabled}
                      />
                    </React.Fragment>
                  );
                })}
            <CurrentTime onClick={fullscreen} />
          </Box>
        </DndContext>
      </Box>

      {/* Controller 영역 */}
      <Paper
        elevation={3}
        sx={{
          width: 320,
          backgroundColor: "#1e1e1e",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "12px 12px 12px 30px",
          overflowY: "auto",
        }}
      >
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

        {/* 채널 순서 및 표시 제어 */}
        <Box sx={{ flex: "1 1 auto" }}>
          <ChannelList channels={channels} setChannels={setChannels} />
        </Box>

        {/* PointerEvents 토글 */}
        <Box sx={{ mb: 2 }}>
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
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" color="primary" fullWidth onClick={fullscreen}>
            전체화면
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
