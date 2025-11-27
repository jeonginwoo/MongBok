import { atom } from "jotai";
import { layouts } from "@/data/layouts";

// ----------------------------------------------------
// 1. 기본 상태 (읽기/쓰기 가능)
// ----------------------------------------------------

export const channelsAtom = atom({});

// layoutType 상태: localStorage 기반 초기화
const initialLayoutType = typeof window !== 'undefined' 
    ? window.localStorage.getItem("layout") || "layout1" 
    : "layout1";
export const layoutTypeAtom = atom(initialLayoutType);

// pointerEventsEnabled 상태
export const pointerEventsEnabledAtom = atom(false);

// 현재 시간 표시 여부 상태
export const showCurrentTimeAtom = atom(true);


// ----------------------------------------------------
// 2. 파생된 상태 (읽기 전용)
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