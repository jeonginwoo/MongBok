import { Box } from "@mui/material";
import { COLORS } from "@/data/color";

const LiveCategory = ({ channel }) => {
  if (!channel.liveCategory) return null;
  console.log("LiveCategory",channel);

  return (
    <Box
      sx={{
        padding: "3px 6px",
        fontSize: "0.75rem",
        fontWeight: "bold",
        borderRadius: "8px",
        border: `2px solid ${COLORS[channel.platform].main}`,
        color: COLORS[channel.platform].main,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {channel.liveCategory}
    </Box>
  );
};

export default LiveCategory;
