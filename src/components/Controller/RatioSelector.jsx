import React, { useState } from "react";
import { Box, Button, Menu, MenuItem } from "@mui/material";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import {
  ratioAtom,
  channelsAtom,
  layoutTypeAtom,
  viewCountAtom,
} from "@/atoms/setting";
import { canvas } from "@/data/layouts";

const getRatioConfig = (ratioKey) => {
  if (!ratioKey) return null;
  const [group, orientation] = ratioKey.split("-");
  if (!group || !orientation) return null;
  return canvas[group]?.[orientation] || null;
};

const RatioDisplay = ({ ratioConfig, sx }) => {
  const ratioValue = ratioConfig?.style?.aspectRatio;
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
        ...sx,
      }}
    />
  );
};

export default function RatioSelector() {
  const [ratio, setRatio] = useAtom(ratioAtom);
  const [layoutType, setLayoutType] = useAtom(layoutTypeAtom);
  const viewCount = useAtomValue(viewCountAtom);
  const setChannels = useSetAtom(channelsAtom);
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
    if (newRatioKey === ratio) {
      handleClose();
      return;
    }

    const newRatioConfig = getRatioConfig(newRatioKey);
    if (!newRatioConfig) return;

    // Case 1: Same viewCount and layoutType exist
    if (newRatioConfig.layouts?.[viewCount]?.[layoutType]) {
      setRatio(newRatioKey);
      window.localStorage.setItem("ratio", newRatioKey);
      handleClose();
      return;
    }

    // Case 2: Only same viewCount exists
    if (newRatioConfig.layouts?.[viewCount]) {
      setRatio(newRatioKey);
      window.localStorage.setItem("ratio", newRatioKey);
      setLayoutType("layout1");
      window.localStorage.setItem("layout", "layout1");
      handleClose();
      return;
    }

    // Case 3: viewCount doesn't exist
    setRatio(newRatioKey);
    window.localStorage.setItem("ratio", newRatioKey);
    setLayoutType("layout1");
    window.localStorage.setItem("layout", "layout1");

    setChannels((prevChannels) => {
      const newChannels = structuredClone(prevChannels);
      const channelToKeep =
        Object.values(newChannels).find((c) => c.zoneId === 1 && c.isVisible) ||
        Object.values(newChannels).find((c) => c.isVisible);

      let isFirstVisibleFound = false;
      if (channelToKeep) {
        Object.values(newChannels).forEach((channel) => {
          if (channel.id === channelToKeep.id) {
            channel.isVisible = true;
            channel.zoneId = 1;
            isFirstVisibleFound = true;
          } else {
            channel.isVisible = false;
            channel.zoneId = null;
          }
        });
      }

      if (!isFirstVisibleFound && Object.keys(newChannels).length > 0) {
        const firstChannelId = Object.keys(newChannels)[0];
        newChannels[firstChannelId].isVisible = true;
        newChannels[firstChannelId].zoneId = 1;
      }

      const channelsToSave = Object.fromEntries(
        Object.entries(newChannels).map(([id, channel]) => [
          id,
          { platform: channel.platform, zoneId: channel.zoneId },
        ])
      );

      window.localStorage.setItem("channels", JSON.stringify(channelsToSave));
      return newChannels;
    });

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
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "1rem",
            color: "primary.main",
            width: "100%",
            lineHeight: 1,
          }}
        >
          {currentRatioConfig?.style?.aspectRatio.replace(" / ", " : ")}
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
                    {config.style.aspectRatio.replace(" / ", " : ")}
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
