"use client";

import { useEffect } from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";
import { canvas } from "@/data/canvas";

import { useAtom, useAtomValue } from "jotai";
import {
  layoutTypeAtom,
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
  const [layoutType, setLayoutType] = useAtom(layoutTypeAtom);
  const [ratioKey] = useAtom(ratioAtom);
  const viewCount = useAtomValue(viewCountAtom);
  const controllerExpanded = useAtomValue(controllerExpandedAtom);
  const pointColor = useAtomValue(pointColorAtom);

  const [ratio, orientation] = ratioKey.split("-");

  const handleChange = (_, newType) => {
    if (newType !== null) {
      setLayoutType(newType);
    }
  };

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
    (controllerExpanded || settingsMode) && (
      <Box sx={{ display: "flex", gap: "0.6rem" }}>
        {availableLayouts && (
          <StyledToggleButtonGroup
            value={viewCount === 0 ? null : layoutType}
            exclusive
            onChange={handleChange}
            aria-label="layout selection"
            pointcolor={pointColor}
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