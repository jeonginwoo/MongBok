import {
  chzzk_client,
  soop_channel_client,
} from "@/api/client";

const chzzk_default_profile_img = "https://ssl.pstatic.net/static/nng/glive/image/default_profile_dark.png?type=f120_120_na"

// ✅ 치지직 라이브 상태 조회
const getChzzkLiveStatus = async (channelId) => {
  try {
    const response = await chzzk_client.get(`/service/v3.2/channels/${channelId}/live-detail`);
    const data = response.data?.content;
    if (!data) {
      return await getChzzkLiveStatus2(channelId);
    }

    return {
      name: data?.channel?.channelName ?? "",
      imageUrl: data?.channel?.channelImageUrl || chzzk_default_profile_img,
      liveTitle: data?.liveTitle ?? "",
      openDate: data?.openDate ?? null,
      isLive: data?.status === "OPEN",
      userCount: (data?.status === "CLOSE") ? 0 : (data?.concurrentUserCount ?? 0),
    };
  } catch (error) {
    console.error("❌ [Chzzk] 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};

const getChzzkLiveStatus2 = async (channelId) => {
  try {
    const response = await chzzk_client.get(`/service/v1/channels/${channelId}`);
    const data = response.data?.content;

    return {
      name: data?.channelName ?? "",
      imageUrl: data?.channelImageUrl || chzzk_default_profile_img,
      liveTitle: "",
      openDate: null,
      isLive: data?.openLive,
      userCount: 0,
    };
  } catch (error) {
    console.error("❌ [Chzzk] 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};

// ✅ 숲 라이브 상태 조회
const getSoopLiveStatus = async (channelId) => {
  try {
    const response = await soop_channel_client.get(`/api/${channelId}/station`);
    const data = response.data;
    return {
      name: data?.station?.user_nick ?? "",
      imageUrl: data?.profile_image ?? "",
      liveTitle: data?.broad?.broad_title ?? "",
      openDate: data?.station?.broad_start ?? null,
      isLive: data?.broad != null,
      userCount: (data?.broad == null) ? 0 : (data?.broad?.current_sum_viewer ?? 0),
    };
  } catch (error) {
    console.error("❌ [Soop] 라이브 상태 가져오기 실패:", error);
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
          isLive: live.isLive,
          userCount: live.userCount,
          isVisible: item.zoneId != null,
          zoneId: item.zoneId ?? null,
          platform: item.platform,
        };
      } catch (error) {
        console.error(`⚠️ ${channelId} 데이터 불러오기 실패:`, error);
      }
    })
  );

  return result;
};
