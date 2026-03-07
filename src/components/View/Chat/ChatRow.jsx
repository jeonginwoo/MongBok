import Box from "@mui/material/Box";
import { Fragment } from "react";
import urlRegexSafe from "url-regex-safe";
import { useTheme } from "@mui/material/styles";
import Image from "next/image";

export default function ChatRow({ chat }) {
  const { time, nickname, badges, color, emojis, message, messageColor, isOwner, isModerator } = chat;
  const theme = useTheme();

  return (
    <Box
      className="chat-row"
      sx={{
        lineHeight: 1.4,
        wordWrap: "break-word",
        color: theme.palette.text.primary,
        fontSize: "1.6em",
        marginTop: "0.6em",
        // 채널 주인일 때 노란색 배경
        ...(isOwner && {
          backgroundColor: 'rgba(255, 213, 0, 0.15)',
          padding: '0.4em 0.6em',
          borderRadius: '4px',
          marginLeft: '-0.6em',
          marginRight: '-0.6em',
        }),
      }}
    >
      {badges.map((src, i) => {
        const isSoopSubscriptionBadge = src.startsWith('https://stimg.afreecatv.com/HASH/subscribecn/');
        if (isSoopSubscriptionBadge) {
          return (
            <Box
              key={i}
              component="img"
              className="badge"
              alt=""
              src={src}
              sx={{
                width: '1.125em',
                height: '1.125em',
                objectFit: 'contain',
                borderRadius: '50%',
                display: 'inline-block',
                verticalAlign: 'middle',
                mr: '0.25em',
              }}
            />
          );
        }

        return (
          <Box
            key={i}
            sx={{
              position: 'relative',
              width: '1.125em',
              height: '1.125em',
              display: 'inline-block',
              verticalAlign: 'middle',
              mr: '0.25em',
            }}
          >
            <Image
              className="badge"
              alt=""
              src={src}
              fill
              unoptimized
              style={{
                objectFit: 'contain',
              }}
            />
          </Box>
        );
      })}
      <Box
        component="span"
        className="nickname"
        sx={{ 
          color, 
          verticalAlign: "middle", 
          pr: "0.8em",
          // 채널 주인일 때 글자 강조
          ...(isOwner && {
            fontWeight: 600,
            color: '#FFD500',
          }),
          // 매니저일 때 파란색
          ...(isModerator && !isOwner && {
            color: '#5E84F1',
          }),
        }}
      >
        {nickname}
      </Box>
      <Box component="span" className="message" sx={{ verticalAlign: "middle", color: isModerator ? '#5E84F1' : messageColor }}>
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
                unoptimized
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
                unoptimized
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
