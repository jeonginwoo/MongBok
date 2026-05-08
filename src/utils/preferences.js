import { canvas } from "@/data/canvas";
import { palettes, POINT_COLORS } from "@/data/color";
import { getLiveStatus } from "@/api/live";
import { ALL_SETTINGS } from "@/data/settingsOrder";

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
  if (isNaN(num) || num < 0 || num > 200) {
    return `유효하지 않은 녹화 알림음 볼륨 값 '${value}'. 0에서 200 사이의 값이어야 합니다.`;
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

export const validateChatFontSizeAdjustment = (value) => {
  const num = Number(value);
  if (isNaN(num)) {
    return `'chatFontSizeAdjustment'에 대한 유효하지 않은 값 '${value}'. 숫자여야 합니다.`;
  }
  if (num < -5 || num > 10) {
    return `'chatFontSizeAdjustment' 값은 -5에서 10 사이여야 합니다.`;
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
    const validationPromises = Object.keys(channelsObj).map(
      (channelId) => {
        const channelData = channelsObj[channelId];
        if (typeof channelId !== "string" || !channelId) {
          return Promise.reject({
            error: `Validation Error: Invalid channelId '${channelId}'.`,
          });
        }
        if (typeof channelData !== "object" || channelData === null) {
          return Promise.reject({
            error: `Validation Error: Channel data for '${channelId}' is not a valid object.`,
          });
        }

        const { platform, zoneId = null } = channelData;
        if (!["chzzk", "soop", "youtube"].includes(platform)) {
          return Promise.reject({
            error: `Validation Error: Invalid platform '${platform}' for channel '${channelId}'. Must be 'chzzk', 'soop', 'youtube'.`,
          });
        }

        if (zoneId !== null) {
          if (
            typeof zoneId !== "number" ||
            !Number.isInteger(zoneId) ||
            zoneId < 1
          ) {
            return Promise.reject({
              error: `Validation Error: Invalid zoneId '${zoneId}' for channel '${channelId}'. Must be null or a positive integer.`,
            });
          }
          zoneIds.push(zoneId);
        }

        return getLiveStatus(channelId, platform);
      }
    );

    const results = await Promise.allSettled(validationPromises);
    const invalidChannels = results.reduce((acc, result, index) => {
      if (result.status === "rejected") {
        const channelId = Object.keys(channelsObj)[index];
        acc.push(channelId);
      }
      return acc;
    }, []);

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
  } catch (e) {
    return `'channels' JSON 문자열을 구문 분석하지 못했습니다: ${e.message}`;
  }
  return true;
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

  const ratio = parsedData.ratio;
  const layout = parsedData.layout;

  if (!ratio) {
    return "'layout' 유효성 검사를 위해 'ratio'가 필요합니다.";
  }

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
        case "autoRecordEnabled":
          validationResult = validateBoolean(value, key);
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
    if ("layout" in parsedData) {
      const layoutValidation = await validateLayout(parsedData);
      if (layoutValidation !== true) {
        return layoutValidation;
      }
    }

    return true;
  } catch (e) {
    return `전체 데이터 문자열을 JSON으로 구문 분석하지 못했습니다: ${e.message}`;
  }
};

// ========== 설정 적용 함수 ==========

export const applyPreferences = (parsedData) => {
  // 먼저 모든 허용된 키를 로컬 스토리지에서 삭제합니다.
  ALLOWED_KEYS.forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.removeItem("viewPresets");

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
