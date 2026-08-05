"use client";

import { Box, useTheme } from "@mui/material";
import TagWrap from "@/components/Common/TagWrap";

const LiveCategory = ({ channel, isTag = false, fontSize, sx = {} }) => {
  if (!channel.liveCategory) return null;

  const theme = useTheme();
  const platformColor = theme.palette.platform[channel.platform]?.main || theme.palette.text.disabled;

  if (isTag) {
    return (
      <TagWrap
        color={platformColor}
        sx={{
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "inline-block",
          textAlign: "center",
          ...sx,
        }}
      >
        {channel.liveCategory}
      </TagWrap>
    );
  }

  return (
    <Box
      sx={{
        color: platformColor,
        fontSize: fontSize,
        fontWeight: "bold",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0,
        maxWidth: "100%",
        ...sx,
      }}
    >
      {channel.liveCategory}
    </Box>
  );
};

export default LiveCategory;
