import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import dayjs from "dayjs";

function LiveTime({ channel, isTag = false }) {
  const [time, setTime] = useState("00:00:00");

  useEffect(() => {
    if (!channel.openDate) return;

    if (!channel.isLive) {
      setTime("00:00:00");
      return;
    }

    const updateTimer = () => {
      const now = dayjs();
      const start = dayjs(channel.openDate);
      const diff = now.diff(start);

      if (diff >= 0) {
        const hours = Math.floor(diff / 1000 / 60 / 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTime(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    };

    updateTimer(); // 초기 실행
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [channel.openDate, channel.isLive]);

  // 공통 스타일 색상 정의
  const themeColor = "#888888ff";

  if (isTag) {
    return (
      <Box
        sx={{
          padding: "3px 6px",
          fontWeight: "bold",
          fontSize: "0.75rem",
          borderRadius: "8px",
          border: `2px solid ${themeColor}`,
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          color: themeColor,
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        {time}
      </Box>
    );
  }

  return <Box sx={{ color: themeColor }}>{time}</Box>;
}

export default LiveTime;