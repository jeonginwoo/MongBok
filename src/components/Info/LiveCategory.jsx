import { Box, useTheme } from "@mui/material";
import TagWrap from "@/components/Common/TagWrap";

const LiveCategory = ({ channel, isTag = false }) => {
  if (!channel.liveCategory) return null;

  const theme = useTheme();
  const platformColor = theme.palette.platform[channel.platform]?.main || theme.palette.text.disabled;

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
