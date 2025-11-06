import Box from "@mui/material/Box";
import PersonIcon from "@mui/icons-material/Person";

function UserCount({ liveStatus }) {

  return (
    <Box sx={{ display: "flex", color: "rgba(255, 56, 56, 1)", fontWeight: 600 }}>
      <Box sx={{ display: "flex", alignItems: "flex-end", mb: "2px" }}>
        <PersonIcon sx={{ fontSize: 18, color: "rgba(255, 56, 56, 1)", verticalAlign: "top" }} />
      </Box>
      {liveStatus?.userCount}
    </Box>
  );
}

export default UserCount;
