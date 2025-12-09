import { COLORS } from "@/data/color";
import TagWrap from "@/components/Common/TagWrap";

const LiveCategory = ({ channel }) => {
  if (!channel.liveCategory) return null;

  const platformColor = COLORS[channel.platform]?.main || "#888888ff";

  return (
    <TagWrap color={platformColor}>
      {channel.liveCategory}
    </TagWrap>
  );
};

export default LiveCategory;