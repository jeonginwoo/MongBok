import { atom } from "jotai";

export const snackbarAtom = atom({
  open: false,
  message: "",
  severity: "warning", // "error" | "success" | "info" | "warning"
});
