import { Box } from "@mui/material";
import { COLORS } from "@/data/color";

export default function ProfileImage({
  channel,
  isBoardered = false,
  imgSize = 46,
  borderSize = 8,
}) {
  const default_profile_img =
    "https://ssl.pstatic.net/static/nng/glive/image/default_profile_dark.png?type=f120_120_na";

  return (
    <Box
      sx={{
        width: imgSize + borderSize,
        height: imgSize + borderSize,
        borderRadius: "50%",
        flexShrink: 0,
        background:
          isBoardered || channel.isLive
            ? COLORS[channel.platform].profile
            : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: imgSize,
          height: imgSize,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: "0 0 0.6rem rgba(0,0,0,0.4)",
          backgroundColor: "rgba(20, 21, 23, 1)",
        }}
      >
        <img
          src={channel.imageUrl || default_profile_img}
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
