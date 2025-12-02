import React from "react";
import { useAtom } from "jotai";
import { Snackbar, Alert } from "@mui/material";
import { snackbarAtom } from "@/atoms/snackbar";

export default function GlobalSnackbar() {
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        onClose={handleClose}
        severity={snackbar.severity}
        sx={{ width: "100%" }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}
