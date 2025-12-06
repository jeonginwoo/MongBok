import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography"; // Typography 추가
import PersonIcon from "@mui/icons-material/Person";

function UserCount({ channel }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        color: "rgba(255, 56, 56, 1)",
      }}
    >
      <PersonIcon
        sx={{
          fontSize: 15,
          color: "rgba(255, 56, 56, 1)",
        }}
      />
      <Typography
        component="span"
        sx={{
          fontWeight: 600,
          fontSize: 15,
          lineHeight: 1,
        }}
      >
        {channel?.userCount}
      </Typography>
    </Box>
  );
}

export default UserCount;