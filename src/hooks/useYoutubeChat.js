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

  // 채팅 메시지 변환
  const convertChat = useCallback((chatItem) => {
    if (!chatItem || !chatItem.author) {
      return null;
    }

    // 디버깅: 실제 데이터 구조 확인
    if (process.env.NODE_ENV === 'development') {
      console.log('[YouTube Chat] Raw data:', JSON.stringify(chatItem, null, 2));
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
    let badges = [];
    
    // badge 객체가 있는 경우 (멤버십 배지 등)
    if (chatItem.author.badge?.thumbnail?.url) {
      badges.push(chatItem.author.badge.thumbnail.url);
    }
    
    // Owner 배지 (채널 소유자)
    if (chatItem.isOwner) {
      badges.push('https://www.gstatic.com/youtube/img/badges/verified_badge.svg');
    }
    
    // Moderator 배지
    if (chatItem.isModerator) {
      badges.push('https://www.gstatic.com/youtube/img/badges/moderator_badge.svg');
    }
    
    // Verified 배지
    if (chatItem.isVerified) {
      badges.push('https://www.gstatic.com/youtube/img/badges/verified_badge.svg');
    }
    
    // chazzy 스타일의 badges 배열이 있는 경우 (대체 데이터 소스)
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

    // 메시지 파싱
    let parsedMessage = [];
    const emojis = {};
    
    // youtube-chat 라이브러리의 실제 데이터 구조: message: [{text: "..."}, {emojiText: "...", url: "..."}]
    if (Array.isArray(chatItem.message)) {
      parsedMessage = chatItem.message.map((item) => {
        // 이모지인 경우 (url 또는 thumbnail 필드)
        if (item.emojiText && (item.url || item.thumbnail)) {
          const emojiUrl = item.url || (Array.isArray(item.thumbnail) ? item.thumbnail[0]?.url : item.thumbnail);
          if (emojiUrl) {
            emojis[item.emojiText] = emojiUrl;
            return { type: "emoji", emojiKey: item.emojiText };
          }
        }
        // 일반 텍스트인 경우
        if (item.text) {
          return { type: "text", text: item.text };
        }
        // runs 구조 (대체 형식)
        if (item.runs) {
          return { type: "text", text: item.runs.map(run => run.text || '').join('') };
        }
        return { type: "text", text: "" };
      });
    }
    // message.runs 구조 (youtubei.js 스타일)
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
    // 문자열 메시지
    else if (typeof chatItem.message === "string") {
      parsedMessage = [{ type: "text", text: chatItem.message }];
    }

    // 고유한 ID 생성 (userId + timestamp + counter)
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
    };
  }, []);

  // SSE로 채팅 수신 (서버 사이드에서 youtube-chat 실행)
  useEffect(() => {
    if (!liveId) {
      return;
    }
    
    // 새로운 라이브 스트림이 시작되면 카운터 리셋
    messageCounterRef.current = 0;
    pendingChatListRef.current = [];

    console.log(`🔄 [YouTube] SSE 연결 시작: liveId=${liveId}`);

    // EventSource로 서버에서 채팅 스트림 받기
    const eventSource = new EventSource(`/api/youtube/chat/${liveId}`);

    eventSource.onopen = () => {
      console.log("✅ [YouTube] SSE 연결 성공");
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "start") {
          console.log("✅ [YouTube] 채팅 시작:", message.id);
        } else if (message.type === "chat") {
          const chat = convertChat(message.data);
          if (chat) {
            pendingChatListRef.current = [
              ...pendingChatListRef.current,
              chat,
            ].slice(-1 * INTERNAL_MAX_LENGTH);
          }
        } else if (message.type === "error") {
          console.error("❌ [YouTube] 채팅 에러:", message.error);
        } else if (message.type === "end") {
          console.log("⏹️ [YouTube] 채팅 종료:", message.reason);
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
      console.log("🔌 [YouTube] SSE 연결 종료");
      eventSource.close();
    };
  }, [liveId, convertChat]);

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
