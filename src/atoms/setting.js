import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { canvas } from "@/data/canvas";
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

// 현재 시간 위치
export const currentTimePositionAtom = atomWithStorage(
  "currentTimePosition",
  "left",
  storage
);

// 자동 녹화 on/off
export const autoRecordEnabledAtom = atomWithStorage(
  "autoRecordEnabled",
  false,
  storage
);

// 오프라인 전환 시 자동 목록 복귀 on/off
export const autoHideOfflineAtom = atomWithStorage(
  "autoHideOffline",
  false,
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

// 포인트 컬러
export const pointColorAtom = atomWithStorage("pointColor", "default", storage);

// 채팅 최대 개수
export const CHAT_MAX_COUNT = 500;

// 채팅 렌더링 주기 (ms)
export const CHAT_RENDER_INTERVAL = 150;

// 채팅창 폰트 크기 조절
export const CHAT_FONT_SIZE_STEP = 0.05;
export const chatFontSizeAdjustmentAtom = atomWithStorage(
  "chatFontSizeAdjustment",
  0,
  storage
);

// ----------------------------------------------------

// Viewer로 올라간 채널 수
export const viewCountAtom = atom((get) => {
  const channels = get(channelsAtom);
  return Object.values(channels).filter((c) => c.isVisible).length;
});

// 비율+뷰카운트별 마지막 선택 레이아웃 히스토리 (설정 동기화 제외)
export const layoutHistoryAtom = atomWithStorage("layoutHistory", {}, storage);

// layoutType (비율+뷰카운트별 히스토리에서 파생)
export const layoutTypeAtom = atom((get) => {
  const history = get(layoutHistoryAtom);
  const ratioKey = get(ratioAtom);
  const viewCount = get(viewCountAtom);
  if (viewCount === 0) return "layout1";
  const historyKey = `${ratioKey}-${viewCount}`;
  return history[historyKey] ?? "layout1";
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

// 녹화 화질 설정 (high, medium, low)
export const recordQualityAtom = atomWithStorage(
  "recordQuality",
  "high",
  storage
);

// 녹화 프레임 설정 (30, 60)
export const recordFrameRateAtom = atomWithStorage(
  "recordFrameRate",
  60,
  storage
);

// 녹화 코덱 설정 (h264, vp9, vp8)
export const recordCodecAtom = atomWithStorage(
  "recordCodec",
  "h264",
  storage
);

// 녹화 알림음 ON/OFF
export const recordSoundEnabledAtom = atomWithStorage(
  "recordSoundEnabled",
  false,
  storage
);

// 녹화 알림음 타입 선택
export const recordSoundTypeAtom = atomWithStorage(
  "recordSoundType",
  "ding",
  storage
);

// 녹화 알림음 볼륨 (0-200)
export const recordSoundVolumeAtom = atomWithStorage(
  "recordSoundVolume",
  100,
  storage
);

// 레거시 호환성을 위한 recordSoundAtom (deprecated)
export const recordSoundAtom = atomWithStorage(
  "recordSound",
  "none",
  storage
);

// 검색 시 선택된 플랫폼 (단일 선택, 빈 문자열이면 모든 플랫폼 검색)
export const selectedSearchPlatformAtom = atomWithStorage(
  "selectedSearchPlatform",
  "",
  storage
);

// 녹화 저장 폴더 핸들 (메모리 전용, IndexedDB에서 로드)
// FileSystemDirectoryHandle은 JSON 직렬화 불가이므로 atomWithStorage 사용 불가
export const recordSaveDirHandleAtom = atom(null);

// 녹화 저장 폴더 이름 표시용 (localStorage 저장)
export const recordSaveDirNameAtom = atomWithStorage(
  "recordSaveDirName",
  "",
  storage
);
