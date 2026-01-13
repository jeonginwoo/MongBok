import { atom } from "jotai";

export const snackbarAtom = atom({
  open: false,
  message: "",
  severity: "warning", // "error" | "success" | "info" | "warning"
});

export const fitStyleAtom = atom({ width: '100%' });

export const isDraggingAtom = atom(false);