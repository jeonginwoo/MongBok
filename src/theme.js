import { createTheme } from "@mui/material/styles";
import { palettes } from "@/data/color";

export const getTheme = (mode) => {
  const palette = palettes[mode];
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
                        width: "0.4rem",
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
