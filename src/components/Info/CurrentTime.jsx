import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import dayjs from "dayjs";

const CurrentTime = ({ onClick }) => {
  const [time, setTime] = useState(() => dayjs());

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
      onClick={onClick}
      sx={{
        position: "absolute",
        margin: "0.75vmin 1.2vmin",
        padding: "0.6vmin 0.8vmin",
        borderRadius: "0.4vmin",
        bottom: "0",
        right: "0",
        backgroundColor: "background.currentTime",
        color: "common.white",
        fontSize: "1.2vmin",
        lineHeight: 1,
        zIndex: 1000,
        "&:hover": {
          cursor: "pointer",
          backgroundColor: "background.hover",
        },
      }}
    >
      {formattedTime}
    </Box>
  );
};

export default CurrentTime;
