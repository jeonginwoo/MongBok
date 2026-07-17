// 터치 기기(모바일/태블릿)는 탭 캡처 녹화 대상이 아니므로 가독성 우선으로 화면 배율을 보정한다.
// CSS 픽셀 기준으로는 캔버스가 작아도 물리 픽셀로는 크기 때문에 DPR에 가중치를 곱해 보정한다.
const TOUCH_ZOOM_WEIGHT = 0.7;

export function getTouchZoomBoost() {
  if (typeof window === "undefined") return 1;
  const isTouchDevice = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  if (!isTouchDevice) return 1;
  return (window.devicePixelRatio * TOUCH_ZOOM_WEIGHT) || 1;
}
