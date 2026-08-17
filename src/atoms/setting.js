import { atom } from "jotai";
import { atomWithStorage, createJSONStorage, RESET } from "jotai/utils";
import { canvas } from "@/data/canvas";
import { getLiveStatus } from "@/api/live";
import { ENABLE_CHZZK, ENABLE_SOOP, ENABLE_YOUTUBE, ENABLE_TWITCH } from "@/data/config";
import { normalizeChannelsShape, parseChannelKey } from "@/utils/channelKey";

const storage = createJSONStorage(() =>
  typeof window !== "undefined" ? window.localStorage : undefined
);

// 채널 데이터 초기 셋팅
export const channelsAtom = atom({});

// 저장된 채널 목록({ "플랫폼:채널ID": { zoneId } })을 플레이스홀더로 즉시 표시하고
// 라이브 데이터를 비동기로 채운다 (초기 마운트와 프리셋 전환에서 공용)
// 구형(채널ID 키 + platform 필드) 데이터가 들어와도 신형 키로 정규화해서 로드한다
const loadChannels = (savedChannels, setAtom) => {
  const { channels: normalized } = normalizeChannelsShape(savedChannels);
  const entries = Object.entries(normalized);
  if (entries.length === 0) return;

  // 즉시 플레이스홀더 데이터로 채널 목록 표시
  const placeholder = {};
  for (const [channelKey, item] of entries) {
    const parsed = parseChannelKey(channelKey);
    placeholder[channelKey] = {
      id: parsed?.channelId ?? channelKey,
      key: channelKey,
      name: "",
      imageUrl: "",
      liveTitle: "",
      openDate: null,
      closeDate: null,
      isLive: false,
      userCount: 0,
      liveVideoId: null,
      liveCategory: null,
      tags: [],
      isVisible: item.zoneId != null,
      zoneId: item.zoneId ?? null,
      platform: parsed?.platform ?? item.platform,
      _loading: true,
    };
  }
  setAtom(placeholder);

  // 각 채널 데이터를 비동기로 개별 fetch → 도착하는 대로 atom 업데이트
  for (const [channelKey] of entries) {
    const { id: channelId, platform } = placeholder[channelKey];
    getLiveStatus(channelId, platform)
      .then((live) => {
        setAtom((prev) => {
          // 프리셋 전환 등으로 채널이 교체된 뒤 도착한 응답은 무시 (유령 채널 생성 방지)
          if (!prev[channelKey]) return prev;
          return {
            ...prev,
            [channelKey]: {
              ...prev[channelKey],
              name: live.name,
              imageUrl: live.imageUrl,
              liveTitle: live.liveTitle,
              openDate: live.openDate,
              closeDate: live.closeDate,
              isLive: live.isLive,
              userCount: live.userCount,
              liveVideoId: live.liveVideoId ?? null,
              liveCategory: live.liveCategory,
              tags: live.tags,
              liveHlsUrl: live.liveHlsUrl ?? null,
              liveImageUrl: live.liveImageUrl,
              lastRefreshed: live.lastRefreshed,
              // Chat metadata
              chatChannelId: live.chatChannelId,
              accessToken: live.accessToken,
              chatNo: live.chatNo,
              ftk: live.ftk,
              bjid: live.bjid,
              chDomain: live.chDomain,
              chPt: live.chPt,
              pconObject: live.pconObject,
              _loading: false,
            },
          };
        });
      })
      .catch((err) => {
        console.error(`⚠️ ${channelId} 데이터 불러오기 실패:`, err);
        setAtom((prev) => {
          if (!prev[channelKey]) return prev;
          return {
            ...prev,
            [channelKey]: {
              ...prev[channelKey],
              _loading: false,
            },
          };
        });
      });
  }
};

channelsAtom.onMount = (setAtom) => {
  if (typeof window === "undefined") return;
  try {
    const saved = window.localStorage.getItem("channels");
    const savedChannels = saved ? JSON.parse(saved) : {};
    // 구형(채널ID 키) 형식이면 신형(플랫폼:채널ID 키)으로 마이그레이션 후 저장
    const { changed, channels: normalized } = normalizeChannelsShape(savedChannels);
    if (changed) {
      window.localStorage.setItem("channels", JSON.stringify(normalized));
    }
    loadChannels(normalized, setAtom);
  } catch (e) {
    console.error("❌ localStorage 파싱 실패:", e);
  }
};

// ratio
export const RATIO_DEFAULT = "16:9-landscape";
export const ratioAtom = atomWithStorage("ratio", RATIO_DEFAULT, storage);

// 화면 조작/이동
export const pointerEventsEnabledAtom = atomWithStorage(
  "pointerEventsEnabled",
  true,
  storage
);

// 현재 시간 on/off
export const showCurrentTimeAtom = atomWithStorage(
  "showCurrentTime",
  true,
  storage
);

// 녹화 기능 노출 여부 — 기본 숨김. 설정 UI에 토글이 없으며,
// 설정 동기화 JSON에 "recordFeatureEnabled": true 를 직접 지정해야만
// 녹화 관련 UI(컨트롤러 녹화 버튼·설정 항목·매뉴얼 안내)가 보인다
export const recordFeatureEnabledAtom = atomWithStorage(
  "recordFeatureEnabled",
  false,
  storage
);

// 자동 녹화 on/off
export const autoRecordEnabledAtom = atomWithStorage(
  "autoRecordEnabled",
  false,
  storage
);

// 녹화 종료 기준
// "all": 배치된 채널 전체가 오프라인이면 종료
// "zone1": 1번 채널이 오프라인이면 종료
// "manual": 자동 종료하지 않고 사용자가 직접 종료 버튼을 눌러야 종료
export const recordStopConditionAtom = atomWithStorage(
  "recordStopCondition",
  "all",
  storage
);

// 1번 채널의 방제/라이브 카테고리 변경 시 녹화 분할 on/off
// 켜져 있으면 화면 공유 스트림은 유지한 채(권한 재요청 없음) 현재 파일을 닫고
// 새 파일명(변경된 방제 반영)으로 바로 이어서 녹화한다
export const recordSplitOnZone1ChangeAtom = atomWithStorage(
  "recordSplitOnZone1Change",
  false,
  storage
);

// 오프라인 전환 시 자동 목록 복귀 on/off
export const autoHideOfflineAtom = atomWithStorage(
  "autoHideOffline",
  false,
  storage
);

// 치지직 HLS 플레이어 목표 딜레이 (초, 라이브 엣지로부터 유지할 버퍼 거리)
// 기본 3초는 치지직 플레이리스트의 PART-HOLD-BACK 권장값과 동일.
// 낮출수록 실시간에 가깝지만 버퍼링(스톨) 위험이 커진다
export const CHZZK_HLS_LATENCY_MIN = 1;
export const CHZZK_HLS_LATENCY_MAX = 5;
export const CHZZK_HLS_LATENCY_DEFAULT = 3;
export const chzzkHlsLatencyAtom = atomWithStorage(
  "chzzkHlsLatency",
  CHZZK_HLS_LATENCY_DEFAULT,
  storage
);

// 치지직 HLS 플레이어 볼륨/뮤트 — 마지막 사용자 조작 값을 보존해 새 플레이어를
// 배치할 때 초기값으로 상속한다. 배치 이후에는 플레이어마다 독립적으로 조절
// (멀티뷰에서 "1번만 소리, 나머지 뮤트" 같은 사용이 가능해야 하므로 실시간 동기화 안 함)
export const chzzkHlsVolumeAtom = atomWithStorage(
  "chzzkHlsVolume",
  { volume: 1, muted: false },
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

// 채널 목록 최대 개수
export const MAX_CHANNELS = 30;

// 채팅 최대 개수
export const CHAT_MAX_COUNT = 500;

// 채팅 렌더링 주기 (ms)
export const CHAT_RENDER_INTERVAL = 150;

// 채팅창 폰트 크기 조절
export const CHAT_FONT_SIZE_STEP = 0.05;
export const CHAT_FONT_SIZE_BASE = 0.85 + 3 * CHAT_FONT_SIZE_STEP;
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

// 비율+뷰카운트별 뷰 프리셋 (레이아웃 + 시간 위치 등)
export const viewPresetsAtom = atomWithStorage("viewPresets", {}, storage);

// 사용 중인 설정 프리셋 번호 (1~4). 설정 동기화 대상에는 포함하지 않는다.
export const activeSettingPresetAtom = atomWithStorage(
  "activeSettingPreset",
  1,
  storage
);

// layoutType (비율+뷰카운트별 프리셋에서 파생)
export const layoutTypeAtom = atom((get) => {
  const presets = get(viewPresetsAtom);
  const ratioKey = get(ratioAtom);
  const viewCount = get(viewCountAtom);
  if (viewCount === 0) return "layout1";
  const key = `${ratioKey}-${viewCount}`;
  return presets[key]?.layoutType ?? "layout1";
});

// 현재 시간 위치 (비율+뷰카운트별 프리셋에서 파생)
export const currentTimePositionAtom = atom(
  (get) => {
    const presets = get(viewPresetsAtom);
    const ratioKey = get(ratioAtom);
    const viewCount = get(viewCountAtom);
    const key = `${ratioKey}-${viewCount}`;
    const layoutType = presets[key]?.layoutType ?? "layout1";
    return presets[key]?.currentTimePosition?.[layoutType] ?? "right";
  },
  (get, set, update) => {
    const ratioKey = get(ratioAtom);
    const viewCount = get(viewCountAtom);
    if (viewCount === 0) return;

    const key = `${ratioKey}-${viewCount}`;
    const presets = get(viewPresetsAtom);
    const layoutType = presets[key]?.layoutType ?? "layout1";
    const current = presets[key]?.currentTimePosition?.[layoutType] ?? "left";
    const newValue = typeof update === "function" ? update(current) : update;
    set(viewPresetsAtom, {
      ...presets,
      [key]: {
        ...presets[key],
        currentTimePosition: {
          ...(presets[key]?.currentTimePosition || {}),
          [layoutType]: newValue,
        },
      },
    });
  }
);

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

// 녹화 알림음 볼륨 (0-100)
export const recordSoundVolumeAtom = atomWithStorage(
  "recordSoundVolume",
  50,
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

// 플랫폼별 활성화 상태 (config.js 값을 기본값으로 사용, 런타임에서 토글 가능)
export const platformEnabledAtom = atomWithStorage(
  "platformEnabled",
  {
    chzzk: ENABLE_CHZZK,
    soop: ENABLE_SOOP,
    youtube: ENABLE_YOUTUBE,
    twitch: ENABLE_TWITCH,
  },
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

// ----------------------------------------------------

// 설정 동기화 키 → atom 매핑 (channels와 viewPresets 파생 키 제외)
const SETTING_ATOM_MAP = {
  themeMode: themeModeAtom,
  pointColor: pointColorAtom,
  ratio: ratioAtom,
  showCurrentTime: showCurrentTimeAtom,
  pointerEventsEnabled: pointerEventsEnabledAtom,
  chatFontSizeAdjustment: chatFontSizeAdjustmentAtom,
  autoHideOffline: autoHideOfflineAtom,
  chzzkHlsLatency: chzzkHlsLatencyAtom,
  chzzkHlsVolume: chzzkHlsVolumeAtom,
  recordFeatureEnabled: recordFeatureEnabledAtom,
  autoRecordEnabled: autoRecordEnabledAtom,
  recordStopCondition: recordStopConditionAtom,
  recordSplitOnZone1Change: recordSplitOnZone1ChangeAtom,
  recordFrameRate: recordFrameRateAtom,
  recordQuality: recordQualityAtom,
  recordCodec: recordCodecAtom,
  recordSoundEnabled: recordSoundEnabledAtom,
  recordSoundType: recordSoundTypeAtom,
  recordSoundVolume: recordSoundVolumeAtom,
  controllerExpanded: controllerExpandedAtom,
  selectedSearchPlatform: selectedSearchPlatformAtom,
  platformEnabled: platformEnabledAtom,
};

// 프리셋 스냅샷({ settings, viewPresets })을 새로고침 없이 메모리 상태에 즉시 적용.
// 스냅샷에 없는 키는 RESET으로 기본값 복귀. localStorage 반영은 atomWithStorage가 담당한다.
export const applySettingsSnapshotAtom = atom(null, (_get, set, snapshot) => {
  const settings = snapshot.settings || {};

  for (const [key, settingAtom] of Object.entries(SETTING_ATOM_MAP)) {
    set(settingAtom, key in settings ? settings[key] : RESET);
  }
  set(viewPresetsAtom, snapshot.viewPresets || {});

  set(channelsAtom, {});
  loadChannels(settings.channels || {}, (update) => set(channelsAtom, update));
});
