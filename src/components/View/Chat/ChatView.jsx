"use client";

import { useEffect, useRef, useCallback, useState, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChatRow from "./ChatRow";
import CheeseChatRow from "./CheeseChatRow";
import { useTheme } from "@mui/material/styles";

export default function ChatView({ chatList, layoutKey }) {
  const scrollRef = useRef(null);
  const isAutoScrollEnabledRef = useRef(true);
  const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);
  const layoutChangingRef = useRef(false);
  const autoScrollingRef = useRef(false);
  const theme = useTheme();

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || autoScrollingRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom < 2;
    
    isAutoScrollEnabledRef.current = isAtBottom;
    
    if (distanceFromBottom > 100) {
      setShowScrollToBottomButton(true);
    } else {
      setShowScrollToBottomButton(false);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return;
    autoScrollingRef.current = true;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    isAutoScrollEnabledRef.current = true;
    setShowScrollToBottomButton(false);
    setTimeout(() => {
      autoScrollingRef.current = false;
    }, 50);
  }, []);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl && isAutoScrollEnabledRef.current) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
      
      autoScrollingRef.current = true;
      requestAnimationFrame(() => {
        autoScrollingRef.current = false;
      });
      
    } else if (scrollEl && !isAutoScrollEnabledRef.current && !layoutChangingRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      if (distanceFromBottom > 100) {
        setShowScrollToBottomButton(true);
      }
    }
  }, [chatList]);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      layoutChangingRef.current = true;
      autoScrollingRef.current = true;
      setShowScrollToBottomButton(false);
      
      isAutoScrollEnabledRef.current = true;
      
      requestAnimationFrame(() => {
        if (scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight;
        }
      });
      
      const resizeObserver = new ResizeObserver(() => {
        if (layoutChangingRef.current && scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight;
        }
      });
      
      resizeObserver.observe(scrollEl);
      
      const timer = setTimeout(() => {
        layoutChangingRef.current = false;
        autoScrollingRef.current = false;
        resizeObserver.disconnect();
      }, 600);
      
      return () => {
        clearTimeout(timer);
        resizeObserver.disconnect();
      };
    }
  }, [layoutKey]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && scrollRef.current && isAutoScrollEnabledRef.current) {
        autoScrollingRef.current = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              setShowScrollToBottomButton(false);
              setTimeout(() => {
                autoScrollingRef.current = false;
              }, 50);
            }
          });
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
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
          backgroundColor: theme.palette.background.chat,
          color: theme.palette.text.primary,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        <Box sx={{ flexGrow: 1 }} />
        {chatList.map((chat) =>
          chat.payAmount != null ? (
            <CheeseChatRow key={chat.uid} chat={chat} />
          ) : (
            <ChatRow key={chat.uid} chat={chat} />
          )
        )}
      </Box>
      {showScrollToBottomButton && (
        <IconButton
          onClick={scrollToBottom}
          sx={{
            position: "absolute",
            bottom: "1.5em",
            right: "1.5em",
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            boxShadow: 3,
            "&:hover": {
              backgroundColor: theme.palette.primary.main,
            },
            zIndex: 10,
          }}
          size="small"
        >
          <KeyboardArrowDownIcon />
        </IconButton>
      )}
    </Box>
  );
}
