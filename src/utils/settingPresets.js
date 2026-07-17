import { ALL_SETTINGS } from "@/data/settingsOrder";

// 설정 프리셋 (1~4번)
// - "settingPresets": 번호별 스냅샷 { [id]: { settings, viewPresets } }
// - "activeSettingPreset": 사용 중인 프리셋 번호
// 두 키 모두 설정 동기화(ALL_SETTINGS) 대상에는 포함하지 않는다.
export const PRESETS_STORAGE_KEY = "settingPresets";
export const PRESET_IDS = [1, 2, 3, 4, 5];

// layout / currentTimePosition은 실제로는 viewPresets에 저장되는 파생 키이므로
// settings 스냅샷에서 제외하고 viewPresets 원본을 통째로 보존한다.
const DERIVED_KEYS = ["layout", "currentTimePosition"];

export const readPresets = () => {
  try {
    return JSON.parse(window.localStorage.getItem(PRESETS_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

export const writePresets = (presets) => {
  window.localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
};

// 현재 설정 전체(설정 동기화 내용 + viewPresets)를 스냅샷으로 캡처
// channels는 localStorage 저장 지연 문제가 있어 atom 상태를 우선 반영한다
export const captureSnapshot = (channels) => {
  const settings = ALL_SETTINGS.reduce((obj, key) => {
    if (DERIVED_KEYS.includes(key)) return obj;
    const value = window.localStorage.getItem(key);
    if (value !== null) {
      try {
        obj[key] = JSON.parse(value);
      } catch {
        obj[key] = value;
      }
    }
    return obj;
  }, {});

  if (channels && Object.keys(channels).length > 0) {
    settings.channels = Object.fromEntries(
      Object.entries(channels).map(([key, channel]) => [
        key,
        { zoneId: channel.zoneId ?? null },
      ])
    );
  } else {
    delete settings.channels;
  }

  let viewPresets = {};
  try {
    viewPresets = JSON.parse(window.localStorage.getItem("viewPresets")) || {};
  } catch {}

  return { settings, viewPresets };
};

// 스냅샷을 localStorage에 복원 (스냅샷에 없는 키는 제거되어 기본값으로 돌아간다)
export const applySnapshot = (snapshot) => {
  ALL_SETTINGS.forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.removeItem("viewPresets");

  Object.entries(snapshot.settings || {}).forEach(([key, value]) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  });
  window.localStorage.setItem(
    "viewPresets",
    JSON.stringify(snapshot.viewPresets || {})
  );
};
