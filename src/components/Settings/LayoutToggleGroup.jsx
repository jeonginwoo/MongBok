"use client";

import { useEffect } from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";
import { canvas } from "@/data/canvas";

import { useAtom, useAtomValue } from "jotai";
import {
  layoutTypeAtom,
  viewPresetsAtom,
  ratioAtom,
  viewCountAtom,
  controllerExpandedAtom,
  pointColorAtom,
} from "@/atoms/setting";

const StyledToggleButtonGroup = styled(ToggleButtonGroup, {
  shouldForwardProp: (prop) => prop !== "pointcolor",
})(({ theme, pointcolor }) => {
  const accentColor =
    pointcolor === "default" ? "#5f5f5f" : theme.palette.primary.main;

  return {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",

    "& .MuiToggleButtonGroup-grouped": {
      padding: 0,
      width: "3.2rem",
      height: "3.2rem",
      border: `0.1rem solid ${accentColor} !important`,
      borderRadius: "0.4rem !important",
      color: accentColor,

      "&.Mui-disabled": {
        borderColor: `${theme.palette.action.disabledBackground} !important`,
        color: `${theme.palette.action.disabled} !important`,
      },

      "&.Mui-selected": {
        backgroundColor: accentColor,
        color: "#fff",
        borderColor: `${accentColor} !important`,
        "&:hover": {
          backgroundColor: accentColor,
          filter: "brightness(0.9)",
        },
      },
    },
  };
});

export default function LayoutToggleGroup({ settingsMode }) {
  const layoutType = useAtomValue(layoutTypeAtom);
  const [, setViewPresets] = useAtom(viewPresetsAtom);
  const [ratioKey] = useAtom(ratioAtom);
  const viewCount = useAtomValue(viewCountAtom);
  const controllerExpanded = useAtomValue(controllerExpandedAtom);
  const pointColor = useAtomValue(pointColorAtom);

  const [ratio, orientation] = ratioKey.split("-");

  const handleChange = (_, newType) => {
    if (newType !== null && viewCount > 0) {
      const historyKey = `${ratioKey}-${viewCount}`;
      setViewPresets((prev) => ({
        ...prev,
        [historyKey]: { ...prev[historyKey], layoutType: newType },
      }));
    }
  };

  useEffect(() => {
    if (viewCount === 0) return;
    const availableLayouts = canvas[ratio]?.[orientation]?.layouts?.[viewCount];
    if (!availableLayouts || availableLayouts[layoutType]) return;
    // 현재 layoutType이 이 비율+뷰카운트에서 유효하지 않으면 layout1로 초기화
    const historyKey = `${ratioKey}-${viewCount}`;
    setViewPresets((prev) => ({
      ...prev,
      [historyKey]: { ...prev[historyKey], layoutType: Object.keys(availableLayouts)[0] },
    }));
  }, [ratio, orientation, ratioKey, viewCount, layoutType, setViewPresets]);

  const availableLayouts = canvas[ratio]?.[orientation]?.layouts?.[viewCount || 1];

  return (
    (controllerExpanded || settingsMode) && (
      <Box sx={{ display: "flex", gap: "0.6rem" }}>
        {availableLayouts && (
          <StyledToggleButtonGroup
            value={viewCount === 0 ? null : layoutType}
            exclusive
            onChange={handleChange}
            aria-label="layout selection"
            pointcolor={pointColor}
            disabled={viewCount === 0}
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