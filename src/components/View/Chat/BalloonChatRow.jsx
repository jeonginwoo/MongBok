import { Fragment, memo } from "react";
import urlRegexSafe from "url-regex-safe";
import Box from "@mui/material/Box";
import Image from "next/image";
import { getBalloonColor } from "@/data/color";

function BalloonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="white"
      style={{
        verticalAlign: "top",
        padding: "0.2rem 0.4rem 0 0",
        flexShrink: 0,
      }}
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
    </svg>
  );
}

// SOOP 별풍선 고정 색상
function BalloonChatRow({ chat }) {
  const { nickname, badges, emojis, message, balloonAmount } = chat;
  const color = getBalloonColor(balloonAmount);

  const hasMessage =
    message &&
    message.some(
      (part) =>
        (part.type === "text" && part.text.trim()) || part.type === "emoji"
    );

  return (
    <Box
      sx={{
        mt: "0.4rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.4em",
        color: "white",
        fontSize: "1.5em",
        background: `linear-gradient(270deg, rgba(0, 0, 0, 0.2), transparent),
    linear-gradient(180deg, hsla(0, 0%, 100%, 0.1), hsla(0, 0%, 100%, 0)), ${color}`,
        boxShadow: "inset 0.1em 0.1em 0.1em 0 hsla(0, 0%, 100%, 0.1)",
        borderRadius: "0.8em",
        padding: "1em 1.2em 1em 1.2em",
      }}
    >
      {/* 닉네임 + 배지 */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ flex: 1, fontWeight: 1000 }}>
          {badges.length > 0 &&
            badges.map((src, i) => (
              <Box
                key={i}
                sx={{
                  position: "relative",
                  width: "1.34em",
                  height: "1.34em",
                  display: "inline-block",
                  verticalAlign: "top",
                  paddingTop: "0.2em",
                  marginRight: "0.27em",
                }}
              >
                <Image
                  className="badge"
                  alt=""
                  src={src}
                  fill
                  unoptimized
                  style={{ objectFit: "contain" }}
                />
              </Box>
            ))}
          <span>{nickname}</span>
        </Box>
      </Box>

      {/* 메시지 */}
      {hasMessage && (
        <Box sx={{ lineHeight: "1.45em", textShadow: "black 0 0 0.1rem" }}>
          <Box
            component="span"
            sx={{
              fontWeight: 700,
              "& a": {
                color: "inherit",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              },
            }}
          >
            {message.map((part, i) => (
              <Fragment key={i}>
                {part.type === "text" ? (
                  urlRegexSafe({ exact: true }).test(part.text) ? (
                    <a
                      href={part.text.startsWith("http") ? part.text : `https://${part.text}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {part.text}
                    </a>
                  ) : (
                    <>{part.text}</>
                  )
                ) : part.type === "emoji" && emojis[part.emojiKey] ? (
                  <Image
                    className="emoji"
                    alt={part.emojiKey}
                    src={emojis[part.emojiKey]}
                    width={18}
                    height={18}
                    unoptimized
                    style={{ verticalAlign: "top", marginRight: "0.1rem" }}
                  />
                ) : null}
              </Fragment>
            ))}
          </Box>
        </Box>
      )}

      {/* 별풍선 개수 */}
      <Box sx={{ mt: "0.2em", display: "flex", alignItems: "center" }}>
        <Box
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.15)",
            borderRadius: "1.3em",
            padding: "0.3em 0.8em 0.2em 0.6em",
            fontWeight: "bold",
            fontSize: "1em",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            lineHeight: 1,
          }}
        >
          <BalloonIcon />
          {balloonAmount.toLocaleString("ko-KR")}
        </Box>
      </Box>
    </Box>
  );
}

export default memo(BalloonChatRow);
