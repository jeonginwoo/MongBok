import { Box } from "@mui/material";

export default function ManualArea() {
  const scrollStyle = {
    overflowY: "scroll",
    "&::-webkit-scrollbar": { width: "0.4rem" },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(85, 85, 85, 1)",
      borderRadius: "0.4rem",
    },
    "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "rgba(119, 119, 119, 1)" },
  };

  return (
    <Box
      sx={{
        flex: "1 1 auto",
        display: "flex",
        justifyContent: "center",
        backgroundColor: "rgba(27, 27, 27, 1)",
        color: "rgba(255, 255, 255, 1)",
        ...scrollStyle,
      }}
    >
      <Box
        sx={{
          maxWidth: 800,
          width: "100%",
        }}
      >
        <Box
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            width: "100%",
            height: "2000px",
          }}
        />
      </Box>
    </Box>
  );
}