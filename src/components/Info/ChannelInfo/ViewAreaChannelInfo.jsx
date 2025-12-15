import React from "react";
import { Box, Typography } from "@mui/material";

import LiveCategory from "@/components/Info/LiveCategory";
import LiveTags from "@/components/Info/LiveTags";
import UserCount from "@/components/Info/UserCount";
import ProfileImage from "@/components/Info/ProfileImage";

export default function ChannelInfo({ channel }) {
  if (!channel) return null;

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
            fontSize: "1.4rem",
            fontWeight: "bord",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
          }}
        >
          {channel.liveTitle}
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
        >
          <LiveCategory channel={channel} />
          <UserCount channel={channel} />
        </Box>
      </Box>
    </Box>
  );
}
