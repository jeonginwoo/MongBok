import { COLORS } from "@/data/color";
import { Box } from "@mui/material";
import TagWrap from "@/components/Common/TagWrap";

const LiveCategory = ({ channel, isTag = false }) => {
  if (!channel.liveCategory) return null;

  const platformColor = COLORS[channel.platform]?.main || "#888888ff";

  if (isTag) {
    return <TagWrap color={platformColor}>{channel.liveCategory}</TagWrap>;
  }

  return (
    <Box sx={{ color: platformColor, fontSize: "0.75rem", fontWeight: "bold" }}>
      {channel.liveCategory}
    </Box>
  );
};

export default LiveCategory;
