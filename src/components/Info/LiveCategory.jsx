import { COLORS } from "@/data/color";
import { Box } from "@mui/material";
import TagWrap from "@/components/Common/TagWrap";

const LiveCategory = ({ channel, isTag = false }) => {
  if (!channel.liveCategory) return null;

  const platformColor = COLORS[channel.platform]?.main || "rgba(136, 136, 136, 1)";

  if (isTag) {
    return <TagWrap color={platformColor}>{channel.liveCategory}</TagWrap>;
  }

  return (
    <Box sx={{ color: platformColor, fontSize: "1.2rem", fontWeight: "bold" }}>
      {channel.liveCategory}
    </Box>
  );
};

export default LiveCategory;
