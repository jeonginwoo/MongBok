import { atom } from "jotai";
import { canvas } from "@/data/layouts";
import { getAllChannelsData } from "@/api/live";

// ----------------------------------------------------
// 1. 헬퍼 함수
// ----------------------------------------------------
const getSavedChannels = () => {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem("channels");
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error("❌ localStorage 파싱 실패:", e);
    return {};
  }
};

// 채널 데이터 초기 셋팅
export const channelsAtom = atom({});
channelsAtom.onMount = (setAtom) => {
  const savedChannels = getSavedChannels();

  if (Object.keys(savedChannels).length > 0) {
    getAllChannelsData(savedChannels)
      .then((data) => {
        setAtom(data);
      })
      .catch((err) => {
        console.error("❌ 초기 데이터 셋팅 실패:", err);
      });
  }
};

// layoutType
export const layoutTypeAtom = atom(
  window !== "undefined"
    ? window.localStorage.getItem("layout") || "layout1"
    : "layout1"
);

// ratio
export const ratioAtom = atom(
  window !== "undefined"
    ? window.localStorage.getItem("ratio") || "16:9-landscape"
    : "16:9-landscape"
);

// 화면 조작/이동
export const pointerEventsEnabledAtom = atom(
  window !== "undefined"
    ? JSON.parse(window.localStorage.getItem("pointerEventsEnabled")) || false
    : false
);

// 현재 시간 on/off
export const showCurrentTimeAtom = atom(
  window !== "undefined"
    ? window.localStorage.getItem("showCurrentTime") === null
      ? true
      : JSON.parse(window.localStorage.getItem("showCurrentTime"))
    : true
);

// 컨트롤러 확장/축소
export const controllerExpandedAtom = atom(
  window !== "undefined"
    ? window.localStorage.getItem("showCurrentTime") === null
      ? true
      : JSON.parse(window.localStorage.getItem("controllerExpanded"))
    : true
);

// 테마 on/off
export const themeModeAtom = atom(
  window !== "undefined"
    ? window.localStorage.getItem("themeMode") || "dark"
    : "dark"
);

// ----------------------------------------------------

// Viewer로 올라간 채널 수
export const viewCountAtom = atom((get) => {
  const channels = get(channelsAtom);
  return Object.values(channels).filter((c) => c.isVisible).length;
});

// Viewer 채널 수에 따른 레이아웃
export const layoutAtom = atom((get) => {
  const count = get(viewCountAtom);
  const type = get(layoutTypeAtom);
  const ratioKey = get(ratioAtom);

  const [group, orientation] = ratioKey.split("-");
  if (!group || !orientation) return {};

  const ratioConfig = canvas[group]?.[orientation];

  if (
    ratioConfig?.layouts?.[count] &&
    ratioConfig?.layouts?.[count]?.[type]
  ) {
    return ratioConfig.layouts[count][type];
  }

  return {};
});
