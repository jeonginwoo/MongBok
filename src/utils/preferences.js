import { canvas } from "@/data/canvas";
import { palettes, POINT_COLORS } from "@/data/color";
import { getLiveStatus } from "@/api/live";

const ALLOWED_KEYS = [
  "channels",
  "layout",
  "ratio",
  "pointerEventsEnabled",
  "showCurrentTime",
  "controllerExpanded",
  "themeMode",
  "pointColor",
  "chatFontSizeAdjustment",
  "autoRecordEnabled",
  "recordQuality",
  "recordFrameRate",
  "recordSound",
];

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

// 레거시 호환성
export const validateRecordSound = (value) => {
  const allowed = ["none", "ding", "chime", "alert", "beep", "success", "fanfare", "blip", "swoosh", "pop"];
  if (!allowed.includes(value)) {
    return `유효하지 않은 녹화 알림음 값 '${value}'. 허용되는 값은: ${allowed.join(
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

        const { platform, zoneId } = channelData;
        if (!["chzzk", "soop"].includes(platform)) {
          return Promise.reject({
            error: `Validation Error: Invalid platform '${platform}' for channel '${channelId}'. Must be 'chzzk' or 'soop'.`,
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
    const viewCount = Object.keys(channelsObj).length;

    if (viewCount > 0) {
      const [group, orientation] = ratio.split("-");
      if (!group || !orientation) {
        return `유효하지 않은 비율 형식 '${ratio}'. 'group-orientation' 형식이 예상됩니다.`;
      }

      const ratioInfo = canvas[group]?.[orientation];
      if (!ratioInfo) {
        return `비율 그룹 '${group}' 또는 방향 '${orientation}'이 캔버스 레이아웃에서 찾을 수 없습니다.`;
      }

      if (viewCount > ratioInfo.maxViewCount) {
        // Max view count exceeded, but we just ignore specific layout validation
      } else {
        const availableLayouts = ratioInfo.layouts[viewCount];
        if (!availableLayouts || !availableLayouts[layout]) {
          const validLayouts = availableLayouts
            ? Object.keys(availableLayouts)
            : [];
          return `viewCount ${viewCount} 및 비율 '${ratio}'에 대한 유효하지 않은 레이아웃 '${layout}'. 사용 가능한 레이아웃: ${validLayouts.join(
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
      parsedData = JSON.parse(dataToValidate);
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

        case "pointerEventsEnabled":
        case "showCurrentTime":
        case "controllerExpanded":
          validationResult = validateBoolean(value, key);
          break;

        case "chatFontSizeAdjustment":
          validationResult = validateChatFontSizeAdjustment(value);
          break;

        case "recordQuality":
          validationResult = validateRecordQuality(value);
          break;

        case "recordFrameRate":
          validationResult = validateRecordFrameRate(value);
          break;

        case "recordSoundEnabled":
          validationResult = validateBoolean(value, "recordSoundEnabled");
          break;

        case "recordSoundType":
          validationResult = validateRecordSoundType(value);
          break;

        case "recordSound":
          validationResult = validateRecordSound(value);
          break;

        case "ratio":
          validationResult = validateRatio(value);
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

    if (value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }
};
