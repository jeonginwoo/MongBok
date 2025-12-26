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
};

const common = {
  white: "#FFFFFF",
  black: "#000000",
  red: "rgba(255, 56, 56, 1)",
  redHover: "rgba(255, 85, 85, 1)",
  green: "rgb(76,192,101)",
  greenHover: "rgba(100,255,134,0.8)",
  skyBlue: "rgba(79, 195, 247, 1)",
  lightSkyBlue: "rgba(145, 227, 255, 1)",
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
    },
    background: {
      default: "rgba(27, 27, 27, 1)",
      paper: "rgba(10, 10, 10, 1)",
      level1: "rgba(42, 42, 42, 1)",
      level2: "rgba(31, 31, 31, 1)",
      level3: "rgba(38, 38, 38, 1)",
      level4: "rgba(47, 47, 47, 1)",
      level5: "rgba(44, 44, 44, 1)",
      overlay: "rgba(0, 0, 0, 0.4)",
      gradient: "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)",
      canvas: "rgba(0, 0, 0, 1)",
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
    dropZone: {
      border: "rgb(76,192,101)",
      background: "rgba(255,255,255,0.7)",
      backgroundOver: "rgba(100,255,134,0.8)",
      text: "rgba(0,0,0,0.15)",
    }
  },
  light: {
    mode: 'light',
    platform: PLATFORM_COLORS,
    common: common,
    primary: {
      main: '#5e5e5eff',
      dark: '#a7a7a7ff',
      contrastText: '#fff',
    },
    background: {
      default: '#fff',
      paper: '#f5f5f5',
      level1: "#eeeeee",
      level2: "#fafafa",
      level3: "#f0f0f0",
      level4: "#e8e8e8",
      level5: "#ebebeb",
      overlay: "rgba(0, 0, 0, 0.2)",
      gradient: "linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.3) 70%, rgba(255,255,255,0) 100%)",
      canvas: "#fafafa",
      currentTime: "rgba(0,0,0,0.6)",
      profile: "#f9f9f9",
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
    dropZone: {
      border: "rgb(76,192,101)",
      background: "rgba(0,0,0,0.05)",
      backgroundOver: "rgba(100,255,134,0.3)",
      text: "rgba(0,0,0,0.4)",
    }
  }
};
