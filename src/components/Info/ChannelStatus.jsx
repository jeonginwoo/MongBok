import React from "react";
import dayjs from "dayjs";
import TagWrap from "@/components/Common/TagWrap";

function ChannelStatus({ channel, isTag = false }) {
  const statusText = `${dayjs(channel.openDate).format("MM/DD HH:mm")}`;

  if (!statusText) return null;

  const themeColor = "#888888ff";

  if (isTag) {
    return (
      <TagWrap 
        color={themeColor} 
        sx={{ whiteSpace: "nowrap" }}
      >
        {statusText}
      </TagWrap>
    );
  }

  return <>{statusText}</>;
}

export default ChannelStatus;