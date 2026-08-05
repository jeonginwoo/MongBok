"use client";

import React, { useState } from "react";
import { Box, Button, Menu, MenuItem } from "@mui/material";
import { useAtom } from "jotai";
import { ratioAtom } from "@/atoms/setting";
import { canvas } from "@/data/canvas";
import {
  useLayoutManager,
  getRatioConfig,
} from "@/hooks/useLayoutManager";

const RatioDisplay = ({ ratioConfig, sx }) => {
  const ratioValue = ratioConfig?.style?.aspectRatio;

  const style = ratioValue
    ? (() => {
        const [w, h] = ratioValue.split("/").map(Number);
        const numericRatio = w / h;
        return numericRatio >= 1
          ? { width: "100%", height: `${(1 / numericRatio) * 100}%` }
          : { width: `${numericRatio * 100}%`, height: "100%" };
      })()
    : { width: "100%", height: "100%" };

  return (
    <Box
      sx={{
        ...style,
        backgroundColor: "primary.main",
        opacity: 0.4,
        transition: "width 0.25s ease-out, height 0.25s ease-out",
        ...sx,
      }}
    />
  );
};

export default function RatioSelector() {
  const [ratio] = useAtom(ratioAtom);
  const { selectRatio } = useLayoutManager();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const currentRatioConfig = getRatioConfig(ratio);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectRatio = (newRatioKey) => {
    selectRatio(newRatioKey);
    handleClose();
  };

  return (
    <>
      <Button
        value="ratio-selector"
        onClick={handleClick}
        sx={{
          position: "relative",
          padding: 0,
          minWidth: "7rem",
          height: "7rem",
          border: "0.1rem dashed",
          borderColor: "primary.opacity",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "1.4rem",
            fontWeight: "bold",
            color: "text.secondary",
            width: "100%",
            lineHeight: 1,
            zIndex: 1,
          }}
        >
          {currentRatioConfig?.style?.aspectRatio?.replace(" / ", " : ") ?? ratio?.split("-")[0]}
        </Box>
        <RatioDisplay ratioConfig={currentRatioConfig} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "ratio-button",
          sx: {
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            padding: "0.5rem",
          },
        }}
      >
        {Object.entries(canvas).map(([group, orientations]) => (
          <Box key={group} sx={{ display: "flex", gap: "0.5rem" }}>
            {Object.entries(orientations).map(([orientation, config]) => {
              const ratioKey = `${group}-${orientation}`;
              return (
                <MenuItem
                  key={ratioKey}
                  onClick={() => handleSelectRatio(ratioKey)}
                  selected={ratioKey === ratio}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem",
                    borderRadius: "0.4rem",
                    width: "7rem",
                  }}
                >
                  <Box
                    sx={{
                      width: "4.0rem",
                      height: "4.0rem",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <RatioDisplay
                      ratioConfig={config}
                      sx={{ borderRadius: "0.2rem" }}
                    />
                  </Box>
                  <Box
                    sx={{
                      width: "100%",
                      textAlign: "center",
                      fontSize: "1.2rem",
                    }}
                  >
                    {config.style?.aspectRatio?.replace(" / ", " : ") ?? group}
                  </Box>
                </MenuItem>
              );
            })}
          </Box>
        ))}
      </Menu>
    </>
  );
}

