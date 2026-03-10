import {
  chzzk_client,
  soop_channel_client,
  soop_live_client,
  youtube_channel_client,
} from "@/api/client";

// ✅ 치지직 라이브 상태 조회
const getChzzkLiveStatus = async (channelId) => {
  try {
    const response = await chzzk_client.get(
      `/service/v3.2/channels/${channelId}/live-detail`
    );
    const data = response.data?.content;
    if (!data) {
      return await getChzzkLiveStatus2(channelId);
    }

    return {
      name: data?.channel?.channelName ?? "",
      imageUrl: data?.channel?.channelImageUrl ?? "",
      liveTitle: data?.liveTitle ?? "",
      openDate: data?.openDate ?? null,
      closeDate: data?.closeDate ?? null,
      isLive: data?.status === "OPEN",
      userCount: data?.status === "CLOSE" ? 0 : data?.concurrentUserCount ?? 0,
      liveCategory: data?.liveCategoryValue || data?.liveCategory,
      tags: data?.tags,
    };
  } catch (error) {
    console.error("❌ [Chzzk] 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};

const getChzzkLiveStatus2 = async (channelId) => {
  try {
    const response = await chzzk_client.get(
      `/service/v1/channels/${channelId}`
    );
    const data = response.data?.content;

    return {
      name: data?.channelName ?? "",
      imageUrl: data?.channelImageUrl ?? "",
      liveTitle: "",
      openDate: null,
      closeDate: null,
      isLive: data?.openLive,
      userCount: 0,
      liveCategory: null,
      tags: [],
    };
  } catch (error) {
    console.error("❌ [Chzzk] 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};

const getSoopLiveTags = async (channelId) => {
  try {
    const body = new URLSearchParams({
      bid: channelId,
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
      liveCategory: data?.CATEGORY_TAGS?.[0] ?? null,
      tags: data?.HASH_TAGS ?? [],
    };
  } catch (error) {
    console.error("❌ [Soop] 라이브 태그 가져오기 실패:", error);
    throw error;
  }
};

// ✅ 숲 라이브 상태 조회
const getSoopLiveStatus = async (channelId) => {
  try {
    const response = await soop_channel_client.get(`/api/${channelId}/station`);
    const data = response.data;
    const tag = await getSoopLiveTags(channelId);

    return {
      name: data?.station?.user_nick ?? "",
      imageUrl: data?.profile_image ?? "",
      liveTitle:
        data?.broad?.broad_title || data?.station?.display?.profile_text,
      openDate: data?.station?.broad_start ?? null,
      closeDate: null,
      isLive: data?.broad != null,
      userCount: data?.broad == null ? 0 : data?.broad?.current_sum_viewer ?? 0,
      liveCategory: tag?.liveCategory,
      tags: tag?.tags,
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
    name: channel.name ?? "",
    imageUrl: channel.iconURL ?? "",
    liveTitle: liveVideo?.title ?? "",
    openDate: liveVideo?.startTime ?? lastLiveInfo?.startTime ?? null,
    closeDate: lastLiveInfo?.closeDate ?? null,
    isLive: isLive ?? false,
    userCount: viewerCount ?? 0,
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
    const res = await fetch(`${localUrl}/channel/${channelId}`, { signal: controller.signal });
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
    const response = await youtube_channel_client.get(`/${channelId}`);
    const data = response.data;
    if (!data.channel) throw new Error("Channel not found");
    return processYoutubeChannelData(data);
  } catch (error) {
    console.error("❌ [YouTube] 채널 정보 가져오기 실패:", error);
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
  } else {
    console.warn(`⚠️ 지원하지 않는 플랫폼: ${platform}`);
    return;
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
          userCount: 0,
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
