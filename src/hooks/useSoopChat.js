"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defaultEmojis, afreecaNicknameColors } from "../data/soopConstants";
import useSoopEmoticons from "./useSoopEmoticons";
import { CHAT_MAX_COUNT, CHAT_RENDER_INTERVAL } from "@/atoms/setting";

function parseMessage(message) {
  return new TextDecoder().decode(message).substring(1).trim().split("\f");
}

function parseFlag(flag) {
  if (!flag) return {};
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
  const isUnloadingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const [webSocketBuster, setWebSocketBuster] = useState(0);
  const messageCounterRef = useRef(0); // 메시지 카운터로 고유 ID 생성

  const { emoticons: customEmoticons } = useSoopEmoticons(channelId);

  const combinedEmoticons = useMemo(() => {
    if (!channelId) return defaultEmojis;

    const dynamicEmoticonsMap = Object.fromEntries(
      customEmoticons.map(({ title, pc_img }) => [
        title.replaceAll("/", ""),
        `https://static.file.sooplive.co.kr/signature_emoticon/${channelId}/${pc_img}`,
      ])
    );
    return {
      ...defaultEmojis,
      ...dynamicEmoticonsMap,
    };
  }, [customEmoticons, channelId]);

  const emojiRegex = useMemo(() => {
    const emojiKeys = Object.keys(combinedEmoticons);
    if (emojiKeys.length === 0) return null;
    return new RegExp(
      `/(${emojiKeys.map((key) => key.replace(/[.*+?^${}()|[\\]/g, "\\$& ")).join("|")})/`
    );
  }, [combinedEmoticons]);

  useEffect(() => {
    if (!channelId) return;

    const fetchStation = async () => {
      try {
        const response = await fetch(`/api/soop/station/api/${channelId}/station`);
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

  const convertChat = useCallback(
    (soopMessage) => {
      const {
        isManager,
        isTopFan,
        isFan,
        isTier1Follower,
        isTier2Follower,
        isTier3Follower,
      } = parseFlag(soopMessage[7]);
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
        ({ MONTH }) => subscriptionMonths >= MONTH
      )?.FILENAME;

      const message = soopMessage[1];
      const userId = soopMessage[2];
      const color =
        afreecaNicknameColors[
          userId
            .split("")
            .map((c) => c.charCodeAt(0))
            .reduce((a, b) => a + b, 0) % afreecaNicknameColors.length
        ];

      const match = emojiRegex ? message.match(emojiRegex) : null;

      messageCounterRef.current += 1;
      const uniqueId = `${userId}-${new Date().getTime()}-${messageCounterRef.current}`;

      return {
        uid: uniqueId,
        time: new Date().getTime(),
        userId,
        nickname: soopMessage[6],
        badges: [
          personalSubscriptionBadge,
          isManager ? "/soop/ic_manager.svg" : null,
          !isManager && isTopFan ? "/soop/ic_hot.svg" : null,
          !isManager && subscriptionMonths !== -1 && !personalSubscriptionBadge
            ? isTier1Follower
              ? "/soop/ic_gudok.svg"
              : "/soop/ic_gudok_tier_2.svg"
            : null,
          !isManager && !isTopFan && isFan ? "/soop/ic_fanclub.svg" : null,
        ].filter(Boolean),
        color,
        emojis: combinedEmoticons,
        message: match
          ? message
              .split(emojiRegex)
              .map((part, i) =>
                i % 2 === 0
                  ? splitWithSpace(part)
                  : [{ type: "emoji", emojiKey: part }]
              )
              .flat()
          : splitWithSpace(message),
      };
    },
    [emojiRegex, channelInfo, combinedEmoticons]
  );

  const convertStickerChat = useCallback(
    (soopMessage) => {
      const {
        isManager,
        isTopFan,
        isFan,
        isTier1Follower,
        isTier2Follower,
        isTier3Follower,
      } = parseFlag(soopMessage[8]);
      const stickerId = soopMessage[3];
      const stickerSubId = soopMessage[4];
      const stickerVersion = soopMessage[5];
      const stickerExtension = soopMessage[12];
      const subscriptionMonths = parseInt(soopMessage[13]);
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
        ({ MONTH }) => subscriptionMonths >= MONTH
      )?.FILENAME;

      const userId = soopMessage[6];
      const color =
        afreecaNicknameColors[
          userId
            .split("")
            .map((c) => c.charCodeAt(0))
            .reduce((a, b) => a + b, 0) % afreecaNicknameColors.length
        ];

      messageCounterRef.current += 1;
      const uniqueStickerlyId = `${userId}-${new Date().getTime()}-sticker-${messageCounterRef.current}`;

      return {
        uid: uniqueStickerlyId,
        time: new Date().getTime(),
        userId,
        nickname: soopMessage[7],
        badges: [
          personalSubscriptionBadge,
          isManager ? "/soop/ic_manager.svg" : null,
          !isManager && isTopFan ? "/soop/ic_hot.svg" : null,
          !isManager &&
          subscriptionMonths !== -1 &&
          !personalSubscriptionBadge
            ? isTier1Follower
              ? "/soop/ic_gudok.svg"
              : "/soop/ic_gudok_tier_2.svg"
            : null,
          !isManager && !isTopFan && isFan
            ? "/soop/ic_fanclub.svg"
            : null,
        ].filter(Boolean),
        color,
        emojis: combinedEmoticons,
        message: [
          {
            type: "sticker",
            url: `https://ogq-sticker-global-cdn-z01.sooplive.co.kr/sticker/${stickerId}/${stickerSubId}_80.${stickerExtension}?ver=${stickerVersion}`,
          },
        ],
      };
    },
    [channelInfo, combinedEmoticons]
  );

  const convertBalloonChat = useCallback(
    (soopMessage) => {
      // 0018 메시지 구조: [2]=userId, [3]=nickname, [4]=별풍선 개수
      const balloonAmount = parseInt(soopMessage[4], 10) || 0;
      const userId = soopMessage[2];
      const nickname = soopMessage[3];

      const color =
        afreecaNicknameColors[
          userId
            .split("")
            .map((c) => c.charCodeAt(0))
            .reduce((a, b) => a + b, 0) % afreecaNicknameColors.length
        ];

      messageCounterRef.current += 1;
      const uniqueId = `${userId}-${new Date().getTime()}-balloon-${messageCounterRef.current}`;

      return {
        uid: uniqueId,
        time: new Date().getTime(),
        userId,
        nickname,
        badges: [],
        color,
        emojis: combinedEmoticons,
        message: [],
        balloonAmount,
      };
    },
    [combinedEmoticons]
  );

  useEffect(() => {
    if (!channelInfo) return;

    const { CHDOMAIN, CHPT, BJID, CHATNO, FTK } = channelInfo;
    if (!CHDOMAIN || !CHPT || !BJID) return;
    const webSocketUrl = `wss://${CHDOMAIN}:${CHPT}/Websocket/${BJID}`;
    const payload = `\f${CHATNO}\f${FTK}\f0\f\f`;
    const key = payload.length.toString().padStart(6, "0");
    const handshake = `\u001b\t0002${key}00${payload}`;

    const ws = new WebSocket(webSocketUrl, ["chat"]);
    ws.binaryType = "arraybuffer";

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
                  timeout = setTimeout(reservePing, 60000)
                }, 60000)
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
          ws.send("\u001b\t000000000100\f");
        }
      }
    };

    ws.onopen = () => {
      ws.send(new TextEncoder().encode("\u001b\t000100000600\f\f\f16\f"));
      setTimeout(() => ws.send(handshake), 100);
      isRefreshingRef.current = false;
    };

    ws.onclose = () => {
      if (!isUnloadingRef.current && !isRefreshingRef.current) {
        setTimeout(() => setWebSocketBuster(Date.now()), 1000);
      }
    };

    ws.onmessage = (event) => {
      worker.postMessage("startPingTimer");
      const data = event.data;
      const soopMessage = parseMessage(data);
      if (soopMessage[0].startsWith("0005")) {
        const userId = soopMessage[2];
        const pending = pendingChatListRef.current;
        let balloonItem = null;
        for (let i = pending.length - 1; i >= 0; i--) {
          if (pending[i].balloonAmount != null && pending[i].userId === userId && pending[i].message.length === 0) {
            balloonItem = pending[i];
            break;
          }
        }
        if (balloonItem) {
          const chatData = convertChat(soopMessage);
          balloonItem.message = chatData.message;
          balloonItem.badges = chatData.badges;
        } else {
          pending.push(convertChat(soopMessage));
        }
      } else if (soopMessage[0].startsWith("0018")) {
        pendingChatListRef.current.push(convertBalloonChat(soopMessage));
      } else if (soopMessage[0].startsWith("0109")) {
        pendingChatListRef.current.push(convertStickerChat(soopMessage));
      }
    };

    worker.postMessage("startPingTimer");

    return () => {
      isRefreshingRef.current = true;
      worker.postMessage("stop");
      worker.terminate();
      ws.close();
    };
  }, [channelInfo, convertChat, convertBalloonChat, convertStickerChat, webSocketBuster]);

  useEffect(() => {
    return () => {
      isUnloadingRef.current = true;
    };
  }, []);

  useEffect(() => {
    const BALLOON_WAIT_MS = 500;
    const interval = setInterval(() => {
      if (pendingChatListRef.current.length > 0) {
        const now = Date.now();
        const chatsToRender = pendingChatListRef.current.filter(
          (item) =>
            item.balloonAmount == null ||
            item.message.length > 0 ||
            now - item.time > BALLOON_WAIT_MS
        );
        if (chatsToRender.length > 0) {
          pendingChatListRef.current = pendingChatListRef.current.filter(
            (item) => !chatsToRender.includes(item)
          );
          setChatList((prev) => [...prev, ...chatsToRender].slice(-CHAT_MAX_COUNT));
        }
      }
    }, CHAT_RENDER_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return chatList;
}
