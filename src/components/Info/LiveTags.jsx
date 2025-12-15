import { Box } from "@mui/material";
import TagWrap from "@/components/Common/TagWrap";

const LiveTags = ({ channel, isTag = false }) => {
  if (!channel?.tags || channel.tags.length === 0) return null;

  if (isTag) {
    return channel.tags.map((tag, index) => (
      <TagWrap
        key={index}
        color="#dcdcdc"
      >
        {tag}
      </TagWrap>
    ));
  }

  return channel.tags.map((tag, index) => (
    <Box
      key={index}
      sx={{
        color: "#dcdcdc",
      }}
    >
      {tag}
    </Box>
  ));
};

export default LiveTags;
