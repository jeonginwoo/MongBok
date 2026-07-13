"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ProfileImage from "@/components/Info/ProfileImage";

/**
 * 방송 오프라인 시 표시하는 화면 (치지직 HLS 플레이어 자리 대체)
 */
export default function OfflineScreen({ channel }) {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: "#141517",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        userSelect: "none",
      }}
    >
      <Box sx={{ filter: "grayscale(1)", opacity: 0.85 }}>
        <ProfileImage channel={channel} imgSize={72} borderSize={6} />
      </Box>
      <Typography sx={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>
        {channel.name || channel.id}
      </Typography>
      <Typography sx={{ color: "#9da1a5", fontSize: 12 }}>
        지금은 방송 중이 아니에요
      </Typography>
    </Box>
  );
}
