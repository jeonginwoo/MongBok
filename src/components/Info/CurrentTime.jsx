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
        margin: "0.5rem 0.8rem",
        padding: "0.2rem 0.7rem",
        borderRadius: "0.3rem",
        bottom: "0",
        right: "0",
        background: "rgba(0,0,0,0.6)",
        color: "#ffffffff",
        fontSize: "1.5rem",
        zIndex: 1000,
        "&:hover": {
          cursor: "pointer",
          backgroundColor: "rgba(255,255,255,0.1)",
        },
      }}
    >
      {formattedTime}
    </Box>
  );
};

export default CurrentTime;
