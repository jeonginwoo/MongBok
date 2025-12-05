import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import dayjs from "dayjs";

function LiveTime({ channel }) {
  const [time, setTime] = useState("00:00:00");

  useEffect(() => {
    if (!channel.openDate) return;

    if (!channel.isLive) {
      setTime("00:00:00");
      return;
    }

    const interval = setInterval(() => {
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
    }, 1000);

    return () => clearInterval(interval);
  }, [channel.openDate, channel.isLive]);

  return <Box sx={{ color: "#888888ff" }}>{time}</Box>;
}

export default LiveTime;
