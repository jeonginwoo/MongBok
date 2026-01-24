import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { canvas } from "@/data/layouts";
import { getAllChannelsData } from "@/api/live";

const storage = createJSONStorage(() =>
  typeof window !== "undefined" ? window.localStorage : undefined
);

// 채널 데이터 초기 셋팅
export const channelsAtom = atom({});
channelsAtom.onMount = (setAtom) => {
  if (typeof window === "undefined") return;
  try {
    const saved = window.localStorage.getItem("channels");
    const savedChannels = saved ? JSON.parse(saved) : {};

    if (Object.keys(savedChannels).length > 0) {
      getAllChannelsData(savedChannels)
        .then((data) => {
          setAtom(data);
        })
        .catch((err) => {
          console.error("❌ 초기 데이터 셋팅 실패:", err);
        });
    }
  } catch (e) {
    console.error("❌ localStorage 파싱 실패:", e);
  }
};

// layoutType
export const layoutTypeAtom = atomWithStorage("layout", "layout1", storage);

// ratio
export const ratioAtom = atomWithStorage("ratio", "16:9-landscape", storage);

// 화면 조작/이동
export const pointerEventsEnabledAtom = atomWithStorage(
  "pointerEventsEnabled",
  false,
  storage
);

// 현재 시간 on/off
export const showCurrentTimeAtom = atomWithStorage(
  "showCurrentTime",
  true,
  storage
);

// 컨트롤러 확장/축소
export const controllerExpandedAtom = atomWithStorage(
  "controllerExpanded",
  true,
  storage
);

// 테마 on/off
export const themeModeAtom = atomWithStorage("themeMode", "dark", storage);

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
