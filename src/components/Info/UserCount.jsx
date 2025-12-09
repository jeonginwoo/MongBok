import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
        gap: "3px",
      }}
    >
      <CircleIcon
        sx={{
          fontSize: "0.4rem",
          color: "inherit",
        }}
      />
      <Typography
        component="span"
        sx={{
          fontWeight: 600,
          fontSize: "0.75rem",
          lineHeight: 1,
        }}
      >
        {channel?.userCount}
      </Typography>
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