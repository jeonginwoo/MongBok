import React from "react";
import { Box, Typography } from "@mui/material";

import UserCount from "@/components/info/UserCount";
import ProfileImage from "@/components/info/ProfileImage";

export default function ChannelInfo({ channel, sx = {} }) {
  if (!channel) return null;

  // 🔹 라이브 중이 아닐 때 흑백 & 밝기 낮춤
  const inactiveStyle = !channel.isLive
    ? { filter: "grayscale(100%) brightness(0.7)" }
    : {};

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        border: "none",
        transition: "filter 0.3s ease",
        ...inactiveStyle,
        ...sx,
      }}
    >
      <ProfileImage channel={channel} />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: "white",
            fontWeight: 600,
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          }}
        >
          {channel.liveTitle}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <UserCount channel={channel} />
        </Box>
      </Box>
    </Box>
  );
}
