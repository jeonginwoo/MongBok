import Box from "@mui/material/Box";
import { Fragment } from "react";
import urlRegexSafe from "url-regex-safe";
import { useTheme } from "@mui/material/styles";

export default function ChatRow({ chat }) {
  const { time, nickname, badges, color, emojis, message } = chat;
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
        <Box
          key={i}
          component="img"
          className="badge"
          alt=""
          src={src}
          sx={{
            height: "1.8rem",
            verticalAlign: "middle",
            pr: "0.4rem",
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
      <Box component="span" className="message" sx={{ verticalAlign: "middle" }}>
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
              <Box
                component="img"
                className="emoji"
                alt={part.emojiKey}
                src={emojis[part.emojiKey]}
                sx={{
                  height: "2.1rem",
                  verticalAlign: "top",
                  mr: "0.1rem",
                }}
              />
            ) : part.type === "sticker" ? (
              <Box
                component="img"
                className="sticker"
                alt="sticker"
                src={part.url}
                sx={{
                  height: "4.8rem",
                  verticalAlign: "top",
                  my: "0.4rem",
                }}
              />
            ) : null}
          </Fragment>
        ))}
      </Box>
    </Box>
  );
}
