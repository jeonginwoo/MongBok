import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import dayjs from "dayjs";

function LiveTime({ status, openDate }) {
  const [time, setTime] = useState("00:00:00");

  useEffect(() => {
    if (!openDate) return;

    // 방송이 종료 상태면 00:00:00으로 고정
    if (status === "CLOSE") {
      setTime("00:00:00");
      return;
    }

    const interval = setInterval(() => {
      const now = dayjs();
      const start = dayjs(openDate);
      const diff = now.diff(start); // 밀리초 단위

      if (diff < 0) {
        // 방송 전
        setTime(`방송 시작까지: ${dayjs(start).diff(now, "minute")}분`);
      } else {
        // 방송 중
        const hours = Math.floor(diff / 1000 / 60 / 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTime(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [openDate, status]);

  return <Box sx={{ color: "white" }}>{time}</Box>;
}

export default LiveTime;
