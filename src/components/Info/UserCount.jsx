import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { getChzzkLiveStatus } from "@/api/chzzkApi";

function UserCount({ channelId }) {
  const [userCount, setUserCount] = useState(null);

  useEffect(() => {
    const fetchLiveStatus = async () => {
      try {
        const res = await getChzzkLiveStatus(channelId);
        const status = res?.content?.status;
        const count =
          status === "CLOSE" ? 0 : res?.content?.concurrentUserCount ?? 0;
        setUserCount(count);
      } catch (error) {
        console.error("❌ 시청자 수 불러오기 실패:", error);
        setUserCount(0);
      }
    };

    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 10000);
    return () => clearInterval(interval);
  }, [channelId]);

  return (
    <Box sx={{ display: "flex", color: "rgba(255, 56, 56, 1)", fontWeight: 600 }}>
      <Box sx={{ display: "flex", alignItems: "flex-end", mb: "2px" }}>
        <PersonIcon sx={{ fontSize: 18, color: "rgba(255, 56, 56, 1)", verticalAlign: "top" }} />
      </Box>
      {userCount !== null ? userCount.toLocaleString() : "불러오는 중..."}
    </Box>
  );
}

export default UserCount;
