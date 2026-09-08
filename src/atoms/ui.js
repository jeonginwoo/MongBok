import { atom } from "jotai";

export const snackbarAtom = atom({
  open: false,
  message: "",
  severity: "warning", // "error" | "success" | "info" | "warning"
});

export const fitStyleAtom = atom({ width: '100%' });

export const isRecordingAtom = atom(false);

// 녹화 파이프라인이 실제로 돌기 시작한 시각(ms) — 녹화 중이 아니면 null.
// isRecordingAtom은 화면 공유 픽커가 열린 시점부터 true라 경과 시간의 기준으로 부적합
export const recordingStartedAtAtom = atom(null);

export const isDraggingAtom = atom(false);

export const isSavingRecordingAtom = atom(false);

export const settingsOpenAtom = atom(false);

export const controllerPopupOpenAtom = atom(false);