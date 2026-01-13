import { Fragment, memo } from "react";
import urlRegexSafe from "url-regex-safe";
import CheeseIcon from "./CheeseIcon";
import Box from "@mui/material/Box";
import { CHEESE_COLORS } from "@/data/color";
import Image from "next/image";

function CheeseChatRow({ chat }) {
  const { nickname, badges, emojis, message, payAmount } = chat;

  const tier = (() => {
    if (payAmount === 0) {
      return "tier0";
    } else if (payAmount >= 1000000) {
      return "tier5";
    } else if (payAmount >= 500000) {
      return "tier4";
    } else if (payAmount >= 100000) {
      return "tier3";
    } else if (payAmount >= 10000) {
      return "tier2";
    } else {
      return "tier1";
    }
  })();

  const tierColor = CHEESE_COLORS[tier] || CHEESE_COLORS.tier0;

  return (
    <Box
      sx={{
        mt: "0.8rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        color: "white",
        fontSize: "1.5rem",
        background: `linear-gradient(270deg, rgba(0, 0, 0, 0.2), transparent),
    linear-gradient(180deg, hsla(0, 0%, 100%, 0.1), hsla(0, 0%, 100%, 0)), ${tierColor}`,
        boxShadow: "inset 0.1rem 0.1rem 0.1rem 0 hsla(0, 0%, 100%, 0.1)",
        borderRadius: "0.8rem",
        padding: "1rem 1.2rem 1.2rem 1.2rem",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box
          sx={{
            flex: 1,
            fontWeight: 1000,
          }}
        >
          {badges.length > 0 &&
            badges.map((src, i) => (
              <Box key={i} sx={{ position: 'relative', width: '2rem', height: '2rem', display: 'inline-block', verticalAlign: 'top', paddingTop: '0.2rem', paddingRight: '0.4rem' }}>
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
            ))}
          <span>{nickname}</span>
        </Box>
      </Box>

      <Box
        sx={{
          lineHeight: "1.45em",
          textShadow: "black 0 0 0.1rem",
        }}
      >
        <Box
          component="span"
          sx={{
            fontWeight: 700,
            "& a": {
              color: "inherit",
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            },
          }}
        >
          {message.map((part, i) => (
            <Fragment key={i}>
              {part.type === "text" ? (
                urlRegexSafe({ exact: true }).test(part.text) ? (
                  <a
                    href={
                      part.text.startsWith("http")
                        ? part.text
                        : `https://${part.text}`
                    }
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
                  style={{
                    verticalAlign: "top",
                    marginRight: "0.1rem",
                  }}
                />
              ) : null}
            </Fragment>
          ))}
        </Box>
      </Box>
      
      {payAmount > 0 && (
        <Box
          sx={{
            mt: "0.3rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              backgroundColor: "rgba(0, 0, 0, 0.15)",
              borderRadius: "1.3rem",
              padding: "0.2rem 0.8rem 0.4rem 0.6rem",
              fontWeight: 800,
              fontSize: "1.4rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              lineHeight: 1,
            }}
          >
            <CheeseIcon />
            {payAmount.toLocaleString("ko-KR")}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default memo(CheeseChatRow);
