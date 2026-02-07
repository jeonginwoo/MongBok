"use client";

import { useEffect, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import ChatRow from "./ChatRow";
import CheeseChatRow from "./CheeseChatRow";
import { useTheme } from "@mui/material/styles";

export default function ChatView({ chatList }) {
  const scrollRef = useRef(null);
  const isAutoScrollEnabledRef = useRef(true);
  const theme = useTheme();

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // When user scrolls up, disable auto-scroll. Re-enable when they scroll back to the bottom.
    isAutoScrollEnabledRef.current = scrollHeight - scrollTop - clientHeight < 1;
  }, []);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl && isAutoScrollEnabledRef.current) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, [chatList]);

  return (
    <Box
      ref={scrollRef}
      onScroll={handleScroll}
      sx={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        p: "1em 1.8em",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        backgroundColor: theme.palette.background.chat,
        color: theme.palette.text.primary,
        "&::-webkit-scrollbar": {
          width: "0.4em",
        },
        "&::-webkit-scrollbar-track": {
          boxShadow: "inset 0 0 0.6rem rgba(0,0,0,0.00)",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: theme.palette.scrollbar.thumb,
          outline: "0.1rem solid slategrey",
        },
      }}
    >
      {chatList.map((chat) =>
        chat.payAmount != null ? (
          <CheeseChatRow key={chat.uid} chat={chat} />
        ) : (
          <ChatRow key={chat.uid} chat={chat} />
        )
      )}
    </Box>
  );
}
