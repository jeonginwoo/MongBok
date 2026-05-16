"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSetAtom, useAtomValue } from "jotai";
import { CHAT_MAX_COUNT, CHAT_RENDER_INTERVAL, channelsAtom } from "@/atoms/setting";
import { snackbarAtom } from "@/atoms/ui";
const REQUIRED_SERVER_VERSION = process.env.NEXT_PUBLIC_REQUIRED_SERVER_VERSION;

const nicknameColors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52B788",
];

export default function useYoutubeChat(channelId) {
  const [chatList, setChatList] = useState([]);
  const pendingChatListRef = useRef([]);
  const messageCounterRef = useRef(0); // 메시지 카운터로 고유 ID 생성
  const setSnackbar = useSetAtom(snackbarAtom);
  const versionCheckedRef = useRef(false);

  const [status, setStatus] = useState("idle"); // idle, loading, connected, disconnected, error
  const statusRef = useRef("idle");
  const [error, setError] = useState(null);
  const [retryBuster, setRetryBuster] = useState(0);

  const channels = useAtomValue(channelsAtom);
  const channelData = channels[channelId];
  const { liveVideoId, isLive, lastRefreshed } = channelData || {};

  const updateStatus = useCallback((newStatus) => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  }, []);

  const retry = useCallback(() => {
    setRetryBuster((prev) => prev + 1);
  }, []);

  const lastHandledRefreshRef = useRef(null);

  useEffect(() => {
    if (lastRefreshed && lastHandledRefreshRef.current !== lastRefreshed) {
      if (status === "disconnected" || status === "error") {
        retry();
      }
      lastHandledRefreshRef.current = lastRefreshed;
    }
  }, [lastRefreshed, status, retry]);

  // 채팅 메시지 변환
  const convertChat = useCallback((chatItem) => {
    if (!chatItem || !chatItem.author) {
      return null;
    }

    const userId = chatItem.author.channelId || chatItem.id;
    const colorIndex = userId
      .split("")
      .map((c) => c.charCodeAt(0))
      .reduce((a, b) => a + b, 0) % nicknameColors.length;
    const color = nicknameColors[colorIndex];

    let nickname = chatItem.author.channelName || chatItem.author.name || "Unknown";
    if (nickname.startsWith('@')) {
      nickname = nickname.substring(1);
    }

    let badges = [];
    if (chatItem.author.badge?.thumbnail?.url) {
      badges.push(chatItem.author.badge.thumbnail.url);
    }
    
    if (chatItem.isModerator) {
      badges.push("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%235E84F1' d='M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z'/%3E%3C/svg%3E");
    }
    
    if (chatItem.isVerified) {
      badges.push("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23909090' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E");
    }
    
    if (chatItem.author.badges && Array.isArray(chatItem.author.badges)) {
      const badgeUrls = chatItem.author.badges
        .map(badge => {
          if (badge.custom_thumbnail?.[0]?.url) return badge.custom_thumbnail[0].url;
          if (badge.thumbnail?.[0]?.url) return badge.thumbnail[0].url;
          if (badge.url) return badge.url;
          return null;
        })
        .filter(Boolean);
      badges = [...badges, ...badgeUrls];
    }

    let parsedMessage = [];
    const emojis = {};
    
    if (Array.isArray(chatItem.message)) {
      parsedMessage = chatItem.message.map((item) => {
        if (item.emojiText && (item.url || item.thumbnail)) {
          const emojiUrl = item.url || (Array.isArray(item.thumbnail) ? item.thumbnail[0]?.url : item.thumbnail);
          if (emojiUrl) {
            emojis[item.emojiText] = emojiUrl;
            return { type: "emoji", emojiKey: item.emojiText };
          }
        }
        if (item.text) {
          return { type: "text", text: item.text };
        }
        if (item.runs) {
          return { type: "text", text: item.runs.map(run => run.text || '').join('') };
        }
        return { type: "text", text: "" };
      });
    }
    else if (chatItem.message?.runs && Array.isArray(chatItem.message.runs)) {
      parsedMessage = chatItem.message.runs.map((run) => {
        if (run.emoji) {
          const emojiId = run.emoji.emoji_id || run.emoji.emojiId || run.text;
          const emojiUrl = run.emoji.image?.[0]?.url || 
                          run.emoji.thumbnails?.[0]?.url ||
                          run.emoji.thumbnail?.[0]?.url;
          
          if (emojiId && emojiUrl) {
            emojis[emojiId] = emojiUrl;
            return { type: "emoji", emojiKey: emojiId };
          }
        }
        return { type: "text", text: run.text || "" };
      });
    }
    else if (typeof chatItem.message === "string") {
      parsedMessage = [{ type: "text", text: chatItem.message }];
    }

    messageCounterRef.current += 1;
    const uniqueId = `${userId}-${chatItem.timestamp || Date.now()}-${messageCounterRef.current}`;

    return {
      uid: uniqueId,
      time: chatItem.timestamp || Date.now(),
      userId,
      nickname: nickname,
      badges: badges,
      color,
      emojis,
      message: parsedMessage,
      isOwner: chatItem.isOwner || false,
      isModerator: chatItem.isModerator || false,
      ...(chatItem.superchat && {
        superChat: {
          amount: chatItem.superchat.amount,
          color: chatItem.superchat.color,
        },
      }),
    };
  }, []);

  // WebSocket으로 채팅 수신 (별도 서버 사용)
  useEffect(() => {
    if (!liveVideoId || !isLive) {
      if (statusRef.current !== "connected") {
        if (!isLive) {
          updateStatus("offline");
        } else {
          updateStatus("loading");
        }
      }
      return;
    }
    
    let isCurrent = true;
    const isSeamless = statusRef.current === "connected";
    messageCounterRef.current = 0;
    pendingChatListRef.current = [];

    const wsUrl = process.env.NEXT_PUBLIC_YOUTUBE_CHAT_WS_URL || 'ws://localhost:47200';

    let ws = null;
    let reconnectTimeout = null;
    let isIntentionallyClosed = false;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        if (!isSeamless) {
          updateStatus("loading");
        }

        ws.onopen = () => {
          if (!isCurrent) return;
          console.log("✅ [YouTube] 채팅 연결 성공");
          ws.send(JSON.stringify({ type: 'start', liveId: liveVideoId }));
          updateStatus("connected");
          setError(null);
          if (!versionCheckedRef.current) {
            versionCheckedRef.current = true;
            const httpUrl = wsUrl.replace(/^ws(s?):\/\//, "http$1://");
            fetch(`${httpUrl}/health`)
              .then((r) => r.json())
              .then((data) => {
                if (data.version !== REQUIRED_SERVER_VERSION) {
                  setSnackbar({
                    open: true,
                    message: `유튜브 채팅 서버 버전이 맞지 않습니다. (현재: ${data.version ?? "알 수 없음"} / 필요: ${REQUIRED_SERVER_VERSION}) 최신 버전으로 업데이트해주세요.`,
                    severity: "warning",
                  });
                }
              })
              .catch(() => {});
          }
        };

        ws.onmessage = (event) => {
          if (!isCurrent) return;
          try {
            const message = JSON.parse(event.data);
            if (message.type === "chat") {
              const chat = convertChat(message.data);
              if (chat) {
                pendingChatListRef.current.push(chat);
              }
            } else if (message.type === "error") {
              console.error("❌ [YouTube] 채팅 에러:", message.error);
              setError(message.error);
              updateStatus("error");
            }
          } catch (error) {
            console.error("❌ [YouTube] 메시지 파싱 실패:", error);
          }
        };

        ws.onerror = (error) => {
          if (!isCurrent) return;
          console.error("❌ [YouTube] 연결 에러:", error);
          setError("WebSocket error");
          updateStatus("error");
        };

        ws.onclose = () => {
          if (!isCurrent) return;
          if (!isIntentionallyClosed && liveVideoId) {
            updateStatus("disconnected");
          }
        };
      } catch (error) {
        if (!isCurrent) return;
        console.error("❌ [YouTube] 연결 실패:", error);
        setError("Connection failed");
        updateStatus("error");
      }
    };

    connect();

    return () => {
      isCurrent = false;
      isIntentionallyClosed = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'stop' }));
        }
        ws.close();
      }
    };
  }, [liveVideoId, isLive, convertChat, retryBuster]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      if (pendingChatListRef.current.length > 0) {
        const chatsToRender = pendingChatListRef.current.splice(0);
        setChatList((prev) => [...prev, ...chatsToRender].slice(-CHAT_MAX_COUNT));
      }
    }, CHAT_RENDER_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { chatList, status, error, retry };
}
