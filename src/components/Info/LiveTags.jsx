"use client";

import { Box, useTheme } from "@mui/material";
import TagWrap from "@/components/Common/TagWrap";

const LiveTags = ({ channel, isTag = false }) => {
  const theme = useTheme();

  // 조기 반환은 반드시 모든 훅 호출 뒤에 — 렌더 간 훅 순서 보장 (rules-of-hooks)
  if (!channel?.tags || channel.tags.length === 0) return null;

  const color = theme.palette.text.tertiary;

  if (isTag) {
    return channel.tags.map((tag, index) => (
      <TagWrap
        key={index}
        color={color}
      >
        {tag}
      </TagWrap>
    ));
  }

  return channel.tags.map((tag, index) => (
    <Box
      key={index}
      sx={{
        color: color,
      }}
    >
      {tag}
    </Box>
  ));
};

export default LiveTags;
