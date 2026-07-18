import { createTheme } from "@mui/material/styles";
import { palettes, POINT_COLORS } from "@/data/color";

export const getTheme = (mode, pointColorName = 'default') => {
  const basePalette = palettes[mode];
  const pointColor = POINT_COLORS[pointColorName] || POINT_COLORS.default;
  const primaryMain = pointColor[mode];

  const palette = {
    ...basePalette,
    primary: {
      ...basePalette.primary,
      main: primaryMain,
      gradient: pointColor.gradient,
      brand: pointColor.brand || primaryMain,
    },
  };

  return createTheme({
    palette: palette,
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: palette.background.default,
                    scrollbarColor: `${palette.scrollbar.thumb}`,
                    "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
                        backgroundColor: "transparent",
                        width: "0.4rem", // 세로 스크롤바 두께
                        height: "0.4rem", // 가로 스크롤바 두께
                    },
                    "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
                        borderRadius: 8,
                        backgroundColor: palette.scrollbar.thumb,
                        minHeight: 24,
                    },
                    "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
                        backgroundColor: palette.scrollbar.thumbHover,
                    },
                    "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
                        backgroundColor: palette.scrollbar.thumbHover,
                    },
                    "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
                        backgroundColor: palette.scrollbar.thumbHover,
                    },
                    "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
                        backgroundColor: palette.background.default,
                    },
                },
            },
        },
    },
  });
};
