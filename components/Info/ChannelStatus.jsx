import React from "react";
import dayjs from "dayjs";
import TagWrap from "@/components/Common/TagWrap";
import { Box } from "@mui/material";

function ChannelStatus({ channel, isTag = false }) {
  // let statusText = "";
  // if (channel.closeDate) {
  //   statusText = `off ${dayjs(channel.closeDate).format("MM/DD HH:mm")}`;
  // } else if (channel.openDate) {
  //   statusText = `on ${dayjs(channel.openDate).format("MM/DD HH:mm")}`;
  // }

  const startTime = `${dayjs(channel.openDate).format("MM/DD HH:mm")}`;
  const endTime = channel.closeDate
    ? `${dayjs(channel.closeDate).format("MM/DD HH:mm")}`
    : "?";

  if (!startTime) return null;

  if (isTag) {
    return (
      <TagWrap color={(theme) => theme.palette.text.disabled} sx={{ whiteSpace: "nowrap" }}>
        {startTime} ~ {endTime}
      </TagWrap>
    );
  }

  return (
    <Box component="span" sx={{ color: "text.disabled" }}>
      {startTime} ~ {endTime}
    </Box>
  );
}

export default ChannelStatus;
