export const PLATFORM_COLORS = {
  chzzk: {
    main: "rgba(0, 218, 138, 1)",
    profile: "linear-gradient(180deg, rgba(0, 255, 163, 1) 0%, rgba(2, 127, 128, 1) 100%)",
    shadow: "rgba(0, 255, 162, 0.4)",
  },
  soop: {
    main: "rgba(71, 160, 255, 1)",
    profile: "linear-gradient(140deg, rgba(3, 135, 255, 1) 0%, rgba(50, 246, 224, 1) 100%)",
    shadow: "rgba(71, 160, 255, 0.4)",
  },
  youtube: {
    main: "rgba(255, 0, 0, 1)",
    profile: "linear-gradient(140deg, rgba(255, 0, 0, 1) 0%, rgba(204, 0, 0, 1) 100%)",
    shadow: "rgba(255, 0, 0, 0.4)",
  },
  twitch: {
    main: "rgba(145, 70, 255, 1)",
    profile: "linear-gradient(140deg, rgba(145, 70, 255, 1) 0%, rgba(100, 65, 165, 1) 100%)",
    shadow: "rgba(145, 70, 255, 0.4)",
  },
};

// YouTube 슈퍼챗 티어별 색상 (금액 기준, KRW)
export const SUPERCHAT_COLORS = {
  tier1: "#1565C0",  // 파랑  — ₩1,000 ~  ₩1,999
  tier2: "#00B8D4",  // 하늘  — ₩2,000 ~  ₩4,999
  tier3: "#00BFA5",  // 초록  — ₩5,000 ~  ₩9,999
  tier4: "#FFCA28",  // 노랑  — ₩10,000 ~ ₩19,999
  tier5: "#E65100",  // 주황  — ₩20,000 ~ ₩49,999
  tier6: "#C2185B",  // 분홍  — ₩50,000 ~ ₩99,999
  tier7: "#D0021B",  // 빨강  — ₩100,000+
};

export const CHEESE_COLORS = {
  tier0: "rgb(131, 131, 131)",  // 회색   — 0 치즈 (비활성/숨김)
  tier1: "rgb(87, 79, 168)",    // 보라   — 1 ~ 9,999 치즈
  tier2: "rgb(45, 123, 139)",   // 청록   — 10,000 ~ 99,999 치즈
  tier3: "rgb(35, 129, 90)",    // 초록   — 100,000 ~ 499,999 치즈
  tier4: "rgb(209, 142, 60)",   // 주황   — 500,000 ~ 999,999 치즈
  tier5: "rgb(197, 73, 82)",    // 빨강   — 1,000,000+ 치즈
};

// Twitch 비트 치어모트 티어별 색상
export const BITS_COLORS = {
  tier1: "rgb(118, 118, 118)",  // 회색  — 1 ~ 99 비트
  tier2: "rgb(156, 62, 232)",   // 보라  — 100 ~ 999 비트
  tier3: "rgb(29, 178, 165)",   // 청록  — 1,000 ~ 4,999 비트
  tier4: "rgb(0, 153, 254)",    // 파랑  — 5,000 ~ 9,999 비트
  tier5: "rgb(244, 48, 33)",    // 빨강  — 10,000+ 비트
};

export const POINT_COLORS = {
  default: {
    label: "Default",
    value: "default",
    light: "rgba(94, 94, 94, 1)",
    dark: "rgba(211, 211, 211, 1)",
    gradient: "linear-gradient(to right, #838383 0%, #dddddd 100%)",
    brand: "#FF6B6B",
  },
  red: {
    label: "Red",
    value: "red",
    light: "rgba(239, 83, 80, 1)", // Red 400
    dark: "rgba(229, 115, 115, 1)", // Red 300
    gradient: "linear-gradient(to right, #EF5350 0%, #FF9800 100%)",
  },
  orange: {
    label: "Orange",
    value: "orange",
    light: "rgba(255, 152, 0, 1)", // Orange 500
    dark: "rgba(255, 183, 77, 1)", // Orange 300
    gradient: "linear-gradient(to right, #FF9800 0%, #FFEB3B 100%)",
  },
  green: {
    label: "Green",
    value: "green",
    light: "rgba(76, 175, 80, 1)", // Green 500
    dark: "rgba(129, 199, 132, 1)", // Green 300
    gradient: "linear-gradient(to right, #4CAF50 0%, #CDDC39 100%)",
  },
  blue: {
    label: "Blue",
    value: "blue",
    light: "rgba(33, 150, 243, 1)", // Blue 500
    dark: "rgba(100, 181, 246, 1)", // Blue 300
    gradient: "linear-gradient(to right, #2196F3 0%, #00BCD4 100%)",
  },
  purple: {
    label: "Purple",
    value: "purple",
    light: "rgba(156, 39, 176, 1)", // Purple 500
    dark: "rgba(186, 104, 200, 1)", // Purple 300
    gradient: "linear-gradient(to right, #9C27B0 0%, #c86885 100%)",
  },
};

const common = {
  pointColors: {
    pointColor1: "#88d3f2", // Light blue
    pointColor2: "#6b92f2", // Darker blue
    pointColor3: "#4ECDC4", // Teal/Greenish blue
    pointColor4: "#f2c86b", // Mellow yellow
    pointColor5: "#ff6a88", // Vibrant pink
    pointColor6: "#ff7e5f", // Sunset orange
    pointColor7: "#feb47b", // Light apricot
    pointColor8: "#9b59b6", // Deep purple
    pointColor9: "#76d7c4", // Mint green
    pointColor10: "#ef5350", // Soft red
    pointColor11: "#ffa726", // Vibrant orange
    pointColor12: "#424242", // Dark grey
    pointColor13: "#ffee58", // Vibrant yellow
    pointColor14: "#ab47bc", // Medium purple
    pointColor15: "#26a69a", // Dark teal
    pointColor16: "#66bb6a", // Light green
  },
  white: "rgba(255, 255, 255, 1)",
  black: "rgba(0, 0, 0, 1)",
  red: "rgba(255, 56, 56, 1)",
  redHover: "rgba(255, 85, 85, 1)",
  green: "rgb(76,192,101)",
  greenHover: "rgba(100,255,134,0.8)",
  skyBlue: "rgba(79, 195, 247, 1)",
  lightSkyBlue: "rgba(145, 227, 255, 1)",
  dropZone: {
    border: "rgb(76,192,101)",
    background: "rgba(255,255,255,0.3)",
    backgroundOver: "rgba(100,255,134,0.7)",
    text: "rgba(0,0,0,0.15)",
  }
};

export const palettes = {
  dark: {
    mode: 'dark',
    platform: PLATFORM_COLORS,
    common: common,
    primary: {
      main: 'rgba(211, 211, 211, 1)',
      dark: 'rgba(192, 192, 192, 1)',
      contrastText: 'rgba(0, 0, 0, 1)',
      opacity: 'rgba(211, 211, 211, 0.2)',
    },
    background: {
      default: "rgba(27, 27, 27, 1)",
      paper: "rgba(30, 30, 30, 1)",
      level1: "rgba(42, 42, 42, 1)",
      level2: "rgba(31, 31, 31, 1)",
      level3: "rgba(38, 38, 38, 1)",
      level4: "rgba(47, 47, 47, 1)",
      level5: "rgba(44, 44, 44, 1)",
      overlay: "rgba(0, 0, 0, 0.4)",
      gradient: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 40%, transparent 100%)",
      canvas: "rgba(0, 0, 0, 1)",
      chat: "#141517",
      currentTime: "rgba(0,0,0,0.6)",
      profile: "rgba(20, 21, 23, 1)",
      hover: "rgba(134, 134, 134, 0.5)",
      white_10: "rgba(255, 255, 255, 0.1)",
    },
    text: {
      primary: "rgba(255, 255, 255, 1)",
      secondary: "rgba(187, 187, 187, 1)",
      disabled: "rgba(136, 136, 136, 1)",
      tertiary: "rgba(220, 220, 220, 1)",
      quaternary: "rgba(170, 170, 170, 1)",
      placeholder: "rgba(119, 119, 119, 1)",
    },
    border: {
      primary: "rgba(85, 85, 85, 1)",
      secondary: "rgba(136, 136, 136, 1)",
      tertiary: "rgba(68, 68, 68, 1)",
      quaternary: "rgba(51, 51, 51, 1)",
      hover: "rgba(102, 102, 102, 1)",
    },
    scrollbar: {
      thumb: "rgba(85, 85, 85, 1)",
      thumbHover: "rgba(119, 119, 119, 1)",
    },
    tag: {
      color: "rgba(136, 136, 136, 1)",
      background: "rgba(0, 0, 0, 0.2)",
    },
  },
  light: {
    mode: 'light',
    platform: PLATFORM_COLORS,
    common: common,
    primary: {
      main: 'rgba(94, 94, 94, 1)',
      dark: 'rgba(167, 167, 167, 1)',
      contrastText: 'rgba(255, 255, 255, 1)',
      opacity: 'rgba(94, 94, 94, 0.2)',
    },
    background: {
      default: 'rgba(255, 255, 255, 1)',
      paper: 'rgba(245, 245, 245, 1)',
      level1: "rgba(238, 238, 238, 1)",
      level2: "rgba(250, 250, 250, 1)",
      level3: "rgba(240, 240, 240, 1)",
      level4: "rgba(232, 232, 232, 1)",
      level5: "rgba(235, 235, 235, 1)",
      overlay: "rgba(0, 0, 0, 0.2)",
      gradient: "linear-gradient(to bottom, rgba(245,245,245,1) 0%, rgba(245,245,245,0.8) 40%, transparent 100%)",
      canvas: "rgba(0, 0, 0, 1)",
      chat: "rgba(255, 255, 255, 1)",
      currentTime: "rgba(0,0,0,0.6)",
      profile: "rgba(249, 249, 249, 1)",
      hover: "rgba(134, 134, 134, 0.5)",
      white_10: "rgba(0, 0, 0, 0.1)",
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.9)',
      secondary: 'rgba(0, 0, 0, 0.54)',
      disabled: 'rgba(0, 0, 0, 0.38)',
      tertiary: "rgba(0, 0, 0, 0.77)",
      quaternary: "rgba(0, 0, 0, 0.64)",
      placeholder: "rgba(0, 0, 0, 0.42)",
    },
    border: {
      primary: "rgba(0, 0, 0, 0.23)",
      secondary: "rgba(0, 0, 0, 0.12)",
      tertiary: "rgba(0, 0, 0, 0.33)",
      quaternary: "rgba(0, 0, 0, 0.08)",
      hover: "rgba(0, 0, 0, 0.3)",
    },
    scrollbar: {
      thumb: "rgba(0, 0, 0, 0.2)",
      thumbHover: "rgba(0, 0, 0, 0.3)",
    },
    tag: {
      color: "rgba(0, 0, 0, 0.6)",
      background: "rgba(0, 0, 0, 0.08)",
    },
  }
};

// ----------------------------------------------------------

/** hex 배경색의 밝기에 따라 '#000' 또는 '#fff' 반환 (W3C 상대 휘도 기준) */
export function getTextColor(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;
  const toLinear = (c) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.179 ? '#000' : '#fff';
}


/** 금액 문자열에서 숫자 추출 후 티어 색상 반환 */
export function getSuperChatColor(amountStr) {
  const num = parseFloat((amountStr || '').replace(/[^0-9.]/g, '').replace(/,/g, ''));
  if (!num || num < 2000)  return SUPERCHAT_COLORS.tier1;  // ₩1,000 ~ ₩1,999 파랑
  if (num < 5000)          return SUPERCHAT_COLORS.tier2;  // ₩2,000 ~ ₩4,999 하늘
  if (num < 10000)         return SUPERCHAT_COLORS.tier3;  // ₩5,000 ~ ₩9,999 초록
  if (num < 20000)         return SUPERCHAT_COLORS.tier4;  // ₩10,000 ~ ₩19,999 노랑
  if (num < 50000)         return SUPERCHAT_COLORS.tier5;  // ₩20,000 ~ ₩49,999 주황
  if (num < 100000)        return SUPERCHAT_COLORS.tier6;  // ₩50,000 ~ ₩99,999 분홍
  return SUPERCHAT_COLORS.tier7;                           // ₩100,000+ 빨강
}


/** 별풍선 개수(숫자)로 티어 색상 반환 (1개 = 100원, 슈퍼챗 기준 동일) */
export function getBalloonColor(balloonCount) {
  const krw = balloonCount * 100;        // 1개 = 100원
  if (!krw || krw < 2000)  return SUPERCHAT_COLORS.tier1;  // ~19개   파랑
  if (krw < 5000)          return SUPERCHAT_COLORS.tier2;  // 20~49개  하늘
  if (krw < 10000)         return SUPERCHAT_COLORS.tier3;  // 50~99개  초록
  if (krw < 20000)         return SUPERCHAT_COLORS.tier4;  // 100~199개 노랑
  if (krw < 50000)         return SUPERCHAT_COLORS.tier5;  // 200~499개 주황
  if (krw < 100000)        return SUPERCHAT_COLORS.tier6;  // 500~999개 분홍
  return SUPERCHAT_COLORS.tier7;                           // 1,000개+  빨강
}


/** 비트 개수(숫자)로 티어 색상 반환 */
export function getBitsColor(bitsAmount) {
  if (!bitsAmount || bitsAmount < 100) return BITS_COLORS.tier1;  // 1 ~ 99 회색
  if (bitsAmount < 1000)  return BITS_COLORS.tier2;               // 100 ~ 999 보라
  if (bitsAmount < 5000)  return BITS_COLORS.tier3;               // 1,000 ~ 4,999 청록
  if (bitsAmount < 10000) return BITS_COLORS.tier4;               // 5,000 ~ 9,999 파랑
  return BITS_COLORS.tier5;                                       // 10,000+ 빨강
}


/** 치즈 금액(숫자)으로 티어 색상 반환 */
export function getCheeseColor(payAmount) {
  if (payAmount === 0)        return CHEESE_COLORS.tier0;  // 0 치즈 (비활성/숨김)
  if (payAmount < 10000)      return CHEESE_COLORS.tier1;  // 1 ~ 9,999 치즈
  if (payAmount < 100000)     return CHEESE_COLORS.tier2;  // 10,000 ~ 99,999 치즈
  if (payAmount < 500000)     return CHEESE_COLORS.tier3;  // 100,000 ~ 499,999 치즈
  if (payAmount < 1000000)    return CHEESE_COLORS.tier4;  // 500,000 ~ 999,999 치즈
  return CHEESE_COLORS.tier5;                              // 1,000,000+ 치즈
}