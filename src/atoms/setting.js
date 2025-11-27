import { atom } from "jotai";
import { layouts } from "@/data/layouts";
import { getAllChannelsData } from "@/api/live";


// ----------------------------------------------------
// 1. 헬퍼 함수
// ----------------------------------------------------
const getSavedChannels = () => {
  if (typeof window === 'undefined') return {};
  try {
    const saved = window.localStorage.getItem("channels");
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error("❌ localStorage 파싱 실패:", e);
    return {};
  }
};


// ----------------------------------------------------
// 2. 기본 상태
// ----------------------------------------------------

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

// layoutType 상태
export const layoutTypeAtom = atom(
    window !== 'undefined' 
    ? window.localStorage.getItem("layout") || "layout1" 
    : "layout1"
);

// pointerEventsEnabled 상태
export const pointerEventsEnabledAtom = atom(
    window !== 'undefined' 
    ? JSON.parse(window.localStorage.getItem("pointerEventsEnabled")) || false
    : false
);

// 현재 시간 표시 여부 상태
export const showCurrentTimeAtom = atom(
    window !== 'undefined' 
    ? (
        window.localStorage.getItem("showCurrentTime") === null 
            ? true
            : JSON.parse(window.localStorage.getItem("showCurrentTime"))
    )
    : true
);


// ----------------------------------------------------
// 3. 파생된 상태 (읽기 전용)
// ----------------------------------------------------

export const viewCountAtom = atom((get) => {
    const channels = get(channelsAtom);
    return Object.values(channels).filter((c) => c.isVisible).length;
});

export const layoutAtom = atom((get) => {
    const count = get(viewCountAtom);
    const type = get(layoutTypeAtom);
    
    if (layouts[count] && layouts[count][type]) {
        return layouts[count][type];
    }

    return {}; 
});