import React from "react";
import { Box, Typography } from "@mui/material";

import UserCount from "@/components/info/UserCount";
import ProfileImage from "@/components/info/ProfileImage";

export default function ChannelInfo({ searchChannel, sx = {} }) {
  if (!searchChannel) return null;

  // 🔹 라이브 중이 아닐 때 흑백 & 밝기 낮춤
  const inactiveStyle = !searchChannel.isLive
    ? { filter: "grayscale(100%) brightness(0.7)" }
    : {};

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        border: "none",
        transition: "filter 0.3s ease",
        ...sx,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          overflow: "hidden",
        }}
      >
        <ProfileImage channel={searchChannel} isBoardered={true} />

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
          {searchChannel.name}
        </Typography>
      </Box>
        
      <Box sx={{ ...inactiveStyle }}>
        <UserCount channel={searchChannel} />
      </Box>
    </Box>
  );
}
