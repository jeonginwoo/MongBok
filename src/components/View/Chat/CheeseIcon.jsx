import { memo } from "react";
import Box from "@mui/material/Box";

function CheeseIcon() {
  return (
    <Box
      component="img"
      src="https://ssl.pstatic.net/static/nng/glive/icon/cheese01.png"
      alt="Cheese"
      sx={{
        height: "2rem",
        verticalAlign: "top",
        padding: "0.2rem 0.4rem 0 0",
      }}
    />
  );
}

export default memo(CheeseIcon);