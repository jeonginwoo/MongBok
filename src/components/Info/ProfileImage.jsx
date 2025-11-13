import { Box } from "@mui/material";
import { COLORS } from "@/data/color";

export default function ProfileImage({ channel }) {

  return (
    <Box
      sx={{
        width: 54, // border 두께만큼 크게
        height: 54,
        borderRadius: "50%",
        flexShrink: 0,
        background: channel.isLive
          ? COLORS[channel.platform].gradient
          : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: "0 0 6px rgba(0,0,0,0.4)",
          backgroundColor: "#141517",
        }}
      >
        <img
          src={channel.imageUrl}
          alt={`${channel.name || "channel"} profile`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>
    </Box>
  );
}
