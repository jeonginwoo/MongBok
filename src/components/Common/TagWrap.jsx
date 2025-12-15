import React from "react";
import { Box } from "@mui/material";

const TagWrap = ({ 
  children, 
  color = "#888888ff",
  backgroundColor = "rgba(0, 0, 0, 0.2)",
  sx = {}
}) => {
  return (
    <Box
      sx={{
        padding: "0.4rem 0.6rem",
        fontWeight: "bold",
        fontSize: "1.2rem",
        borderRadius: "0.8rem",
        border: `0.23rem solid ${color}`,
        backgroundColor: backgroundColor,
        color: color,
        display: "inline-flex",
        alignItems: "center",
        lineHeight: 1,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default TagWrap;