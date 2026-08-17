"use client";

import React, { useState, useEffect, useRef } from "react";
import { Box, Fade } from "@mui/material";
import { useAtomValue } from "jotai";
import {
  layoutTypeAtom,
  ratioAtom,
  themeModeAtom,
  showCurrentTimeAtom,
  pointerEventsEnabledAtom,
  chatFontSizeAdjustmentAtom,
  chzzkHlsLatencyAtom,
  controllerExpandedAtom,
  currentTimePositionAtom,
  recordAtom,
  autoRecordEnabledAtom,
  recordStopConditionAtom,
  recordSplitOnZone1ChangeAtom,
  pointColorAtom,
  recordQualityAtom,
  recordFrameRateAtom,
  recordCodecAtom,
  recordSoundEnabledAtom,
  recordSoundTypeAtom,
  recordSoundVolumeAtom,
} from "@/atoms/setting";
import { getRatioConfig } from "@/hooks/useLayoutManager";
import { POINT_COLORS } from "@/data/color";

const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export default function SettingChangeIndicator() {
  const [notification, setNotification] = useState(null);

  const layoutType = useAtomValue(layoutTypeAtom);
  const ratioKey = useAtomValue(ratioAtom);
  const themeMode = useAtomValue(themeModeAtom);
  const showCurrentTime = useAtomValue(showCurrentTimeAtom);
  const pointerEventsEnabled = useAtomValue(pointerEventsEnabledAtom);
  const chatFontSizeAdjustment = useAtomValue(chatFontSizeAdjustmentAtom);
  const chzzkHlsLatency = useAtomValue(chzzkHlsLatencyAtom);
  const controllerExpanded = useAtomValue(controllerExpandedAtom);
  const currentTimePosition = useAtomValue(currentTimePositionAtom);
  // 녹화 기능 숨김 상태에서는 녹화 관련 변경 알림도 함께 숨긴다
  const record = useAtomValue(recordAtom);
  const autoRecordEnabled = useAtomValue(autoRecordEnabledAtom);
  const recordStopCondition = useAtomValue(recordStopConditionAtom);
  const recordSplitOnZone1Change = useAtomValue(recordSplitOnZone1ChangeAtom);
  const pointColor = useAtomValue(pointColorAtom);
  const recordQuality = useAtomValue(recordQualityAtom);
  const recordFrameRate = useAtomValue(recordFrameRateAtom);
  const recordCodec = useAtomValue(recordCodecAtom);
  const recordSoundEnabled = useAtomValue(recordSoundEnabledAtom);
  const recordSoundType = useAtomValue(recordSoundTypeAtom);
  const recordSoundVolume = useAtomValue(recordSoundVolumeAtom);

  const prevLayoutType = usePrevious(layoutType);
  const prevRatioKey = usePrevious(ratioKey);
  const prevThemeMode = usePrevious(themeMode);
  const prevShowCurrentTime = usePrevious(showCurrentTime);
  const prevPointerEventsEnabled = usePrevious(pointerEventsEnabled);
  const prevChatFontSizeAdjustment = usePrevious(chatFontSizeAdjustment);
  const prevChzzkHlsLatency = usePrevious(chzzkHlsLatency);
  const prevControllerExpanded = usePrevious(controllerExpanded);
  const prevCurrentTimePosition = usePrevious(currentTimePosition);
  const prevAutoRecordEnabled = usePrevious(autoRecordEnabled);
  const prevRecordStopCondition = usePrevious(recordStopCondition);
  const prevRecordSplitOnZone1Change = usePrevious(recordSplitOnZone1Change);
  const prevPointColor = usePrevious(pointColor);
  const prevRecordQuality = usePrevious(recordQuality);
  const prevRecordFrameRate = usePrevious(recordFrameRate);
  const prevRecordCodec = usePrevious(recordCodec);
  const prevRecordSoundEnabled = usePrevious(recordSoundEnabled);
  const prevRecordSoundType = usePrevious(recordSoundType);
  const prevRecordSoundVolume = usePrevious(recordSoundVolume);

  useEffect(() => {
    let message = null;

    if (prevRatioKey !== undefined && ratioKey !== prevRatioKey) {
      const ratioConfig = getRatioConfig(ratioKey);
      const ratioText =
        ratioConfig?.style?.aspectRatio?.replace(" / ", " : ") ??
        ratioKey?.split("-")[0];
      message = `비율: ${ratioText}`;
    } else if (prevLayoutType !== undefined && layoutType !== prevLayoutType) {
      message = `레이아웃: ${layoutType.replace("layout", "")}`;
    } else if (prevThemeMode !== undefined && themeMode !== prevThemeMode) {
      message = `테마: ${themeMode === "dark" ? "어둡게" : "밝게"}`;
    } else if (
      prevShowCurrentTime !== undefined &&
      showCurrentTime !== prevShowCurrentTime
    ) {
      message = `현재 시간: ${showCurrentTime ? "표시" : "숨김"}`;
    } else if (
      prevCurrentTimePosition !== undefined &&
      currentTimePosition !== prevCurrentTimePosition
    ) {
      message = `시간 위치: ${currentTimePosition === "left" ? "왼쪽" : "오른쪽"}`;
    } else if (
      prevPointerEventsEnabled !== undefined &&
      pointerEventsEnabled !== prevPointerEventsEnabled
    ) {
      message = `화면 ${pointerEventsEnabled ? "조작" : "이동"} 모드`;
    } else if (
      prevChatFontSizeAdjustment !== undefined &&
      chatFontSizeAdjustment !== prevChatFontSizeAdjustment
    ) {
      message = `채팅 글자 크기: ${
        chatFontSizeAdjustment > 0 ? "+" : ""
      }${chatFontSizeAdjustment}`;
    } else if (
      prevChzzkHlsLatency !== undefined &&
      chzzkHlsLatency !== prevChzzkHlsLatency
    ) {
      message = `치지직 딜레이: ${Number(chzzkHlsLatency).toFixed(1)}초`;
    } else if (
      prevControllerExpanded !== undefined &&
      controllerExpanded !== prevControllerExpanded
    ) {
      message = `컨트롤러: ${controllerExpanded ? "펼침" : "접힘"}`;
    } else if (
      record &&
      prevAutoRecordEnabled !== undefined &&
      autoRecordEnabled !== prevAutoRecordEnabled
    ) {
      message = `자동 녹화: ${autoRecordEnabled ? "켜짐" : "꺼짐"}`;
    } else if (
      record &&
      prevRecordStopCondition !== undefined &&
      recordStopCondition !== prevRecordStopCondition
    ) {
      message = `녹화 종료 기준: ${
        recordStopCondition === "zone1"
          ? "1번 채널"
          : recordStopCondition === "manual"
          ? "수동 종료"
          : "전체 채널"
      }`;
    } else if (
      record &&
      prevRecordSplitOnZone1Change !== undefined &&
      recordSplitOnZone1Change !== prevRecordSplitOnZone1Change
    ) {
      message = `녹화 분할(방제·카테고리): ${recordSplitOnZone1Change ? "켜짐" : "꺼짐"}`;
    } else if (prevPointColor !== undefined && pointColor !== prevPointColor) {
      message = `포인트 컬러: ${POINT_COLORS[pointColor]?.label}`;
    } else if (
      record &&
      prevRecordQuality !== undefined &&
      recordQuality !== prevRecordQuality
    ) {
      message = `녹화 화질: ${recordQuality}`;
    } else if (
      record &&
      prevRecordFrameRate !== undefined &&
      recordFrameRate !== prevRecordFrameRate
    ) {
      message = `녹화 프레임: ${recordFrameRate}`;
    } else if (
      record &&
      prevRecordCodec !== undefined &&
      recordCodec !== prevRecordCodec
    ) {
      message = `녹화 코덱: ${recordCodec}`;
    } else if (
      record &&
      prevRecordSoundEnabled !== undefined &&
      recordSoundEnabled !== prevRecordSoundEnabled
    ) {
      message = `녹화 알림음: ${recordSoundEnabled ? "켜짐" : "꺼짐"}`;
    } else if (
      record &&
      prevRecordSoundType !== undefined &&
      recordSoundType !== prevRecordSoundType
    ) {
      message = `알림음: ${recordSoundType}`;
    } else if (
      record &&
      prevRecordSoundVolume !== undefined &&
      recordSoundVolume !== prevRecordSoundVolume
    ) {
      message = `알림음 크기: ${recordSoundVolume}%`;
    }

    if (message) {
      setNotification(message);
    }
  }, [
    ratioKey, layoutType, themeMode, showCurrentTime, pointerEventsEnabled,
    chatFontSizeAdjustment, chzzkHlsLatency, controllerExpanded, currentTimePosition,
    record,
    autoRecordEnabled, recordStopCondition, recordSplitOnZone1Change, pointColor,
    recordQuality, recordFrameRate,
    recordCodec, recordSoundEnabled, recordSoundType, recordSoundVolume,
    prevRatioKey, prevLayoutType, prevThemeMode, prevShowCurrentTime,
    prevPointerEventsEnabled, prevChatFontSizeAdjustment, prevChzzkHlsLatency,
    prevControllerExpanded, prevCurrentTimePosition, prevAutoRecordEnabled,
    prevRecordStopCondition, prevRecordSplitOnZone1Change,
    prevPointColor, prevRecordQuality, prevRecordFrameRate, prevRecordCodec,
    prevRecordSoundEnabled, prevRecordSoundType, prevRecordSoundVolume,
  ]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <Fade in={Boolean(notification)} timeout={300}>
      <Box
        sx={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          color: "white",
          padding: "0.8rem 1.6rem",
          borderRadius: "0.5rem",
          zIndex: 2000,
          fontSize: "1.4rem",
          fontWeight: "bold",
          whiteSpace: "pre",
          pointerEvents: "none",
        }}
      >
        {notification}
      </Box>
    </Fade>
  );
}
