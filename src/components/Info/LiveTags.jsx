import { Box, useTheme } from "@mui/material";
import TagWrap from "@/components/Common/TagWrap";

const LiveTags = ({ channel, isTag = false }) => {
  if (!channel?.tags || channel.tags.length === 0) return null;

  const theme = useTheme();
  const color = theme.palette.text.tertiary;

  if (isTag) {
    return channel.tags.map((tag, index) => (
      <TagWrap
        key={index}
        color={color}
      >
        {tag}
      </TagWrap>
    ));
  }

  return channel.tags.map((tag, index) => (
    <Box
      key={index}
      sx={{
        color: color,
      }}
    >
      {tag}
    </Box>
  ));
};

export default LiveTags;
