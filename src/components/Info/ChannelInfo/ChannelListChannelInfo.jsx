import React from "react";
import dayjs from "dayjs";
import { Box, Typography, Tooltip } from "@mui/material";
import { COLORS } from "@/data/color";

import LiveCategory from "@/components/Info/LiveCategory";
import LiveTags from "@/components/Info/LiveTags";
import LiveTime from "@/components/Info/LiveTime";
import UserCount from "@/components/Info/UserCount";
import ProfileImage from "@/components/Info/ProfileImage";
import ChannelStatus from "@/components/Info/ChannelStatus";

import { useAtomValue } from "jotai";
import { controllerExpandedAtom } from "@/atoms/setting";

export default function ChannelInfo({ channel, isDragging = false }) {
  if (!channel) return null;

  const controllerExpanded = useAtomValue(controllerExpandedAtom);

  const inactiveStyle = !channel.isLive
    ? { filter: "grayscale(100%) brightness(0.7)" }
    : {};

  const tooltipTitle = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ fontSize: "1.4rem" }}>
        <span
          style={{ color: `${COLORS[channel.platform].main}`, fontWeight: "bord" }}
        >
          {channel.name || "채널명 없음"}
        </span>
        {" : "}
        {channel.liveTitle || "제목 없음"}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.5,
          maxWidth: "26.0rem",
        }}
      >
        <LiveCategory channel={channel} isTag={true} />
        <LiveTags channel={channel} isTag={true} />
        {channel.isLive ? (
          <>
            <UserCount channel={channel} isTag={true}v />
            <LiveTime channel={channel} isTag={true} />
          </>
        ) : (
          <ChannelStatus channel={channel} isTag={true} />
        )}
      </Box>
    </Box>
  );

  return (
    <Tooltip
      placement="left"
      arrow
      title={isDragging ? null : tooltipTitle}
      componentsProps={{
        tooltip: {
          sx: {
            fontSize: "1.2rem",
            textAlign: "left",
            pointerEvents: "auto",
          },
          onClick: (e) => e.stopPropagation(),
          onMouseDown: (e) => e.stopPropagation(),
          onPointerDown: (e) => e.stopPropagation(),
        },
      }}
    >
      <Box
        sx={{
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
        }}
      >
        <ProfileImage channel={channel} />

        {controllerExpanded && (
          <Box sx={{ width: "100%", marginRight: "0.5rem" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignContent: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                }}
              >
                {channel.name}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {channel.isLive && <UserCount channel={channel} />}
                {channel.isLive && <LiveTime channel={channel} />}
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: "1.2rem",
                borderRadius: "10rem",
                color: "#bbbbbbff",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              {channel.isLive ? (
                <LiveCategory channel={channel} />
              ) : (
                <ChannelStatus channel={channel} />
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}
