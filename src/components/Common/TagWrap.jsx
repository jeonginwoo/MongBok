import React from "react";
import { Box } from "@mui/material";

const TagWrap = ({ 
  children, 
  color,
  backgroundColor,
  sx = {}
}) => {
  return (
    <Box
      sx={(theme) => ({
        padding: "0.4rem 0.6rem",
        fontWeight: "bold",
        fontSize: "1.2rem",
        borderRadius: "0.8rem",
        border: `0.1rem solid ${color || theme.palette.tag.color}`,
        backgroundColor: backgroundColor || theme.palette.tag.background,
        color: color || theme.palette.tag.color,
        display: "inline-flex",
        alignItems: "center",
        lineHeight: 0,
        ...sx,
      })}
    >
      {children}
    </Box>
  );
};

export default TagWrap;