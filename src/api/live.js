import {
  chzzk_live_client,
  chzzk_chat_client,
  soop_channel_client,
  soop_live_client,
  youtube_channel_client,
  twitch_gql_client,
} from "@/api/client";

// ✅ 치지직 라이브 상태 조회
const getChzzkLiveStatus = async (channelId) => {
  try {
    const response = await chzzk_live_client.get(
      `/service/v3.2/channels/${channelId}/live-detail`
    );
    const data = response.data?.content;
    if (!data) {
      return await getChzzkLiveStatus2(channelId);
    }

    const chatChannelId = data?.chatChannelId;
    let accessToken = null;
    if (chatChannelId) {
      try {
        const tokenRes = await chzzk_chat_client.get(
          `/nng_main/v1/chats/access-token?channelId=${chatChannelId}&chatType=STREAMING`
        );
        accessToken = tokenRes.data?.content?.accessToken;
      } catch (e) {
        console.error("❌ [Chzzk] 액세스 토큰 가져오기 실패:", e);
      }
    }

    return {
      id: channelId,
      name: data?.channel?.channelName ?? "",
      imageUrl: data?.channel?.channelImageUrl ?? "",
      liveTitle: data?.liveTitle ?? "",
      liveImageUrl: data?.liveImageUrl ? data.liveImageUrl.replace("{type}", "270") : "",
      openDate: data?.openDate ?? null,
      closeDate: data?.closeDate ?? null,
      isLive: data?.status === "OPEN",
      userCount: data?.status === "CLOSE" ? -1 : data?.concurrentUserCount ?? 0,
      liveCategory: data?.liveCategoryValue || data?.liveCategory,
      tags: data?.tags,
      chatChannelId,
      accessToken,
    };
  } catch (error) {
    console.error("❌ [Chzzk] 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};

const getChzzkLiveStatus2 = async (channelId) => {
  try {
    const response = await chzzk_live_client.get(
      `/service/v1/channels/${channelId}`
    );
    const data = response.data?.content;

    return {
      id: channelId,
      name: data?.channelName ?? "",
      imageUrl: data?.channelImageUrl ?? "",
      liveTitle: "",
      openDate: null,
      closeDate: null,
      isLive: data?.openLive,
      userCount: data?.openLive ? 0 : -1,
      liveCategory: null,
      tags: [],
      chatChannelId: null,
      accessToken: null,
    };
  } catch (error) {
    console.error("❌ [Chzzk] 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};

const getSoopLiveDetails = async (channelId) => {
  try {
    const body = new URLSearchParams({
      bid: channelId,
      type: "live",
      player_type: "html5",
      mode: "landing",
    });

    const response = await soop_live_client.post(
      `/afreeca/player_live_api.php`,
      body.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const data = response.data?.CHANNEL;

    return {
      id: channelId,
      liveCategory: data?.CATEGORY_TAGS?.[0] ?? null,
      tags: data?.HASH_TAGS ?? [],
      chatNo: data?.CHATNO,
      ftk: data?.FTK,
      bjid: data?.BJID,
      chDomain: data?.CHDOMAIN,
      chPt: data?.CHPT != null ? `${parseInt(data.CHPT, 10) + 1}` : null,
      pconObject: data?.PCON_OBJECT,
      liveImageUrl: data?.BNO ? `https://liveimg.sooplive.com/m/${data.BNO}` : "",
    };
  } catch (error) {
    console.error("❌ [Soop] 라이브 상세 정보 가져오기 실패:", error);
    throw error;
  }
};

// ✅ 숲 라이브 상태 조회
const getSoopLiveStatus = async (channelId) => {
  try {
    const response = await soop_channel_client.get(`/api/${channelId}/station`);
    const data = response.data;
    const detail = await getSoopLiveDetails(channelId);

    return {
      id: channelId,
      name: data?.station?.user_nick ?? "",
      imageUrl: data?.profile_image ?? "",
      liveTitle:
        data?.broad?.broad_title || data?.station?.display?.profile_text,
      openDate: data?.station?.broad_start ?? null,
      closeDate: null,
      isLive: data?.broad != null,
      userCount: data?.broad == null ? -1 : data?.broad?.current_sum_viewer ?? 0,
      liveCategory: detail?.liveCategory,
      tags: detail?.tags,
      chatNo: detail?.chatNo,
      ftk: detail?.ftk,
      bjid: detail?.bjid,
      chDomain: detail?.chDomain,
      chPt: detail?.chPt,
      pconObject: detail?.pconObject,
      liveImageUrl: detail?.liveImageUrl,
    };
  } catch (error) {
    console.error("❌ [Soop] 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};

// ✅ 유튜브 라이브 상태 조회
const processYoutubeChannelData = (data) => {
  const { channel, liveVideo, isLive, viewerCount, lastLiveInfo } = data;
  return {
    id: channel.id, // 실제 고유 채널 ID (UC...)
    name: channel.name ?? "",
    imageUrl: channel.iconURL ?? "",
    liveTitle: liveVideo?.title ?? "",
    liveImageUrl: liveVideo?.thumbnails?.[liveVideo?.thumbnails?.length - 1]?.url ?? "",
    openDate: liveVideo?.startTime ?? lastLiveInfo?.startTime ?? null,
    closeDate: lastLiveInfo?.closeDate ?? null,
    isLive: isLive ?? false,
    userCount: isLive ? (viewerCount ?? 0) : -1,
    liveVideoId: liveVideo?.id ?? null,
    liveCategory: null,
    tags: [],
  };
};

const getLocalChatServerUrl = () => {
  if (typeof window === "undefined") return null;
  const wsUrl = process.env.NEXT_PUBLIC_YOUTUBE_CHAT_WS_URL || "ws://localhost:47200";
  return wsUrl.replace(/^ws(s?):\/\//, "http$1://");
};

const getYoutubeLiveStatus = async (channelId) => {
  const localUrl = getLocalChatServerUrl();
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${localUrl}/channel/${encodeURIComponent(channelId)}`, { signal: controller.signal });
    clearTimeout(tid);
    if (res.ok) {
      const data = await res.json();
      if (data.channel) return processYoutubeChannelData(data);
      console.error("❌ [YouTube] 로컬 서버: 채널 데이터 없음", data);
    } else {
      const body = await res.text().catch(() => "");
      console.error(`❌ [YouTube] 로컬 서버 오류 (${res.status}):`, body);
    }
  } catch (e) {
    clearTimeout(tid);
    if (e.name === "AbortError") {
      console.error("❌ [YouTube] 로컬 서버 요청 타임아웃");
    }
    // connection refused 등 → fallback
  }

  // 로컬 서버 실패 시 Vercel API로 채널 기본 정보 조회 (스트리밍 시간 제외 가능)
  try {
    const response = await youtube_channel_client.get(`/${encodeURIComponent(channelId)}`);
    const data = response.data;
    if (!data.channel) throw new Error("Channel not found");
    return processYoutubeChannelData(data);
  } catch (error) {
    console.error("❌ [YouTube] 채널 정보 가져오기 실패:", error);
    throw error;
  }
};

// ✅ 트위치 라이브 상태 조회
const getTwitchLiveStatus = async (login) => {
  try {
    const body = [
      {
        operationName: "ChannelShell",
        variables: {
          login: login,
        },
        query: `query ChannelShell($login: String!) { 
          user(login: $login) { 
            id 
            login 
            displayName 
            description 
            profileImageURL(width: 150) 
            roles { isPartner } 
            followers { totalCount } 
            stream { 
              id 
              title 
              viewersCount 
              createdAt 
              game { id name } 
            } 
          } 
        }`,
      },
      {
        operationName: "RealtimeStreamTagList",
        variables: {
          channelLogin: login,
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash: "fbf9d64d09620f4b263add345261aaaa8e7010fd13b1c1df234c82b920cc2094",
          },
        },
      },
    ];

    const response = await twitch_gql_client.post("", body);
    const user = response.data?.[0]?.data?.user;
    const tagData = response.data?.[1]?.data?.user?.stream?.freeformTags ?? [];

    if (!user) {
      throw new Error("User not found");
    }

    const stream = user.stream;

    return {
      id: user.login,
      twitchUserId: user.id,
      name: user.displayName,
      imageUrl: user.profileImageURL,
      liveTitle: stream?.title ?? "",
      liveImageUrl: stream ? `https://static-cdn.jtvnw.net/previews-ttv/live_user_${user.login}-440x248.jpg` : "",
      openDate: stream?.createdAt ?? null,
      closeDate: null,
      isLive: !!stream,
      userCount: stream ? stream.viewersCount : -1,
      liveCategory: stream?.game?.name ?? null,
      tags: tagData.map(tag => tag.name),
    };
  } catch (error) {
    console.error("❌ [Twitch] 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};

// ✅ 라이브 상태 조회
export const getLiveStatus = async (channelId, platform) => {
  let liveStatus = null;
  if (platform === "chzzk") {
    liveStatus = await getChzzkLiveStatus(channelId);
  } else if (platform === "soop") {
    liveStatus = await getSoopLiveStatus(channelId);
  } else if (platform === "youtube") {
    liveStatus = await getYoutubeLiveStatus(channelId);
  } else if (platform === "twitch") {
    liveStatus = await getTwitchLiveStatus(channelId);
  } else {
    console.warn(`⚠️ 지원하지 않는 플랫폼: ${platform}`);
    return;
  }

  if (liveStatus) {
    liveStatus.lastRefreshed = Date.now();
  }

  return liveStatus;
};

// ✅ 플랫폼별로 라이브 데이터 가져오기
export const getAllChannelsData = async (localStorageData) => {
  const entries = Object.entries(localStorageData);
  const result = {};

  await Promise.all(
    entries.map(async ([channelId, item]) => {
      try {
        const live = await getLiveStatus(channelId, item.platform);

        result[channelId] = {
          id: channelId,
          name: live.name,
          imageUrl: live.imageUrl,
          liveTitle: live.liveTitle,
          liveImageUrl: live.liveImageUrl,
          lastRefreshed: live.lastRefreshed,
          openDate: live.openDate,
          closeDate: live.closeDate,
          isLive: live.isLive,
          userCount: live.userCount,
          liveVideoId: live.liveVideoId ?? null,
          liveCategory: live.liveCategory,
          tags: live.tags,
          isVisible: item.zoneId != null,
          zoneId: item.zoneId ?? null,
          platform: item.platform,
          // Chat metadata
          chatChannelId: live.chatChannelId,
          accessToken: live.accessToken,
          twitchUserId: live.twitchUserId,
          chatNo: live.chatNo,
          ftk: live.ftk,
          bjid: live.bjid,
          chDomain: live.chDomain,
          chPt: live.chPt,
          pconObject: live.pconObject,
        };
      } catch (error) {
        console.error(`⚠️ ${channelId} 데이터 불러오기 실패:`, error);
        // 실패해도 채널은 목록에 표시 (기본값으로)
        result[channelId] = {
          id: channelId,
          name: "",
          imageUrl: "",
          liveTitle: "",
          openDate: null,
          closeDate: null,
          isLive: false,
          userCount: -1,
          liveVideoId: null,
          liveCategory: null,
          tags: [],
          isVisible: item.zoneId != null,
          zoneId: item.zoneId ?? null,
          platform: item.platform,
        };
      }
    })
  );

  return result;
};
