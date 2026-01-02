import { useCallback, useEffect, useRef, useState } from "react";

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

function useChzzkLiveStatus(channelId) {
  const [liveStatus, setLiveStatus] = useState(null);

  useEffect(() => {
    if (!channelId) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(
          `/api/chzzk/live/polling/v2/channels/${channelId}/live-status`
        );
        const data = await response.json();
        if (data.code === 200) {
          setLiveStatus(data.content);
        } else {
          setLiveStatus(null);
        }
      } catch (e) {
        console.error(e);
        setLiveStatus(null);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [channelId]);

  return liveStatus;
}

function useAccessToken(chatChannelId) {
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    if (!chatChannelId) {
      setAccessToken(null);
      return;
    }
    (async () => {
      try {
        const response = await fetch(
          `/api/chzzk/chat/nng_main/v1/chats/access-token?channelId=${chatChannelId}&chatType=STREAMING`
        );
        const data = await response.json();
        if (data.code === 200) {
          setAccessToken(data.content.accessToken);
        } else {
          setAccessToken(null);
        }
      } catch (e) {
        console.error(e);
        setAccessToken(null);
      }
    })();
  }, [chatChannelId]);

  return accessToken;
}

export default function useChzzkChat(channelId) {
  const [chatList, setChatList] = useState([]);
  const pendingChatListRef = useRef([]);
  const isUnloadingRef = useRef(false);
  const [webSocketBuster, setWebSocketBuster] = useState(0);

  const liveStatus = useChzzkLiveStatus(channelId);
  const chatChannelId = liveStatus?.chatChannelId;
  const accessToken = useAccessToken(chatChannelId);

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

    const chatObject = {
      uid: `${profile.userIdHash}-${chzzkChat.msgTime}`,
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
    if (!chatChannelId || !accessToken) {
      return;
    }

    isUnloadingRef.current = false;
    const ws = new WebSocket("wss://kr-ss1.chat.naver.com/chat");
    let pingInterval;

    ws.onopen = () => {
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
    };

    ws.onclose = () => {
      clearInterval(pingInterval);
      if (!isUnloadingRef.current) {
        setTimeout(() => setWebSocketBuster(Date.now()), 1000);
      }
    };

    ws.onmessage = (event) => {
      const json = JSON.parse(event.data);

      switch (json.cmd) {
        case ChatCmd.PING:
          ws.send(JSON.stringify({ ver: "2", cmd: ChatCmd.PONG }));
          break;
        case ChatCmd.CONNECT:
            pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ ver: "2", cmd: ChatCmd.PING }));
                }
            }, 20000);
          break;
        case ChatCmd.CHAT:
        case ChatCmd.CHEESE_CHAT: {
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
          break;
      }
    };

    return () => {
      isUnloadingRef.current = true;
      ws.close();
      clearInterval(pingInterval);
    };
  }, [chatChannelId, accessToken, convertChat, webSocketBuster]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      if (pendingChatListRef.current.length > 0) {
        const chatsToRender = pendingChatListRef.current.splice(0);
        setChatList((prev) => [...prev, ...chatsToRender].slice(-100));
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return chatList;
}