import { canvas } from "@/data/canvas";
import { palettes, POINT_COLORS } from "@/data/color";
import { getLiveStatus } from "@/api/live";
import { ALL_SETTINGS } from "@/data/settingsOrder";
import {
  CHZZK_HLS_LATENCY_MIN,
  CHZZK_HLS_LATENCY_MAX,
  RATIO_DEFAULT,
} from "@/atoms/setting";
import {
  CHANNEL_PLATFORMS,
  makeChannelKey,
  parseChannelKey,
} from "@/utils/channelKey";
import { getRecordDirectory } from "@/utils/recordDirectoryStorage";

const ALLOWED_KEYS = ALL_SETTINGS;

// ========== 개별 키 유효성 검사 함수 ==========

export const validateRecordSoundType = (value) => {
  const allowed = ["ding", "chime", "alert", "beep", "success", "fanfare", "blip", "swoosh", "pop"];
  if (!allowed.includes(value)) {
    return `유효하지 않은 녹화 알림음 타입 값 '${value}'. 허용되는 값은: ${allowed.join(
      ", "
    )} 입니다.`;
  }
  return true;
};

export const validateRecordSoundVolume = (value) => {
  const num = Number(value);
  if (isNaN(num) || num < 0 || num > 100) {
    return `유효하지 않은 녹화 알림음 볼륨 값 '${value}'. 0에서 100 사이의 값이어야 합니다.`;
  }
  return true;
};

export const validateCurrentTimePosition = (value) => {
  const allowed = ["left", "right"];
  if (!allowed.includes(value)) {
    return `유효하지 않은 현재 시간 위치 값 '${value}'. 허용되는 값은: ${allowed.join(
      ", "
    )} 입니다.`;
  }
  return true;
};

export const validateRecordQuality = (value) => {
  const allowed = ["high", "medium", "low"];
  if (!allowed.includes(value)) {
    return `유효하지 않은 녹화 품질 값 '${value}'. 허용되는 값은: ${allowed.join(
      ", "
    )} 입니다.`;
  }
  return true;
};

export const validateRecordFrameRate = (value) => {
  const allowed = [30, 60];
  const num = Number(value);
  if (!allowed.includes(num)) {
    return `유효하지 않은 녹화 프레임 값 '${value}'. 허용되는 값은: ${allowed.join(
      ", "
    )} 입니다.`;
  }
  return true;
};

export const validateRecordCodec = (value) => {
  const allowed = ["h264", "vp9", "vp8"];
  if (!allowed.includes(value)) {
    return `유효하지 않은 녹화 코덱 값 '${value}'. 허용되는 값은: ${allowed.join(
      ", "
    )} 입니다.`;
  }
  return true;
};

export const validateRecordStopCondition = (value) => {
  const allowed = ["all", "zone1", "manual"];
  if (!allowed.includes(value)) {
    return `유효하지 않은 녹화 종료 기준 값 '${value}'. 허용되는 값은: ${allowed.join(
      ", "
    )} 입니다.`;
  }
  return true;
};

export const validateChzzkHlsLatency = (value) => {
  const num = Number(value);
  if (
    isNaN(num) ||
    num < CHZZK_HLS_LATENCY_MIN ||
    num > CHZZK_HLS_LATENCY_MAX
  ) {
    return `유효하지 않은 치지직 딜레이 값 '${value}'. ${CHZZK_HLS_LATENCY_MIN}에서 ${CHZZK_HLS_LATENCY_MAX} 사이의 숫자여야 합니다.`;
  }
  return true;
};

export const validateChatFontSizeAdjustment = (value) => {
  const num = Number(value);
  if (isNaN(num)) {
    return `'chatFontSizeAdjustment'에 대한 유효하지 않은 값 '${value}'. 숫자여야 합니다.`;
  }
  if (num < -10 || num > 10) {
    return `'chatFontSizeAdjustment' 값은 -10에서 10 사이여야 합니다.`;
  }
  return true;
};

export const validateThemeMode = (value) => {
  if (typeof value !== "string" || !Object.keys(palettes).includes(value)) {
    return `유효하지 않은 테마 모드 값 '${value}'. 허용되는 값은: ${Object.keys(
      palettes
    ).join(", ")} 입니다.`;
  }
  return true;
};

export const validatePointColor = (value) => {
  if (typeof value !== "string" || !Object.keys(POINT_COLORS).includes(value)) {
    return `유효하지 않은 포인트 컬러 값 '${value}'. 허용되는 값은: ${Object.keys(
      POINT_COLORS
    ).join(", ")} 입니다.`;
  }
  return true;
};

export const validatePlatformEnabled = (value) => {
  let obj = value;
  if (typeof value === "string") {
    try {
      obj = JSON.parse(value);
    } catch (e) {
      return "'platformEnabled' 값이 유효한 JSON 객체(또는 JSON 문자열)가 아닙니다.";
    }
  }

  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return "'platformEnabled' 값이 유효한 객체가 아닙니다.";
  }

  const allowedPlatforms = ["chzzk", "soop", "youtube", "twitch"];
  const normalized = {};

  for (const [key, val] of Object.entries(obj)) {
    if (!allowedPlatforms.includes(key)) {
      return `유효하지 않은 플랫폼 키 '${key}'. 허용되는 키는: ${allowedPlatforms.join(
        ", "
      )} 입니다.`;
    }
    if (typeof val === "boolean") {
      normalized[key] = val;
    } else if (val === "true" || val === "false") {
      normalized[key] = val === "true";
    } else {
      return `'platformEnabled.${key}'에 대한 유효하지 않은 값 '${val}'. boolean이어야 합니다.`;
    }
  }

  return { success: true, platformEnabled: normalized };
};

// 녹화 분할은 지정된 저장 폴더가 있어야만 동작한다 (분할 시점엔 저장 대화상자를
// 다시 띄울 수 없음) — 폴더 미지정 상태에서 true로 켜지는 것을 동기화 단계에서도 막는다
export const validateRecordSplitOnZone1Change = async (value) => {
  const boolCheck = validateBoolean(value, "recordSplitOnZone1Change");
  if (boolCheck !== true) return boolCheck;

  const enabled = value === true || value === "true";
  if (!enabled) return true;

  try {
    const dirHandle = await getRecordDirectory();
    if (!dirHandle) {
      return "'recordSplitOnZone1Change'를 켜려면 녹화 저장 폴더가 지정되어 있어야 합니다. 설정에서 녹화 저장 폴더를 먼저 지정하세요.";
    }
  } catch (e) {
    return `'recordSplitOnZone1Change' 검사 중 녹화 저장 폴더 조회에 실패했습니다: ${e.message}`;
  }
  return true;
};

export const validateBoolean = (value, keyName) => {
  if (
    typeof value !== "boolean" &&
    value !== "true" &&
    value !== "false"
  ) {
    return `'${keyName}'에 대한 유효하지 않은 값 '${value}'. boolean 또는 'true', 'false' 여야 합니다.`;
  }
  return true;
};

export const validateNumber = (value, keyName) => {
  const num = Number(value);
  if (isNaN(num)) {
    return `'${keyName}'에 대한 유효하지 않은 값 '${value}'. 숫자여야 합니다.`;
  }
  return true;
};

export const validateRatio = (value) => {
  if (typeof value !== "string") {
    return `'ratio'의 값은 문자열이어야 합니다.`;
  }
  const validRatios = Object.entries(canvas).flatMap(
    ([group, orientations]) =>
      Object.keys(orientations).map(
        (orientation) => `${group}-${orientation}`
      )
  );
  if (!validRatios.includes(value)) {
    return `유효하지 않은 비율 값 '${value}'. 허용되는 값은: ${validRatios.join(
      ", "
    )} 입니다.`;
  }
  return true;
};

export const validateChannels = async (value) => {
  let channelsObj = value;
  if (typeof value === "string") {
    try {
      channelsObj = JSON.parse(value);
    } catch (e) {
      return "'channels' 값이 유효한 JSON 객체(또는 JSON 문자열)가 아닙니다.";
    }
  }

  try {
    if (
      typeof channelsObj !== "object" ||
      channelsObj === null ||
      Array.isArray(channelsObj)
    ) {
      return "'channels' 값이 유효한 JSON 객체가 아닙니다.";
    }
    
    const zoneIds = [];
    const channelEntries = Object.entries(channelsObj);
    const validationPromises = channelEntries.map(
      async ([rawKey, channelData]) => {
        if (typeof rawKey !== "string" || !rawKey) {
          throw new Error(`Validation Error: Invalid channel key '${rawKey}'.`);
        }
        if (typeof channelData !== "object" || channelData === null) {
          throw new Error(`Validation Error: Channel data for '${rawKey}' is not a valid object.`);
        }

        // 키는 "플랫폼:채널ID"(신형) 또는 "채널ID"(구형) 모두 허용하고 신형으로 정규화
        const parsedKey = parseChannelKey(rawKey);
        const channelId = parsedKey ? parsedKey.channelId : rawKey;
        const { zoneId = null } = channelData;
        const platform = channelData.platform ?? parsedKey?.platform;
        if (!CHANNEL_PLATFORMS.includes(platform)) {
          throw new Error(`Validation Error: Invalid platform '${platform}' for channel '${rawKey}'. Must be ${CHANNEL_PLATFORMS.map((p) => `'${p}'`).join(", ")}.`);
        }
        if (parsedKey && channelData.platform && parsedKey.platform !== channelData.platform) {
          throw new Error(`Validation Error: Key '${rawKey}' does not match platform '${channelData.platform}'.`);
        }

        if (zoneId !== null) {
          if (
            typeof zoneId !== "number" ||
            !Number.isInteger(zoneId) ||
            zoneId < 1
          ) {
            throw new Error(`Validation Error: Invalid zoneId '${zoneId}' for channel '${rawKey}'. Must be null or a positive integer.`);
          }
          zoneIds.push(zoneId);
        }

        const live = await getLiveStatus(channelId, platform);
        // 플랫폼은 키에 포함되므로 value에는 zoneId만 저장
        return {
          resolvedKey: makeChannelKey(platform, live.id || channelId),
          data: { zoneId },
        };
      }
    );

    const results = await Promise.allSettled(validationPromises);
    const invalidChannels = [];
    const normalizedChannels = {};

    results.forEach((result, index) => {
      const originalKey = channelEntries[index][0];
      if (result.status === "rejected") {
        invalidChannels.push(originalKey);
      } else {
        const { resolvedKey, data } = result.value;
        normalizedChannels[resolvedKey] = data;
      }
    });

    if (invalidChannels.length > 0) {
      return `다음 채널 ID에 대한 데이터를 가져올 수 없습니다: ${invalidChannels.join(
        ", "
      )}. 유효하지 않을 수 있습니다.`;
    }

    if (zoneIds.length > 0) {
      const uniqueZoneIds = [...new Set(zoneIds)];
      if (uniqueZoneIds.length !== zoneIds.length) {
        return "'channels'에서 중복된 zoneId가 발견되었습니다.";
      }

      const sortedZoneIds = uniqueZoneIds.sort((a, b) => a - b);
      if (
        sortedZoneIds[sortedZoneIds.length - 1] !== sortedZoneIds.length
      ) {
        return "'zoneId' 값이 1부터 순차적이지 않습니다.";
      }
    }

    return { success: true, channels: normalizedChannels };
  } catch (e) {
    return `'channels' JSON 문자열을 구문 분석하지 못했습니다: ${e.message}`;
  }
};

export const validateLayout = async (parsedData) => {
  let channelsObj = parsedData.channels;
  if (!channelsObj) channelsObj = {};
  else if (typeof channelsObj === "string") {
    try {
      channelsObj = JSON.parse(channelsObj);
    } catch (e) {
      channelsObj = {};
    }
  }

  // 동기화 데이터에 ratio가 없으면 적용 단계(updatePreferences)와 동일하게
  // 현재 저장된 비율로 검증하고, 그것도 없으면 기본값으로 본다
  let ratio = parsedData.ratio;
  if (!ratio && typeof window !== "undefined") {
    try {
      ratio = JSON.parse(window.localStorage.getItem("ratio"));
    } catch {}
  }
  if (!ratio) ratio = RATIO_DEFAULT;
  const layout = parsedData.layout;

  try {
    const visibleCount = Object.values(channelsObj).filter(
      (ch) => (ch.zoneId ?? null) !== null
    ).length;

    if (visibleCount > 0 || Object.keys(channelsObj).length > 0) {
      const [group, orientation] = ratio.split("-");
      if (!group || !orientation) {
        return `유효하지 않은 비율 형식 '${ratio}'. 'group-orientation' 형식이 예상됩니다.`;
      }

      const ratioInfo = canvas[group]?.[orientation];
      if (!ratioInfo) {
        return `비율 그룹 '${group}' 또는 방향 '${orientation}'이 캔버스 레이아웃에서 찾을 수 없습니다.`;
      }

      if (visibleCount > ratioInfo.maxViewCount) {
        return `현재 화면 비율 '${ratio}'에서 표시 가능한 최대 채널 수는 ${ratioInfo.maxViewCount}개입니다. (현재 활성 채널: ${visibleCount}개)`;
      }

      if (visibleCount > 0) {
        const availableLayouts = ratioInfo.layouts[visibleCount];
        if (!availableLayouts || !availableLayouts[layout]) {
          const validLayouts = availableLayouts
            ? Object.keys(availableLayouts)
            : [];
          return `활성 채널 수 ${visibleCount} 및 비율 '${ratio}'에 대한 유효하지 않은 레이아웃 '${layout}'. 사용 가능한 레이아웃: ${validLayouts.join(
            ", "
          )}`;
        }
      }
    }
  } catch (e) {
    return `'layout' 유효성 검사 중 실패했습니다: ${e.message}`;
  }
  return true;
};

// ========== 전체 유효성 검사 함수 (조합) ==========

export const validatePreferences = async (dataToValidate) => {
  try {
    let parsedData = dataToValidate;
    if (typeof dataToValidate === "string") {
      // 빈 문자열이거나 공백만 있는 경우 빈 객체로 처리
      const trimmed = dataToValidate.trim();
      if (trimmed === "") {
        parsedData = {};
      } else {
        parsedData = JSON.parse(dataToValidate);
      }
    }

    if (
      typeof parsedData !== "object" ||
      parsedData === null ||
      Array.isArray(parsedData)
    ) {
      return "데이터는 유효한 객체 형식이 아닙니다.";
    }

    const dataKeys = Object.keys(parsedData);
    if (!dataKeys.every((key) => ALLOWED_KEYS.includes(key))) {
      const invalidKeys = dataKeys.filter((key) => !ALLOWED_KEYS.includes(key));
      return `허용되지 않는 키가 포함되어 있습니다: ${invalidKeys.join(
        ", "
      )}. 허용되는 키는: ${ALLOWED_KEYS.join(", ")} 입니다.`;
    }

    const normalizedData = { ...parsedData };

    // 각 키별 유효성 검사 실행
    for (const key of dataKeys) {
      let value = parsedData[key];
      let validationResult = true;

      switch (key) {
        case "themeMode":
          validationResult = validateThemeMode(value);
          break;
        case "pointColor":
          validationResult = validatePointColor(value);
          break;
        case "ratio":
          validationResult = validateRatio(value);
          break;
        case "showCurrentTime":
          validationResult = validateBoolean(value, key);
          break;
        case "currentTimePosition":
          validationResult = validateCurrentTimePosition(value);
          break;
        case "pointerEventsEnabled":
          validationResult = validateBoolean(value, key);
          break;
        case "chatFontSizeAdjustment":
          validationResult = validateChatFontSizeAdjustment(value);
          break;
        case "autoHideOffline":
          validationResult = validateBoolean(value, key);
          break;
        case "chzzkHlsLatency":
          validationResult = validateChzzkHlsLatency(value);
          break;
        case "recordFeatureEnabled":
          validationResult = validateBoolean(value, key);
          break;
        case "autoRecordEnabled":
          validationResult = validateBoolean(value, key);
          break;
        case "recordStopCondition":
          validationResult = validateRecordStopCondition(value);
          break;
        case "recordSplitOnZone1Change":
          validationResult = await validateRecordSplitOnZone1Change(value);
          break;
        case "recordFrameRate":
          validationResult = validateRecordFrameRate(value);
          break;
        case "recordQuality":
          validationResult = validateRecordQuality(value);
          break;
        case "recordCodec":
          validationResult = validateRecordCodec(value);
          break;
        case "recordSoundEnabled":
          validationResult = validateBoolean(value, key);
          break;
        case "recordSoundType":
          validationResult = validateRecordSoundType(value);
          break;
        case "recordSoundVolume":
          validationResult = validateRecordSoundVolume(value);
          break;
        case "controllerExpanded":
          validationResult = validateBoolean(value, key);
          break;
        case "channels":
          validationResult = await validateChannels(value);
          if (validationResult && typeof validationResult === "object" && validationResult.success) {
            normalizedData.channels = validationResult.channels;
            validationResult = true;
          }
          break;
        case "platformEnabled":
          validationResult = validatePlatformEnabled(value);
          if (validationResult && typeof validationResult === "object" && validationResult.success) {
            normalizedData.platformEnabled = validationResult.platformEnabled;
            validationResult = true;
          }
          break;
        case "layout":
          // Layout validation depends on other keys, handled below.
          break;
        default:
          break;
      }

      if (validationResult !== true) {
        return validationResult;
      }
    }

    // Layout validation (depends on ratio and channels)
    if ("layout" in normalizedData) {
      const layoutValidation = await validateLayout(normalizedData);
      if (layoutValidation !== true) {
        return layoutValidation;
      }
    }

    return normalizedData;
  } catch (e) {
    return `전체 데이터 문자열을 JSON으로 구문 분석하지 못했습니다: ${e.message}`;
  }
};

// ========== 설정 적용 함수 ==========

export const applyPreferences = (parsedData) => {
  // 먼저 모든 허용된 키를 로컬 스토리지에서 삭제합니다.
  // viewPresets는 지우지 않는다 — 동기화 데이터에는 현재 비율·뷰카운트 슬롯의
  // layout/currentTimePosition만 담기므로, 통째로 지우면 다른 슬롯의 레이아웃과
  // 레이아웃별 시계 위치가 복구 불가능하게 사라진다. updatePreferences가 해당 슬롯만 병합 갱신한다.
  ALLOWED_KEYS.forEach((key) => window.localStorage.removeItem(key));

  updatePreferences(parsedData);
};

export const updatePreferences = (parsedData) => {
  for (const key of Object.keys(parsedData)) {
    if (!ALLOWED_KEYS.includes(key)) continue;

    let value = parsedData[key];

    if (value === "true") value = true;
    if (value === "false") value = false;

    if (key === "channels" && typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch (e) {}
    }

    // "layout" 키는 viewPresets의 현재 비율+뷰카운트 슬롯에 저장
    if (key === "layout") {
      let ratio = parsedData.ratio;
      if (!ratio) {
        try { ratio = JSON.parse(window.localStorage.getItem("ratio")); } catch {}
      }
      let channelsData = parsedData.channels;
      if (!channelsData) {
        try { channelsData = JSON.parse(window.localStorage.getItem("channels")); } catch {}
      }
      const viewCount = channelsData && typeof channelsData === "object"
        ? Object.values(channelsData).filter((ch) => ch.zoneId !== null).length
        : 0;
      if (ratio && viewCount > 0) {
        const historyKey = `${ratio}-${viewCount}`;
        let presets = {};
        try { presets = JSON.parse(window.localStorage.getItem("viewPresets")) || {}; } catch {}
        presets[historyKey] = { ...presets[historyKey], layoutType: value };
        window.localStorage.setItem("viewPresets", JSON.stringify(presets));
      }
      continue;
    }

    // "currentTimePosition" 키는 viewPresets의 현재 비율+뷰카운트 슬롯에 저장
    if (key === "currentTimePosition") {
      let ratio = parsedData.ratio;
      if (!ratio) {
        try { ratio = JSON.parse(window.localStorage.getItem("ratio")); } catch {}
      }
      let channelsData = parsedData.channels;
      if (!channelsData) {
        try { channelsData = JSON.parse(window.localStorage.getItem("channels")); } catch {}
      }
      const viewCount = channelsData && typeof channelsData === "object"
        ? Object.values(channelsData).filter((ch) => ch.zoneId !== null).length
        : 0;
      if (ratio && viewCount > 0) {
        const historyKey = `${ratio}-${viewCount}`;
        let presets = {};
        try { presets = JSON.parse(window.localStorage.getItem("viewPresets")) || {}; } catch {}
        const layoutType = presets[historyKey]?.layoutType ?? "layout1";
        presets[historyKey] = {
          ...presets[historyKey],
          currentTimePosition: {
            ...(presets[historyKey]?.currentTimePosition || {}),
            [layoutType]: value,
          },
        };
        window.localStorage.setItem("viewPresets", JSON.stringify(presets));
      }
      continue;
    }

    if (value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }
};
