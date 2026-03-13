import { atom } from "jotai";

export const snackbarAtom = atom({
  open: false,
  message: "",
  severity: "warning", // "error" | "success" | "info" | "warning"
});

export const fitStyleAtom = atom({ width: '100%' });

export const isRecordingAtom = atom(false);

export const isDraggingAtom = atom(false);

export const isSavingRecordingAtom = atom(false);

export const settingsOpenAtom = atom(false);