import React from "react";
import dayjs from "dayjs";
import { Box, Typography, Tooltip } from "@mui/material";
import { COLORS } from "@/data/color";

import LiveTime from "@/components/Info/LiveTime";
import UserCount from "@/components/Info/UserCount";
import ProfileImage from "@/components/Info/ProfileImage";

export default function ChannelInfo({ channel, sx = {} }) {
  if (!channel) return null;

  // 🔹 라이브 중이 아닐 때 흑백 & 밝기 낮춤
  const inactiveStyle = !channel.isLive
    ? { filter: "grayscale(100%) brightness(0.7)" }
    : {};

  const parentBoxStyle = {
    position: "relative",
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
  };

  const tooltipTitle = (
    <span>
      <span
        style={{ color: `${COLORS[channel.platform].main}`, fontWeight: 600 }}
      >
        {channel.name || "채널명 없음"}
      </span>
      {" : "}
      {channel.liveTitle || "제목 없음"}
    </span>
  );

  const StatusBox = (
    <Box
      sx={{
        position: "absolute",
        bottom: "-3px",
        left: "77px",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: 1,
        zoom: 0.8,
        padding: "2px 6px",
        borderRadius: "4px",
        color: "#bbbbbbff",
        fontWeight: "bold",
        whiteSpace: "nowrap",
      }}
    >
      {channel.isLive ? (
        <>
          <LiveTime channel={channel} />
          <UserCount channel={channel} />
        </>
      ) : channel.closeDate ? (
        `close ${dayjs(channel.closeDate).format("MM/DD HH:mm")}`
      ) : channel.openDate ? (
        `open ${dayjs(channel.openDate).format("MM/DD HH:mm")}`
      ) : (
        ""
      )}
    </Box>
  );

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
      title={tooltipTitle}
    >
      <Box sx={parentBoxStyle}>
        {StatusBox}
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
            {channel.name}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}