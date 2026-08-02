"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useAtomValue } from "jotai";
import { CHAT_MAX_COUNT, CHAT_RENDER_INTERVAL, channelsAtom } from "@/atoms/setting";
import { makeChannelKey } from "@/utils/channelKey";
import { parseMessage } from "@/utils/twitch";
import { twitch_gql_client } from "@/api/client";

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

const emojiRegex = /([^ ]+)/;

const bitRegex = /^[cC]heer(\d+)$/;

// [setId, version] 쌍을 배지 이미지 URL 배열로 변환
const resolveBadges = (badgePairs, badgesMap) =>
  badgePairs.map(([setId, version]) => badgesMap[setId]?.[version]).filter(Boolean);

let globalBadgesCache = null;

export default function useTwitchChat(channelId) {
  const [chatList, setChatList] = useState([]);
  const pendingChatListRef = useRef([]);
  const isUnloadingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const [webSocketBuster, setWebSocketBuster] = useState(0);
  const [retryBuster, setRetryBuster] = useState(0);
  const messageCounterRef = useRef(0);

  const [status, setStatus] = useState("idle"); // idle, loading, connected, disconnected, error
  const statusRef = useRef("idle");
  const [error, setError] = useState(null);
  const [badgesMap, setBadgesMap] = useState({});

  const channels = useAtomValue(channelsAtom);
  const channelData = channels[makeChannelKey("twitch", channelId)];
  const { isLive, lastRefreshed, twitchUserId } = channelData || {};

  const updateStatus = useCallback((newStatus) => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  }, []);

  const retry = useCallback(() => {
    setRetryBuster((prev) => prev + 1);
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

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        if (!globalBadgesCache) {
          const globalRes = await twitch_gql_client.post("", {
            query: `query { badges { setID version imageURL(size: QUADRUPLE) } }`,
          });
          const globalData = globalRes.data?.data?.badges || [];
          const cache = {};
          globalData.forEach((badge) => {
            if (!badge?.setID || !badge.imageURL) return;
            cache[badge.setID] = cache[badge.setID] || {};
            cache[badge.setID][badge.version] = badge.imageURL;
          });
          globalBadgesCache = cache;
        }

        const map = {};
        Object.entries(globalBadgesCache).forEach(([setId, versions]) => {
          map[setId] = { ...versions };
        });

        // 채널 전용 배지(구독, 비트 등)가 글로벌 배지를 덮어씀
        if (twitchUserId) {
          const channelRes = await twitch_gql_client.post("", {
            query: `query($id: ID!) { user(id: $id) { broadcastBadges { setID version imageURL(size: QUADRUPLE) } } }`,
            variables: { id: twitchUserId },
          });
          const channelBadges = channelRes.data?.data?.user?.broadcastBadges || [];
          channelBadges.forEach((badge) => {
            if (!badge?.setID || !badge.imageURL) return;
            map[badge.setID] = map[badge.setID] || {};
            map[badge.setID][badge.version] = badge.imageURL;
          });
        }

        setBadgesMap(map);
      } catch (e) {
        console.error("❌ [Twitch] 배지 정보를 가져오는데 실패했습니다:", e);
      }
    };

    fetchBadges();
  }, [twitchUserId]);

  const convertChat = useCallback((twitchMessage) => {
    const tags = twitchMessage.tags;
    const source = twitchMessage.source;
    const nickname = tags["display-name"] ?? source["nick"];
    const userId = tags["user-id"];
    
    const color =
      tags["color"] ??
      nicknameColors[
        `${userId}`
          .split("")
          .map((c) => c.charCodeAt(0))
          .reduce((a, b) => a + b, 0) % nicknameColors.length
      ];

    let rawMessage = twitchMessage["parameters"] || "";
    // Handle CTCP ACTION (/me)
    const isAction = rawMessage.startsWith("\x01ACTION ") && rawMessage.endsWith("\x01");
    if (isAction) {
      rawMessage = rawMessage.slice(8, -1);
    }

    const emotes = tags["emotes"] ?? {};
    const bits = parseInt(tags["bits"] ?? "0");
    const emoteReplacements = [];

    Object.entries(emotes).forEach(([id, positions]) => {
      const position = positions[0];
      const { startPosition, endPosition } = position;
      const stringToReplace = rawMessage.substring(
        parseInt(startPosition),
        parseInt(endPosition) + 1
      );
      emoteReplacements.push({
        stringToReplace,
        replacement: { type: "emoji", emojiKey: id },
      });
    });

    const emojis = Object.fromEntries(
      Object.keys(emotes).map((id) => [
        id,
        `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/4.0`,
      ])
    );

    const message = rawMessage
      .split(emojiRegex)
      .filter((part) => part !== "")
      .flatMap((part) => {
        // 치어모트 토큰은 메시지에서 제거 (금액은 후원 카드 하단에 표시됨)
        if (bits > 0 && bitRegex.test(part)) {
          return [];
        }
        const emoteIndex = emoteReplacements.findIndex(
          (r) => r.stringToReplace === part
        );
        if (emoteIndex === -1) {
          return [{ type: "text", text: part }];
        }
        return [emoteReplacements[emoteIndex].replacement];
      });

    // 배지는 badgesMap 로딩 전에 도착한 메시지도 소급 갱신할 수 있도록 원본 쌍을 보존
    const badgePairs = Object.entries(tags["badges"] ?? {});
    const badges = resolveBadges(badgePairs, badgesMap);

    messageCounterRef.current += 1;
    const uniqueId = `${userId}-${tags["tmi-sent-ts"]}-${messageCounterRef.current}`;

    return {
      uid: uniqueId,
      time: parseInt(tags["tmi-sent-ts"]),
      userId,
      nickname,
      badges,
      badgePairs,
      color,
      emojis,
      message,
      messageColor: isAction ? color : undefined,
      ...(bits > 0 && { bitsAmount: bits }),
    };
  }, [badgesMap]);

  const convertChatRef = useRef(convertChat);
  useEffect(() => {
    convertChatRef.current = convertChat;
  }, [convertChat]);

  // 배지 맵 로딩/갱신 전에 도착한 메시지의 배지를 소급 갱신
  // (글로벌 subscriber 별모양 → 채널 커스텀 배지 교체 포함)
  useEffect(() => {
    if (Object.keys(badgesMap).length === 0) return;

    const remap = (chat) => {
      if (!chat.badgePairs?.length) return chat;
      const badges = resolveBadges(chat.badgePairs, badgesMap);
      const same =
        badges.length === chat.badges.length &&
        badges.every((url, i) => url === chat.badges[i]);
      return same ? chat : { ...chat, badges };
    };

    pendingChatListRef.current = pendingChatListRef.current.map(remap);
    setChatList((prev) => {
      let changed = false;
      const next = prev.map((chat) => {
        const remapped = remap(chat);
        if (remapped !== chat) changed = true;
        return remapped;
      });
      return changed ? next : prev;
    });
  }, [badgesMap]);

  useEffect(() => {
    if (!channelId) {
      updateStatus("idle");
      setError(null);
      return;
    }

    let isCurrent = true;
    const isSeamless = statusRef.current === "connected";
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv");

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
          ws.send("PING");
        }
      }
    };

    ws.onopen = () => {
      if (!isCurrent) return;
      ws.send("CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands");
      ws.send("PASS SCHMOOPIIE");
      ws.send(`NICK justinfan${75837 + Math.floor(Math.random() * 10000)}`);
      isRefreshingRef.current = false;
    };

    ws.onclose = () => {
      if (!isCurrent) return;
      if (!isUnloadingRef.current && !isRefreshingRef.current) {
        updateStatus("disconnected");
      }
    };

    ws.onerror = (e) => {
      if (!isCurrent) return;
      updateStatus("error");
      setError("WebSocket error");
    };

    ws.onmessage = (event) => {
      if (!isCurrent) return;

      if (statusRef.current === "error" || statusRef.current === "disconnected") {
        updateStatus("connected");
        setError(null);
      }

      const data = event.data;
      const rawIrcMessage = data.trimEnd();
      const messages = rawIrcMessage.split("\r\n");

      messages.forEach((message) => {
        const parsedMessage = parseMessage(message);
        if (parsedMessage == null) return;

        switch (parsedMessage.command.command) {
          case "PRIVMSG": {
            const chat = convertChatRef.current(parsedMessage);
            pendingChatListRef.current.push(chat);
            break;
          }
          case "PING":
            ws.send("PONG");
            break;
          case "001":
            ws.send(`JOIN #${channelId}`);
            updateStatus("connected");
            break;
        }

        if (parsedMessage.command.command !== "PONG") {
          worker.postMessage("startPingTimer");
        }
      });
    };

    worker.postMessage("startPingTimer");

    return () => {
      isCurrent = false;
      isRefreshingRef.current = true;
      worker.postMessage("stop");
      worker.terminate();
      ws.close();
    };
  }, [channelId, webSocketBuster]);

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
    }, CHAT_RENDER_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { chatList, status, error, retry };
}
