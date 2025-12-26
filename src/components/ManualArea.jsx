import { Box } from "@mui/material";

export default function ManualArea() {
  return (
    <Box
      sx={{
        flex: "1 1 auto",
        display: "flex",
        justifyContent: "center",
        backgroundColor: "background.default",
        color: "text.primary",
        overflowY: "scroll",
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
            backgroundColor: "background.white_10",
            width: "100%",
            height: "2000px",
          }}
        />
      </Box>
    </Box>
  );
}