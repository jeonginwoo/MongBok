import React from "react";
import dayjs from "dayjs";
import { Box, Typography, Tooltip } from "@mui/material";
import { COLORS } from "@/data/color";

import LiveCategory from "@/components/Info/LiveCategory";
import LiveTags from "@/components/Info/LiveTags";
import LiveTime from "@/components/Info/LiveTime";
import UserCount from "@/components/Info/UserCount";
import ProfileImage from "@/components/Info/ProfileImage";

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
      {/* 첫 줄: 채널 이름 + 제목 */}
      <Box sx={{ fontSize: 13 }}>
        <span
          style={{ color: `${COLORS[channel.platform].main}`, fontWeight: 600 }}
        >
          {channel.name || "채널명 없음"}
        </span>
        {" : "}
        {channel.liveTitle || "제목 없음"}
      </Box>

      {/* 두 번째 줄: 카테고리 + 태그 */}
      {(channel.liveCategory || (channel.tags && channel.tags.length > 0)) && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 0.5,
            maxWidth: "260px",
          }}
        >
          <LiveCategory channel={channel} />
          <LiveTags channel={channel} />
          {channel.isLive && (
            <UserCount channel={channel} isTag={true} />
          )}
        </Box>
      )}
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
            fontSize: 13,
            textAlign: "left",
          },
        },
      }}
    >
      <Box sx={{
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
      }}>
        <ProfileImage channel={channel} />
        
        {controllerExpanded && (
          <Box>
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontSize: "0.8rem",
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
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}