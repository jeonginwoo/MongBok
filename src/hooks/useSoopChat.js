import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const nicknameColors = [
  "#E04949", "#CD5D5D", "#DB6743", "#CF8362", "#D39750", "#C4A557",
  "#97A65B", "#36A624", "#63B566", "#45A48D", "#58A6B7", "#6CABCF",
  "#288ED8", "#5C82E3", "#6F6DD6", "#9568CD", "#B477CA", "#D15ED3",
  "#CF5F9B", "#C279A1",
];

function parseMessage(message) {
  return new TextDecoder().decode(message).substring(1).trim().split("\f");
}

function parseFlag(flag) {
  const [flag1, flag2] = flag.split("|");
  const flag1Number = Number(flag1);
  const flag2Number = Number(flag2);
  return {
    isManager: (flag1Number & (1 << 8)) === 1 << 8,
    isTopFan: (flag1Number & (1 << 15)) === 1 << 15,
    isFan: (flag1Number & (1 << 5)) === 1 << 5,
    isTier1Follower: (flag2Number & (1 << 18)) === 1 << 18,
    isTier2Follower: (flag2Number & (1 << 19)) === 1 << 19,
    isTier3Follower: (flag2Number & (1 << 20)) === 1 << 20,
  };
}

function splitWithSpace(message) {
  return message
    .split(/([^ ]+)/)
    .filter((part) => part !== "")
    .map((part) => ({ type: "text", text: part }));
}

export default function useSoopChat(channelId) {
  const [chatList, setChatList] = useState([]);
  const pendingChatListRef = useRef([]);
  const [station, setStation] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [emoticons, setEmoticons] = useState({});
  const isUnloadingRef = useRef(false);
  const [webSocketBuster, setWebSocketBuster] = useState(0);

  useEffect(() => {
    if (!channelId) return;

    const fetchStation = async () => {
      try {
        const response = await fetch(
          `https://bjapi.afreecatv.com/api/${channelId}/station`
        );
        const data = await response.json();
        setStation(data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchStation();
    const interval = setInterval(fetchStation, 30000);
    return () => clearInterval(interval);
  }, [channelId]);

  useEffect(() => {
    if (!channelId || !station?.broad) return;
    const broadNo = station.broad.broad_no;

    (async () => {
      try {
        const response = await fetch(
          `/api/soop/live/afreeca/player_live_api.php?bjid=${channelId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            },
            body: new URLSearchParams({
              bid: channelId,
              bno: broadNo,
              type: "live",
              player_type: "html5",
              mode: "landing",
            }),
          }
        );
        const data = await response.json();
        setChannelInfo({
            ...data.CHANNEL,
            CHPT: `${parseInt(data.CHANNEL.CHPT, 10) + 1}`,
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [channelId, station]);
  
  const emojiRegex = useMemo(() => {
    const emojiKeys = Object.keys(emoticons);
    if (emojiKeys.length === 0) return null;
    return new RegExp(`/(${emojiKeys.join("|")})/`);
  }, [emoticons]);

  const convertChat = useCallback(
    (soopMessage) => {
      const { isManager, isTopFan, isFan, isTier1Follower, isTier2Follower, isTier3Follower } = parseFlag(soopMessage[7]);
      const subscriptionMonths = parseInt(soopMessage[8], 10);
      const PCON_OBJECT = channelInfo?.PCON_OBJECT;

      const personalSubscriptionBadges =
        (() => {
          if (PCON_OBJECT == null) {
            return [];
          }
          if (isTier1Follower) {
            return PCON_OBJECT.tier1;
          }
          if (isTier2Follower) {
            return PCON_OBJECT.tier2;
          }
          if (isTier3Follower) {
            return PCON_OBJECT.tier3;
          }
          return [];
        })() ?? [];

      const personalSubscriptionBadge = personalSubscriptionBadges.findLast(
        ({ MONTH }) => subscriptionMonths >= MONTH,
      )?.FILENAME;
      
      const message = soopMessage[1];
      const userId = soopMessage[2];
      const color =
        nicknameColors[
          userId
            .split("")
            .map((c) => c.charCodeAt(0))
            .reduce((a, b) => a + b, 0) % nicknameColors.length
        ];
      
      const match = emojiRegex ? message.match(emojiRegex) : null;

      return {
        uid: `${userId}-${new Date().getTime()}`,
        time: new Date().getTime(),
        userId,
        nickname: soopMessage[6],
        badges: [
          subscriptionMonths !== -1 ? personalSubscriptionBadge : null,
          isManager ? "/afreecatv/ic_manager.svg" : null,
          !isManager && isTopFan ? "/afreecatv/ic_hot.svg" : null,
          !isManager && subscriptionMonths !== -1 && !personalSubscriptionBadge
            ? isTier1Follower
              ? "/afreecatv/ic_gudok.svg"
              : "/afreecatv/ic_gudok_tier_2.svg"
            : null,
          !isManager && !isTopFan && isFan ? "/afreecatv/ic_fanclub.svg" : null,
        ].filter(Boolean),
        color,
        emojis: emoticons,
        message: match
          ? message
              .split(emojiRegex)
              .flatMap((part, i) =>
                i % 2 === 0
                  ? splitWithSpace(part)
                  : [{ type: "emoji", emojiKey: part }]
              )
          : splitWithSpace(message),
      };
    },
    [emoticons, emojiRegex, channelInfo]
  );
  
  useEffect(() => {
    if (!channelInfo) return;

    const { CHDOMAIN, CHPT, BJID, CHATNO, FTK } = channelInfo;
    const webSocketUrl = `wss://${CHDOMAIN}:${CHPT}/Websocket/${BJID}`;
    const payload = `\f${CHATNO}\f${FTK}\f0\f\f`;
    const key = payload.length.toString().padStart(6, "0");
    const handshake = `\u001b\t0002${key}00${payload}`;
    
    const ws = new WebSocket(webSocketUrl, ["chat"]);
    ws.binaryType = "arraybuffer";

    let pingInterval;

    ws.onopen = () => {
      ws.send(new TextEncoder().encode("\u001b\t000100000600\f\f\f16\f"));
      setTimeout(() => ws.send(handshake), 100);
    };
    
    ws.onclose = () => {
      clearInterval(pingInterval);
      if (!isUnloadingRef.current) {
        setTimeout(() => setWebSocketBuster(Date.now()), 1000);
      }
    };

    ws.onmessage = (event) => {
      const data = event.data;
      const soopMessage = parseMessage(data);
      if (soopMessage[0].startsWith("0005")) {
        pendingChatListRef.current.push(convertChat(soopMessage));
      }
    };
    
    pingInterval = setInterval(() => {
        ws.send('\u001b\t000000000100\f');
    }, 60000);

    return () => {
      isUnloadingRef.current = true;
      ws.close();
      clearInterval(pingInterval);
    };
  }, [channelInfo, convertChat, webSocketBuster]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingChatListRef.current.length > 0) {
        const chatsToRender = pendingChatListRef.current.splice(0);
        setChatList((prev) => [...prev, ...chatsToRender].slice(-100));
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return chatList;
}
