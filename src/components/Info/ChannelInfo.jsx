import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { COLORS } from "@/data/color";

import LiveTime from "@/components/info/LiveTime";
import UserCount from "@/components/info/UserCount";
import ProfileImage from "@/components/info/ProfileImage";

export default function ChannelInfo({ channel, sx = {} }) {
  if (!channel) return null;

  // 🔹 라이브 중이 아닐 때 흑백 & 밝기 낮춤
  const inactiveStyle = !channel.isLive
    ? { filter: "grayscale(100%) brightness(0.7)" }
    : {};

  return (
    <Tooltip
      placement="top"
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            fontSize: 13,
            textAlign: "left",
          },
        },
      }}
      title={
        <span>
          <span style={{ color: `${COLORS[channel.platform].main}`, fontWeight: 600 }}>
            {channel.name || "채널명 없음"}
          </span>
          {" : "}
          {channel.liveTitle || "제목 없음"}
        </span>
      }
    >
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

        {/* ℹ️ Channel Info */}
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
            {channel.liveTitle || channel.name}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LiveTime channel={channel} />
            <UserCount channel={channel} />
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
}
