"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import dayjs from "dayjs";
import useCanvasZoom from "@/hooks/useCanvasZoom";

const CurrentTime = ({ onClick, sx }) => {
  const [time, setTime] = useState(() => dayjs());
  const rootRef = useRef(null);
  // 채팅과 동일한 캔버스 비례 배율 (기존 vmin 단위는 창 크기 기준이라
  // 컨트롤러 개폐·레터박스 시 채팅과 배율이 어긋났다)
  const zoom = useCanvasZoom(rootRef);

  useEffect(() => {
    const updateTime = () => setTime(dayjs());

    updateTime();

    const now = dayjs();
    const delay = (60 - now.second()) * 1000 - now.millisecond();

    const timeout = setTimeout(() => {
      updateTime();
      const interval = setInterval(updateTime, 60000);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  const formattedTime = time.format("HH:mm");

  return (
    <Box
      ref={rootRef}
      onClick={onClick}
      sx={{
        // px 값은 1920×1080 캔버스가 화면을 가득 채웠을 때의 기존 vmin 크기와 동일
        position: "absolute",
        margin: "8px 13px",
        padding: "6.5px 8.5px",
        borderRadius: "4px",
        bottom: "0",
        backgroundColor: "background.currentTime",
        color: "common.white",
        fontSize: "13px",
        lineHeight: 1,
        zoom,
        zIndex: 1000,
        "&:hover": {
          cursor: "pointer",
          backgroundColor: "background.hover",
        },
        ...sx,
      }}
    >
      {formattedTime}
    </Box>
  );
};

export default CurrentTime;
