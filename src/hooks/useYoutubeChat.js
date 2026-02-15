"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { youtube_channel_client } from "@/api/client";

const nicknameColors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
  "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52B788",
];

const INTERNAL_MAX_LENGTH = 10000;

export default function useYoutubeChat(channelId) {
  const [chatList, setChatList] = useState([]);
  const [liveId, setLiveId] = useState(null);
  const pendingChatListRef = useRef([]);
  const animationFrameRef = useRef(null);
  const eventSourceRef = useRef(null);
  const messageCounterRef = useRef(0); // 메시지 카운터로 고유 ID 생성

  // 채널의 현재 라이브 videoId 가져오기
  useEffect(() => {
    if (!channelId) {
      setLiveId(null);
      return;
    }

    const fetchLiveId = async () => {
      try {
        const response = await youtube_channel_client.get(`/${channelId}`);
        const { liveVideo } = response.data;
        
        if (liveVideo?.id) {
          setLiveId(liveVideo.id);
        } else {
          setLiveId(null);
        }
      } catch (error) {
        console.error("❌ [YouTube] 라이브 ID 가져오기 실패:", error);
        setLiveId(null);
      }
    };

    fetchLiveId();
    // 30초마다 라이브 ID 갱신
    const interval = setInterval(fetchLiveId, 30000);
    
    return () => clearInterval(interval);
  }, [channelId]);

  // SSE로 채팅 수신
  useEffect(() => {
    if (!liveId) {
      return;
    }
    
    // 새로운 라이브 스트림이 시작되면 카운터 리셋
    messageCounterRef.current = 0;
    pendingChatListRef.current = [];

    // EventSource로 서버에서 채팅 스트림 받기
    const eventSource = new EventSource(`/api/youtube/chat/${liveId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "chat") {
          const chat = convertChat(message.data);
          if (chat) {
            pendingChatListRef.current = [
              ...pendingChatListRef.current,
              chat,
            ].slice(-1 * INTERNAL_MAX_LENGTH);
          }
        } else if (message.type === "error") {
          console.error("❌ [YouTube] 채팅 에러:", message.error);
        }
      } catch (error) {
        console.error("❌ [YouTube] 메시지 파싱 실패:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("❌ [YouTube] SSE 연결 에러:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [liveId]);

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

    // 닉네임 처리: channelName이 없으면 name에서 @ 제거
    let nickname = chatItem.author.channelName || chatItem.author.name || "Unknown";
    
    // @ 기호로 시작하면 제거
    if (nickname.startsWith('@')) {
      nickname = nickname.substring(1);
    }

    // 배지 처리
    const badges = chatItem.author.badge?.thumbnail || [];

    // 메시지 파싱
    let parsedMessage = [];
    
    if (Array.isArray(chatItem.message)) {
      // 메시지가 배열인 경우 (텍스트와 이모지 혼합)
      parsedMessage = chatItem.message.map((item) => {
        if (item.emojiText && item.thumbnail) {
          return {
            type: "emoji",
            emojiKey: item.emojiText,
            url: item.thumbnail[0]?.url || "",
          };
        } else {
          return { type: "text", text: item.text || "" };
        }
      });
    } else if (typeof chatItem.message === "string") {
      // 단순 문자열인 경우
      parsedMessage = [{ type: "text", text: chatItem.message }];
    }

    // 이모지 맵 생성
    const emojis = {};
    if (Array.isArray(chatItem.message)) {
      chatItem.message.forEach((item) => {
        if (item.emojiText && item.thumbnail?.[0]?.url) {
          emojis[item.emojiText] = item.thumbnail[0].url;
        }
      });
    }

    // 고유한 ID 생성 (userId + timestamp + counter)
    messageCounterRef.current += 1;
    const uniqueId = `${userId}-${chatItem.timestamp || Date.now()}-${messageCounterRef.current}`;

    return {
      uid: uniqueId,
      time: chatItem.timestamp || Date.now(),
      userId,
      nickname: nickname,
      badges: Array.isArray(badges) ? badges : [],
      color,
      emojis,
      message: parsedMessage,
    };
  }, []);

  // 채팅 리스트 업데이트 (애니메이션 프레임 사용)
  useEffect(() => {
    const updateChatList = () => {
      if (pendingChatListRef.current.length > 0) {
        setChatList(pendingChatListRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateChatList);
    };

    animationFrameRef.current = requestAnimationFrame(updateChatList);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return chatList;
}
