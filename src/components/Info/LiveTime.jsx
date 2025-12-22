import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import dayjs from "dayjs";
import TagWrap from "@/components/Common/TagWrap";

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

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [channel.openDate, channel.isLive]);

  const themeColor = "rgba(136, 136, 136, 1)";

  if (isTag) {
    return <TagWrap color={themeColor}>{time}</TagWrap>;
  }

  return (
    <Box
      sx={{
        color: themeColor,
        fontSize: "1.2rem",
        fontWeight: "bold",
        lineHeight: 1,
      }}
    >
      {time}
    </Box>
  );
}

export default LiveTime;
