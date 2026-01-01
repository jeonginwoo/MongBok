import { Fragment, memo } from "react";
import urlRegexSafe from "url-regex-safe";
import CheeseIcon from "./CheeseIcon";
import Box from "@mui/material/Box";
import { CHEESE_COLORS } from "../../../data/color";

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
        gap: "4px",
        color: "white",
        fontSize: "1.5rem",
        background: `linear-gradient(270deg, rgba(0, 0, 0, 0.2), transparent),
    linear-gradient(180deg, hsla(0, 0%, 100%, 0.1), hsla(0, 0%, 100%, 0)), ${tierColor}`,
        boxShadow: "inset 1px 1px 1px 0 hsla(0, 0%, 100%, 0.1)",
        borderRadius: "8px",
        padding: "1rem 1.2rem 1.2rem 1.2rem",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box
          sx={{
            flex: 1,
            fontWeight: 1000,
            "& .badge": {
              height: "2rem",
              paddingTop: "0.2rem",
              paddingRight: "4px",
              verticalAlign: "top",
            },
          }}
        >
          {badges.length > 0 &&
            badges.map((src, i) => (
              <Box component="img" key={i} className="badge" alt="" src={src} />
            ))}
          <span>{nickname}</span>
        </Box>
      </Box>

      <Box
        sx={{
          lineHeight: "1.45em",
          textShadow: "black 0 0 1px",
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
            "& .emoji": {
              height: "1.8rem",
              verticalAlign: "top",
              marginRight: "1px",
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
                <Box
                  component="img"
                  className="emoji"
                  alt={part.emojiKey}
                  src={emojis[part.emojiKey]}
                />
              ) : null}
            </Fragment>
          ))}
        </Box>
      </Box>
      
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
    </Box>
  );
}

export default memo(CheeseChatRow);
