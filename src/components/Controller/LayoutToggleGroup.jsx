"use client";

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
  gap: "0.6rem",

  "& .MuiToggleButtonGroup-grouped": {
    padding: 0,
    width: "3.2rem",
    height: "3.2rem",
    border: `0.1rem solid ${theme.palette.primary.main} !important`,
    borderRadius: "0.4rem !important",
    color: theme.palette.primary.main,

    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderColor: `${theme.palette.primary.main} !important`,
      "&:hover": {
        backgroundColor: theme.palette.primary.main,
        filter: "brightness(0.9)",
      },
    },
  },
}));

export default function LayoutToggleGroup() {
  const [layoutType, setLayoutType] = useAtom(layoutTypeAtom);
  const [ratioKey, setRatio] = useAtom(ratioAtom);
  const viewCount = useAtomValue(viewCountAtom);
  const controllerExpanded = useAtomValue(controllerExpandedAtom);

  const [ratio, orientation] = ratioKey.split("-");

  const handleChange = (_, newType) => {
    if (newType !== null) {
      setLayoutType(newType);
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

      // 현재 viewCount에 해당하는 레이아웃 키 가져오기
      const currentLayouts = canvas[ratio]?.[orientation]?.layouts?.[viewCount];
      if (!currentLayouts) return;

      const layoutKeys = Object.keys(currentLayouts);
      const keyNumber = parseInt(e.key, 10);

      if (!isNaN(keyNumber)) {
        let targetIndex;
        if (keyNumber === 0 && layoutKeys.length > 0) {
          targetIndex = layoutKeys.length - 1;
        } else if (keyNumber > 0 && keyNumber <= layoutKeys.length) {
          targetIndex = keyNumber - 1;
        } else {
          return;
        }

        const targetLayout = layoutKeys[targetIndex];

        // 현재 레이아웃과 다를 경우에만 변경
        if (targetLayout !== layoutType) {
          setLayoutType(targetLayout);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [ratio, orientation, viewCount, layoutType, setLayoutType]);

  useEffect(() => {
    if (canvas[ratio]?.[orientation]?.layouts?.[viewCount]) {
      const layoutKeys = Object.keys(
        canvas[ratio]?.[orientation]?.layouts?.[viewCount]
      );
      if (!layoutKeys.includes(layoutType)) {
        setLayoutType(layoutKeys[0]);
      }
    }
  }, [ratio, orientation, viewCount, layoutType, setLayoutType]);

  const availableLayouts = canvas[ratio]?.[orientation]?.layouts?.[viewCount];

  return (
    controllerExpanded && (
      <Box sx={{ display: "flex", gap: "0.6rem" }}>
        <RatioSelector />
        {availableLayouts && (
          <StyledToggleButtonGroup
            value={viewCount === 0 ? null : layoutType}
            exclusive
            onChange={handleChange}
            aria-label="layout selection"
          >
            {Object.keys(availableLayouts).map((key, index) => (
              <ToggleButton
                key={key}
                value={key}
                aria-label={`layout ${index + 1}`}
                sx={{ fontSize: "1.2rem" }}
              >
                {index + 1}
              </ToggleButton>
            ))}
          </StyledToggleButtonGroup>
        )}
      </Box>
    )
  );
}