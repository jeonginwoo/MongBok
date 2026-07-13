import { Box } from "@mui/material";
import Image from 'next/image';

const defaultProfileImg = "/chzzk/default_profile_dark.png";

export default function ProfileImage({
  channel,
  isBoardered = false,
  imgSize = 48,
  borderSize = 6,
  gapSize = 2, // 그라데이션 border와 이미지 사이 검은색 간격
}) {
  return (
    <Box
      sx={(theme) => ({
        width: imgSize + borderSize,
        height: imgSize + borderSize,
        borderRadius: "50%",
        flexShrink: 0,
        userSelect: "none",
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
          position: "relative",
          border: `${gapSize}px solid #000`,
          boxSizing: "border-box",
        })}
      >
        <Image
          src={
            (channel.imageUrl && channel.imageUrl.startsWith('//') ? 'https:' + channel.imageUrl : channel.imageUrl) ||
            defaultProfileImg
          }
          alt={`${channel.name || "channel"} profile`}
          fill
          draggable={false}
          style={{
            objectFit: "cover",
            userSelect: "none",
            WebkitUserDrag: "none",
            borderRadius: "50%",
          }}
        />
      </Box>
    </Box>
  );
}
