"use client";

import { useEffect, useState } from "react";
import { getTouchZoomBoost } from "@/utils/displayScale";

// 캔버스의 긴 변이 이 값일 때 배율 1 (가로형 1920×1080, 세로형 1080×1920 기준)
export const BASE_CANVAS_LONG_SIDE = 1920;

/**
 * ref 요소가 속한 .canvas 크기에 비례하는 배율을 반환한다.
 * 채팅·현재시간 등 캔버스 위 오버레이가 모두 동일한 배율로 커지고 작아지도록
 * 배율 계산을 이 훅 하나로 통일한다. 캔버스 크기 변화(컨트롤러 개폐,
 * 화면비 변경, 창 크기 조절)는 ResizeObserver로 자동 반영된다.
 */
export default function useCanvasZoom(ref) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const canvas = ref.current?.closest(".canvas");
    if (!canvas) return;

    const updateZoom = () => {
      const longSide = Math.max(canvas.clientWidth, canvas.clientHeight);
      if (!longSide) return;
      setZoom((longSide * getTouchZoomBoost()) / BASE_CANVAS_LONG_SIDE);
    };

    updateZoom();
    const observer = new ResizeObserver(updateZoom);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [ref]);

  return zoom;
}
