import React, { useState } from "react";
import { Box, Button, Menu, MenuItem } from "@mui/material";
import { useAtom } from "jotai";
import { ratioAtom } from "@/atoms/setting";
import { canvas } from "@/data/layouts";

const RatioDisplay = ({ ratioKey }) => {
  const ratioValue = canvas[ratioKey]?.style?.aspectRatio;
  if (!ratioValue) return null;

  const [w, h] = ratioValue.split("/").map(Number);
  const numericRatio = w / h;

  const fitStyle = numericRatio >= 1 ? { width: "100%" } : { height: "100%" };

  return (
    <Box
      sx={{
        ...fitStyle,
        aspectRatio: ratioValue,
        backgroundColor: "primary.opacity",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "0.4rem",
      }}
    />
  );
};

export default function RatioSelector() {
  const [ratio, setRatio] = useAtom(ratioAtom);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectRatio = (newRatio) => {
    setRatio(newRatio);
    window.localStorage.setItem("ratio", newRatio);
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
          minWidth: 0,
          width: "4.0rem",
          height: "4.0rem",
          border: "0.1rem dashed",
          borderColor: "primary.opacity",
        }}
      >
        <Box sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "1rem",
            color: "primary.main",
            width: "100%",
            lineHeight: 0,
          }}
        >
          {canvas[ratio]?.style?.aspectRatio.replace(" / ", " : ")}
        </Box>
        <RatioDisplay ratioKey={ratio} />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "ratio-button",
          sx: { display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.5rem" },
        }}
      >
        {Object.keys(canvas).map((ratioKey) => (
          <MenuItem
            key={ratioKey}
            onClick={() => handleSelectRatio(ratioKey)}
            selected={ratioKey === ratio}
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "1rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.4rem",
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
              <RatioDisplay ratioKey={ratioKey} />
            </Box>
            <Box sx={{ width: "3.5rem", textAlign: "left", fontSize: "1.2rem" }}>
              {canvas[ratioKey]?.style?.aspectRatio.replace(" / ", " : ")}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
