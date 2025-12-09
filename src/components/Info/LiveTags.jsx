import TagWrap from "@/components/Common/TagWrap";

const LiveTags = ({ channel }) => {
  if (!channel?.tags || channel.tags.length === 0) return null;
  // console.log("LiveTags", channel);

  return (
    channel.tags.map((tag, index) => (
      <TagWrap
        key={index}
        color="#dcdcdc"
        borderColor="rgba(156, 156, 156, 0.5)"
      >
        {tag}
      </TagWrap>
    ))
  );
};

export default LiveTags;