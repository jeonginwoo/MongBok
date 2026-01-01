import { useEffect } from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";
import { canvas } from "@/data/layouts";
import RatioSelector from "./RatioSelector";

import { useAtom, useAtomValue } from "jotai";
import {
  layoutTypeAtom,
  ratioAtom,
  viewCountAtom,
  controllerExpandedAtom,
} from "@/atoms/setting";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: "1rem",

  "& .MuiToggleButtonGroup-grouped": {
    padding: 0,
    width: "4.0rem",
    height: "4.0rem",
    border: `0.1rem solid ${theme.palette.primary.main} !important`,
    borderRadius: "0.4rem !important",
    color: theme.palette.primary.main,

    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderColor: `${theme.palette.primary.main} !important`,
      "&:hover": {
        backgroundColor: theme.palette.primary.dark,
      },
    },
  },
}));

export default function LayoutToggleGroup() {
  const [layoutType, setLayoutType] = useAtom(layoutTypeAtom);
  const [ratio, setRatio] = useAtom(ratioAtom);
  const viewCount = useAtomValue(viewCountAtom);
  const controllerExpanded = useAtomValue(controllerExpandedAtom);

  const handleChange = (_, newType) => {
    if (newType !== null) {
      setLayoutType(newType);
      window.localStorage.setItem("layout", newType);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 입력창(input, textarea)이나 편집 가능한 영역에서는 단축키 무시
      const tagName = document.activeElement?.tagName;
      const isInput =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        document.activeElement?.isContentEditable;
      if (isInput) return;

      // 현재 viewCount에 해당하는 레이아웃 키layouts오기
      const currentLayouts = canvas[ratio]?.layouts?.[viewCount];
      if (!currentLayouts) return;

      const layoutKeys = Object.keys(currentLayouts);
      const keyNumber = parseInt(e.key, 10);

      // 숫자키 1 ~ N 범위인지 확인
      if (
        !isNaN(keyNumber) &&
        keyNumber > 0 &&
        keyNumber <= layoutKeys.length
      ) {
        const targetIndex = keyNumber - 1;
        const targetLayout = layoutKeys[targetIndex];

        // 현재 레이아웃과 다를 경우에만 변경
        if (targetLayout !== layoutType) {
          setLayoutType(targetLayout);
          window.localStorage.setItem("layout", targetLayout);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [ratio, viewCount, layoutType, setLayoutType]);

  useEffect(() => {
    if (canvas[ratio]?.layouts?.[viewCount]) {
      const layoutKeys = Object.keys(canvas[ratio]?.layouts?.[viewCount]);
      if (!layoutKeys.includes(layoutType)) {
        setLayoutType(layoutKeys[0]);
      }
    }
  }, [ratio, viewCount, layoutType, setLayoutType]);

  return (
    controllerExpanded && (
      <Box sx={{ display: "flex", gap: "1rem" }}>
        <RatioSelector />
        {canvas[ratio]?.layouts?.[viewCount] && (
          <StyledToggleButtonGroup
            value={viewCount === 0 ? null : layoutType}
            exclusive
            onChange={handleChange}
            aria-label="layout selection"
          >
            {Object.keys(canvas[ratio]?.layouts?.[viewCount] ?? {}).map(
              (key, index) => (
                <ToggleButton
                  key={key}
                  value={key}
                  aria-label={`layout ${index + 1}`}
                  sx={{ fontSize: "1.2rem" }}
                >
                  {index + 1}
                </ToggleButton>
              )
            )}
          </StyledToggleButtonGroup>
        )}
      </Box>
    )
  );
}
