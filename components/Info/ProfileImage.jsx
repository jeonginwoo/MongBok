import { Box } from "@mui/material";

export default function ProfileImage({
  channel,
  isBoardered = false,
  imgSize = 48,
  borderSize = 6,
}) {
  const default_profile_img = "chzzk/default_profile.png";

  return (
    <Box
      sx={(theme) => ({
        width: imgSize + borderSize,
        height: imgSize + borderSize,
        borderRadius: "50%",
        flexShrink: 0,
        background:
          isBoardered || channel.isLive
            ? theme.palette.platform[channel.platform].profile
            : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Box
        sx={(theme) => ({
          width: imgSize,
          height: imgSize,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: `0 0 0.6rem ${theme.palette.background.overlay}`,
          backgroundColor: "background.profile",
        })}
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
