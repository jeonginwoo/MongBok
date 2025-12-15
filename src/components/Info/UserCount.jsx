import Box from "@mui/material/Box";
import CircleIcon from "@mui/icons-material/Circle";
import TagWrap from "@/components/Common/TagWrap";

function UserCount({ channel, isTag = false }) {
  const userColor = "rgba(255, 56, 56, 1)";

  const innerContent = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        color: userColor,
        gap: "0.3rem",
        fontSize: "1.2rem",
        lineHeight: 1,
        fontWeight: "bold",
      }}
    >
      <CircleIcon
        sx={{
          fontSize: "0.6rem",
          color: "inherit",
        }}
      />
      {channel?.userCount}
    </Box>
  );

  if (isTag) {
    return (
      <TagWrap color={userColor}>
        {innerContent}
      </TagWrap>
    );
  }

  return innerContent;
}

export default UserCount;