import React from "react";
import dayjs from "dayjs";
import { Box } from "@mui/material";

function ChannelStatus({ channel, isTag = false }) {
  // let statusText = "";
  // if (channel.closeDate) {
  //   statusText = `off ${dayjs(channel.closeDate).format("MM/DD HH:mm")}`;
  // } else if (channel.openDate) {
  //   statusText = `on ${dayjs(channel.openDate).format("MM/DD HH:mm")}`;
  // }
  const statusText = `${dayjs(channel.openDate).format("MM/DD HH:mm")}`;

  if (!statusText) return null;

  const themeColor = "#888888ff";

  if (isTag) {
    return (
      <Box
        sx={{
          padding: "3px 6px",
          fontWeight: "bold",
          fontSize: "0.75rem",
          borderRadius: "8px",
          border: `2px solid ${themeColor}`,
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          color: themeColor,
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        {statusText}
      </Box>
    );
  }

  return <>{statusText}</>;
}

export default ChannelStatus;