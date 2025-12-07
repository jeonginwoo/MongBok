import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircleIcon from "@mui/icons-material/Circle";

function UserCount({ channel, isTag = false }) {
  const innerContent = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        color: "rgba(255, 56, 56, 1)",
        gap: "3px",
      }}
    >
      <CircleIcon
        sx={{
          fontSize: "0.4rem",
          color: "rgba(255, 56, 56, 1)",
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
      <Box
        sx={{
          padding: "3px 6px",
          fontWeight: "bold",
          borderRadius: "8px",
          border: `2px solid rgba(255, 56, 56, 1)`,
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        {innerContent}
      </Box>
    );
  }

  return innerContent;
}

export default UserCount;