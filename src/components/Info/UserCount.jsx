import Box from "@mui/material/Box";
import CircleIcon from "@mui/icons-material/Circle";
import TagWrap from "@/components/Common/TagWrap";
import { useTheme } from "@mui/material";

function UserCount({ channel, isTag = false }) {
  const theme = useTheme();
  const color = theme.palette.common.red;

  const innerContent = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        color: color,
        gap: "0.3em",
        fontSize: "1.2em",
        lineHeight: 1,
        fontWeight: "bold",
      }}
    >
      <CircleIcon
        sx={{
          fontSize: "0.6em",
          color: "inherit",
        }}
      />
      {channel?.userCount}
    </Box>
  );

  if (isTag) {
    return (
      <TagWrap color={color}>
        {innerContent}
      </TagWrap>
    );
  }

  return innerContent;
}

export default UserCount;