import React from "react";
import dayjs from "dayjs";
import TagWrap from "@/components/Common/TagWrap";

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

  const themeColor = "rgba(136, 136, 136, 1)";

  if (isTag) {
    return (
      <TagWrap color={themeColor} sx={{ whiteSpace: "nowrap" }}>
        {startTime} ~ {endTime}
      </TagWrap>
    );
  }

  return (
    <>
      {startTime} ~ {endTime}
    </>
  );
}

export default ChannelStatus;
