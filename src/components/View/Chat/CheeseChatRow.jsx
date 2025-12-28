import { Fragment, memo } from "react";
import urlRegexSafe from "url-regex-safe";
import CheeseIcon from "./CheeseIcon";
import Box from "@mui/material/Box";

function CheeseChatRow({ chat }) {
  const { time, nickname, badges, emojis, message, payAmount } = chat;

  const tier = (() => {
    if (payAmount === 0) {
      return "tier0";
    } else if (payAmount >= 1000000) {
      return "tier4";
    } else if (payAmount >= 100000) {
      return "tier3";
    } else if (payAmount >= 10000) {
      return "tier2";
    } else {
      return "tier1";
    }
  })();

  return (
    <Box className={`cheese-chat-row ${tier}`} sx={{ mt: "0.8rem" }}>
      <Box className="content">
        <Box component="span" className="message">
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
                <img
                  className="emoji"
                  alt={part.emojiKey}
                  src={emojis[part.emojiKey]}
                />
              ) : null}
            </Fragment>
          ))}
        </Box>
      </Box>
      <Box className="footer">
        <Box className="nickname">
          {badges.length > 0 &&
            badges.map((src, i) => (
              <img key={i} className="badge" alt="" src={src} />
            ))}
          <span>{nickname}</span>
        </Box>
        <Box className="cheese">
          <CheeseIcon />
          {payAmount.toLocaleString("ko-KR")}
        </Box>
      </Box>
    </Box>
  );
}

export default memo(CheeseChatRow);
