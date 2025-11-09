import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";

const CurrentTime = ({ onClick }) => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const updateTime = () => setTime(new Date());

    updateTime(); // 초기 1회 실행

    const now = new Date();
    const delay = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()); // 다음 정각까지 남은 시간

    const timeout = setTimeout(() => {
      updateTime();
      setInterval(updateTime, 60000); // 이후부터 1분마다
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const formattedTime = time.toLocaleTimeString("ko-KR", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Box
      onClick={onClick}
      sx={{
        position: "absolute",
        margin: "5px 8px",
        padding: "2px 7px",
        borderRadius: "3px",
        bottom: "0",
        right: "0",
        background: "rgba(0,0,0,0.6)",
        color: "#ffffffff",
        fontSize: "15px",
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
