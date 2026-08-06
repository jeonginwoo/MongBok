"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { CHAT_MAX_COUNT, CHAT_RENDER_INTERVAL, channelsAtom } from "@/atoms/setting";
import { makeChannelKey } from "@/utils/channelKey";

const nicknameColors = [
  "#ECA843", "#EEA05D", "#EA723D", "#EAA35F", "#E98158", "#E97F58",
  "#E76D53", "#E66D5F", "#E56B79", "#E16490", "#E481AE", "#E68199",
  "#DC5E9A", "#E16CB5", "#D25FAC", "#D263AE", "#D66CB4", "#D071B6",
  "#BA82BE", "#AF71B5", "#A96BB2", "#905FAA", "#B38BC2", "#9D78B8",
  "#8D7AB8", "#7F68AE", "#9F99C8", "#717DC6", "#5E7DCC", "#5A90C0",
  "#628DCC", "#7994D0", "#81A1CA", "#ADD2DE", "#80BDD3", "#83C5D6",
  "#8BC8CB", "#91CBC6", "#83C3BB", "#7DBFB2", "#AAD6C2", "#84C194",
  "#B3DBB4", "#92C896", "#94C994", "#9FCE8E", "#A6D293", "#ABD373",
  "#BFDE73", "#CCE57D",
];

const emojiRegex = /{:([a-zA-Z0-9_]+):}/;

const OWNER_USER_ROLE_CODE = "streamer";
const MANAGER_USER_ROLE_CODES = ["streaming_chat_manager", "streaming_channel_manager"];

function splitWithSpace(message) {
  return message
    .split(/([^ ]+)/)
    .filter((part) => part !== "")
    .map((part) => ({ type: "text", text: part }));
}

const ChatCmd = {
  PING: 0,
  PONG: 10000,
  CONNECT: 100,
  RECENT_CHAT: 15101,
  CHAT: 93101,
  CHEESE_CHAT: 93102,
  BLIND: 94008,
};

const MessageTypeCode = {
  CHAT: 1,
  CHEESE_CHAT: 10,
};

export default function useChzzkChat(channelId) {
  const [chatList, setChatList] = useState([]);
  const pendingChatListRef = useRef([]);
  const isUnloadingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const [webSocketBuster, setWebSocketBuster] = useState(0);
  const messageCounterRef = useRef(0); // 메시지 카운터로 고유 ID 생성

  const [status, setStatus] = useState("idle"); // idle, loading, connected, disconnected, error
  const statusRef = useRef("idle");
  const [error, setError] = useState(null);

  const channels = useAtomValue(channelsAtom);
  const channelData = channels[makeChannelKey("chzzk", channelId)];
  const { chatChannelId, accessToken, isLive, lastRefreshed } = channelData || {};

  const updateStatus = useCallback((newStatus) => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  }, []);

  const retry = useCallback(() => {
    setWebSocketBuster(Date.now());
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

  const convertChat = useCallback((chzzkChat) => {
    const profile = JSON.parse(chzzkChat.profile || "{}");
    const extras = JSON.parse(chzzkChat.extras || "{}");
    const nickname = profile.nickname || "익명의 후원자";

    const isOwner = profile.userRoleCode === OWNER_USER_ROLE_CODE;
    const isManager = MANAGER_USER_ROLE_CODES.includes(profile.userRoleCode);
    
    const roleBadge = profile.badge?.imageUrl;
    const subscriptionBadge =
      profile.streamingProperty?.subscription?.badge.imageUrl;
    const otherBadges = profile.viewerBadges?.map(({ badge }) => badge.imageUrl) ?? [];

    const badges = [
      roleBadge,
      subscriptionBadge,
      ...otherBadges,
    ].filter((badge) => badge != null);

    const color =
      profile.title?.color ??
      nicknameColors[
        `${profile.userIdHash}${chzzkChat.cid}`
          .split("")
          .map((c) => c.charCodeAt(0))
          .reduce((a, b) => a + b, 0) % nicknameColors.length
      ];
    const emojis = typeof extras.emojis !== "string" ? extras.emojis : {};
    const message = chzzkChat.msg || "";
    const match = message.match(emojiRegex);

    const messageColor = (isOwner || isManager) ? color : undefined;

    // 고유한 ID 생성 (userId + msgTime + counter)
    messageCounterRef.current += 1;
    const uniqueId = `${profile.userIdHash}-${chzzkChat.msgTime}-${messageCounterRef.current}`;

    const chatObject = {
      uid: uniqueId,
      time: chzzkChat.msgTime,
      userId: profile.userIdHash,
      nickname,
      badges,
      color,
      emojis,
      message: match
        ? message
            .split(emojiRegex)
            .flatMap((part, i) =>
              i % 2 === 0
                ? splitWithSpace(part)
                : [{ type: "emoji", emojiKey: part }]
            )
        : splitWithSpace(message),
      messageColor,
    };

    if (extras.payAmount != null) {
      chatObject.payAmount = extras.payAmount;
    }

    return chatObject;
  }, []);

  useEffect(() => {
    if (!channelId) {
      updateStatus("idle");
      setError(null);
      return;
    }

    if (!chatChannelId || !accessToken) {
      // 이미 연결된 상태에서 메타데이터가 잠깐 비는 경우 status를 loading으로 바꾸지 않음 (깜빡임 방지)
      if (statusRef.current !== "connected") {
        if (isLive === false) {
          updateStatus("offline");
        } else {
          updateStatus("loading");
        }
      }
      return;
    }

    let isCurrent = true;
    // 이미 연결된 상태라면 로딩창을 띄우지 않고 백그라운드에서 교체 (심리스 연결)
    const isSeamless = statusRef.current === "connected";
    const ws = new WebSocket("wss://kr-ss1.chat.naver.com/chat");
    
    if (!isSeamless) {
      updateStatus("loading");
    }

    const worker = new Worker(
      URL.createObjectURL(
        new Blob(
          [
            `
            let timeout = null

            onmessage = (e) => {
              if (e.data === "startPingTimer") {
                if (timeout != null) {
                  clearTimeout(timeout)
                }
                timeout = setTimeout(function reservePing() {
                  postMessage("ping")
                  timeout = setTimeout(reservePing, 20000)
                }, 20000)
              }
              if (e.data === "stop") {
                if (timeout != null) {
                  clearTimeout(timeout)
                }
              }
            }
            `,
          ],
          { type: "application/javascript" }
        )
      )
    );

    worker.onmessage = (e) => {
      if (e.data === "ping") {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ ver: "2", cmd: ChatCmd.PING }));
        }
      }
    };

    ws.onopen = () => {
      if (!isCurrent) return;
      ws.send(
        JSON.stringify({
          bdy: {
            accTkn: accessToken,
            auth: "READ",
            devType: 2001,
            uid: null,
          },
          cmd: ChatCmd.CONNECT,
          tid: 1,
          cid: chatChannelId,
          svcid: "game",
          ver: "2",
        })
      );
      isRefreshingRef.current = false;
      updateStatus("connected");
      setError(null);
    };

    ws.onclose = () => {
      if (!isCurrent) return;
      if (!isUnloadingRef.current && !isRefreshingRef.current) {
        updateStatus("disconnected");
      }
    };

    ws.onerror = () => {
      if (!isCurrent) return;
      updateStatus("error");
      setError("WebSocket error");
    };

    ws.onmessage = (event) => {
      if (!isCurrent) return;

      // 에러 상태였더라도 메시지가 들어오면 연결된 것으로 간주하고 상태 복구 (Self-healing)
      if (statusRef.current === "error" || statusRef.current === "disconnected") {
        updateStatus("connected");
        setError(null);
      }

      const json = JSON.parse(event.data);

      switch (json.cmd) {
        case ChatCmd.PING:
          ws.send(JSON.stringify({ ver: "2", cmd: ChatCmd.PONG }));
          break;
        case ChatCmd.CONNECT:
          worker.postMessage("startPingTimer");
          break;
        case ChatCmd.CHAT:
        case ChatCmd.CHEESE_CHAT: {
          worker.postMessage("startPingTimer");
          const newChats = json.bdy
            .filter((chat) => {
              if (chat.msgStatusType === "HIDDEN") return false;
              if (
                chat.msgTypeCode !== MessageTypeCode.CHAT &&
                chat.msgTypeCode !== MessageTypeCode.CHEESE_CHAT
              ) {
                return false;
              }
              if (chat.msgTypeCode === MessageTypeCode.CHEESE_CHAT) {
                const extras = JSON.parse(chat.extras || "{}");
                if (extras.donationType !== "CHAT") return false;
              }
              return true;
            })
            .map(convertChat);

          pendingChatListRef.current.push(...newChats);
          break;
        }
        case ChatCmd.BLIND:
          worker.postMessage("startPingTimer");
          break;
      }
    };

    worker.postMessage("startPingTimer");

    return () => {
      isCurrent = false;
      isRefreshingRef.current = true;
      worker.postMessage("stop");
      worker.terminate();
      ws.close();
    };
  }, [channelId, chatChannelId, accessToken, convertChat, webSocketBuster]);

  useEffect(() => {
    return () => {
      isUnloadingRef.current = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      if (pendingChatListRef.current.length > 0) {
        const chatsToRender = pendingChatListRef.current.splice(0);
        setChatList((prev) => [...prev, ...chatsToRender].slice(-CHAT_MAX_COUNT));
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return { chatList, status, error, retry };
}
