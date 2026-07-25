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

  if (!channel.openDate && !channel.closeDate) {
    const noInfoText = "최신 라이브 정보 없음";
    if (isTag) {
      return (
        <TagWrap color={(theme) => theme.palette.text.disabled} sx={{ whiteSpace: "nowrap" }}>
          {noInfoText}
        </TagWrap>
      );
    }
    return (
      <Box component="span" sx={{ color: "text.disabled" }}>
        {noInfoText}
      </Box>
    );
  }

  // 1년이 넘은 방송이면 연도까지 표시 (그 외에는 월/일만)
  const formatDate = (date) => {
    const d = dayjs(date);
    const overOneYear = d.isBefore(dayjs().subtract(1, "year"));
    return d.format(overOneYear ? "YY/MM/DD HH:mm" : "MM/DD HH:mm");
  };

  const startTime = channel.openDate ? formatDate(channel.openDate) : "?";
  const endTime = channel.closeDate ? formatDate(channel.closeDate) : "?";

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
