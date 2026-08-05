"use client";

import { useEffect, useRef, useCallback, useState, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChatRow from "@/components/View/Chat/ChatRow";
import CheeseChatRow from "@/components/View/Chat/CheeseChatRow";
import SuperChatRow from "@/components/View/Chat/SuperChatRow";
import BalloonChatRow from "@/components/View/Chat/BalloonChatRow";
import BitsChatRow from "@/components/View/Chat/BitsChatRow";
import { useTheme } from "@mui/material/styles";

export default function ChatView({ chatList, layoutKey }) {
  const scrollRef = useRef(null);
  const innerRef = useRef(null);
  const isAutoScrollEnabledRef = useRef(true);
  const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);
  const layoutChangingRef = useRef(false);
  const autoScrollingRef = useRef(false);
  const theme = useTheme();

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || autoScrollingRef.current || layoutChangingRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom < 5; // 약간의 여유 허용
    
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
    }, 100);
  }, []);

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (scrollEl && isAutoScrollEnabledRef.current) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
      
      if (!layoutChangingRef.current) {
        autoScrollingRef.current = true;
        requestAnimationFrame(() => {
          autoScrollingRef.current = false;
        });
      }
      
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
      
      // 즉시 스크롤
      scrollEl.scrollTop = scrollEl.scrollHeight;
      
      // 애니메이션 도중 여러 번 스크롤 시도 (0.25s 애니메이션 대응)
      const scrollInterval = setInterval(() => {
        if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
      }, 50);

      const timer = setTimeout(() => {
        layoutChangingRef.current = false;
        autoScrollingRef.current = false;
        clearInterval(scrollInterval);
        if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
      }, 600);
      
      return () => {
        clearTimeout(timer);
        clearInterval(scrollInterval);
      };
    }
  }, [layoutKey]);

  // 컨테이너 크기 변경 감지 (윈도우 리사이즈 등)
  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isAutoScrollEnabledRef.current || layoutChangingRef.current) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      }
    });

    resizeObserver.observe(scrollEl);
    return () => resizeObserver.disconnect();
  }, []);

  // Maintain bottom-anchored scroll position when content height changes (e.g. font size change)
  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    const innerEl = innerRef.current;
    if (!scrollEl || !innerEl) return;

    let prevHeight = innerEl.offsetHeight;

    const resizeObserver = new ResizeObserver(() => {
      if (autoScrollingRef.current || layoutChangingRef.current) return;

      const newHeight = innerEl.offsetHeight;
      const delta = newHeight - prevHeight;
      prevHeight = newHeight;

      if (delta !== 0 && isAutoScrollEnabledRef.current) {
        autoScrollingRef.current = true;
        scrollEl.scrollTop = scrollEl.scrollHeight;
        requestAnimationFrame(() => {
          autoScrollingRef.current = false;
        });
      }
    });

    resizeObserver.observe(innerEl);
    return () => resizeObserver.disconnect();
  }, []);

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
        <Box ref={innerRef}>
          {chatList.map((chat) =>
            chat.payAmount != null ? (
              <CheeseChatRow key={chat.uid} chat={chat} />
            ) : chat.superChat != null ? (
              <SuperChatRow key={chat.uid} chat={chat} />
            ) : chat.balloonAmount != null ? (
              <BalloonChatRow key={chat.uid} chat={chat} />
            ) : chat.bitsAmount != null ? (
              <BitsChatRow key={chat.uid} chat={chat} />
            ) : (
              <ChatRow key={chat.uid} chat={chat} />
            )
          )}
        </Box>
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
