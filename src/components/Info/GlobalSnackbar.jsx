import React from "react";
import { useAtom } from "jotai";
import { Snackbar, Alert } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { getTheme } from "@/theme";
import { snackbarAtom } from "@/atoms/ui";

const lightTheme = getTheme("light");

export default function GlobalSnackbar() {
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleClose}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            fontSize: "1.4rem",
            "& .MuiAlert-action": {
              paddingTop: 0,
              alignItems: "center",
              "& .MuiSvgIcon-root": {
                fontSize: "1.4rem",
              },
            },
            "& .MuiAlert-icon": {
              fontSize: "1.8rem",
              alignItems: "center",
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}