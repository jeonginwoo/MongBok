"use client";

import { Box, useTheme } from "@mui/material";
import TagWrap from "@/components/Common/TagWrap";
import { useLiveTime } from "@/hooks/useLiveTime";

function LiveTime({ channel, isTag = false }) {
  const time = useLiveTime(channel);
  const theme = useTheme();
  const color = theme.palette.text.disabled;

  if (!channel.openDate) return null;

  if (isTag) {
    return <TagWrap color={color}>{time}</TagWrap>;
  }

  return (
    <Box
      sx={{
        color: color,
        fontSize: "1.2rem",
        fontWeight: "bold",
        lineHeight: 1,
      }}
    >
      {time}
    </Box>
  );
}

export default LiveTime;
