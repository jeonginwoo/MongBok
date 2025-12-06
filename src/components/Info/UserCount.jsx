import Box from "@mui/material/Box";
import PersonIcon from "@mui/icons-material/Person";

function UserCount({ channel }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "bottom",
        color: "rgba(255, 56, 56, 1)",
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      <PersonIcon
        sx={{
          fontSize: 18,
          color: "rgba(255, 56, 56, 1)",
          verticalAlign: "",
          lineHeight: 1,
        }}
      />
      {channel?.userCount}
    </Box>
  );
}

export default UserCount;
