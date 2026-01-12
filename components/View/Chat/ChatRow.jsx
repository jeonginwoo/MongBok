import Box from "@mui/material/Box";
import { Fragment } from "react";
import urlRegexSafe from "url-regex-safe";
import { useTheme } from "@mui/material/styles";
import Image from "next/image";

export default function ChatRow({ chat }) {
  const { time, nickname, badges, color, emojis, message, messageColor } = chat;
  const theme = useTheme();

  return (
    <Box
      className="chat-row"
      sx={{
        lineHeight: 1.4,
        wordWrap: "break-word",
        color: theme.palette.text.primary,
        fontSize: "1.6rem",
        marginTop: "0.8rem",
      }}
    >
      {badges.map((src, i) => (
        <Image
          key={i}
          className="badge"
          alt=""
          src={src}
          width={18}
          height={18}
          style={{
            verticalAlign: "middle",
            paddingRight: "0.4rem",
          }}
        />
      ))}
      <Box
        component="span"
        className="nickname"
        sx={{ color, verticalAlign: "middle", pr: "0.8rem" }}
      >
        {nickname}
      </Box>
      <Box component="span" className="message" sx={{ verticalAlign: "middle", color: messageColor }}>
        {message.map((part, i) => (
          <Fragment key={i}>
            {part.type === "text" ? (
              part.text.split(/(\n)/).map((line, index) => (
                <Fragment key={index}>
                  {index % 2 === 0 ? (
                    urlRegexSafe({ exact: true }).test(line) ? (
                      <a
                        href={line.startsWith("http") ? line : `https://${line}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {line}
                      </a>
                    ) : (
                      line
                    )
                  ) : (
                    <br />
                  )}
                </Fragment>
              ))
            ) : part.type === "emoji" && emojis[part.emojiKey] ? (
              <Image
                className="emoji"
                alt={part.emojiKey}
                src={emojis[part.emojiKey]}
                width={21}
                height={21}
                style={{
                  verticalAlign: "top",
                  marginRight: "0.1rem",
                }}
              />
            ) : part.type === "sticker" ? (
              <Image
                className="sticker"
                alt="sticker"
                src={part.url}
                width={48}
                height={48}
                style={{
                  verticalAlign: "top",
                  marginTop: "0.4rem",
                  marginBottom: "0.4rem",
                }}
              />
            ) : null}
          </Fragment>
        ))}
      </Box>
    </Box>
  );
}
