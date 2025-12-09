import React from "react";
import { Box } from "@mui/material";

const TagWrap = ({ 
  children, 
  color = "#888888ff",
  borderColor,
  backgroundColor = "rgba(0, 0, 0, 0.2)",
  sx = {}
}) => {
  return (
    <Box
      sx={{
        padding: "3px 6px",
        fontWeight: "bold",
        fontSize: "0.75rem",
        borderRadius: "8px",
        border: `2px solid ${borderColor || color}`,
        backgroundColor: backgroundColor,
        color: color,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default TagWrap;