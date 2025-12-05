import { Box } from "@mui/material";

const LiveTags = ({ channel }) => {
  if (!channel?.tags || channel.tags.length === 0) return null;
  console.log("LiveTags", channel);

  return (
    channel.tags.map((tag, index) => (
      <Box
        key={index}
        sx={{
          padding: "3px 6px",
          fontSize: "0.75rem",
          fontWeight: "bold",
          borderRadius: "8px",
          border: "2px solid rgba(156, 156, 156, 0.5)",
          color: "#dcdcdc",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        {tag}
      </Box>
    ))
  );
};

export default LiveTags;
