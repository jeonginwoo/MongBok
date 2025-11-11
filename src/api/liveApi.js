import { ChzzkClient } from "chzzk";
import axios from "axios";

const chzzk_client = new ChzzkClient({
  baseUrls: {
    chzzkBaseUrl: "/chzzk_api",
    gameBaseUrl: "/chzzk_game",
  },
});

const soop_client = axios.create({
  baseURL: "/soop_api",
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ 치지직 라이브 상태 조회
export const getChzzkLiveStatus = async (channelId) => {
  try {
    const data = await chzzk_client.live.detail(channelId);

    return {
      name: data?.channel?.channelName ?? "",
      imageUrl: data?.channel?.channelImageUrl ?? "",
      liveTitle: data?.liveTitle ?? "",
      openDate: data?.openDate ?? null,
      isLive: data?.status === "OPEN",
      userCount:
        data?.status === "CLOSE" ? 0 : data?.concurrentUserCount ?? 0,
    };
  } catch (error) {
    console.error("❌ [Chzzk] 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};

// ✅ 숲 라이브 상태 조회
export const getSoopLiveStatus = async (channelId) => {
  try {
    const response = await soop_client.get(`/api/${channelId}/station`);
    const data = response.data;

    return {
      name: data?.station?.user_nick ?? "",
      imageUrl: data?.profile_image ?? "",
      liveTitle: data?.broad?.broad_title ?? "",
      openDate: data?.station?.broad_start ?? null,
      isLive: data?.broad != null,
      userCount:
        data?.broad == null ? 0 : data?.broad?.current_sum_viewer ?? 0,
    };
  } catch (error) {
    console.error("❌ [Soop] 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};

// ✅ 플랫폼별로 라이브 데이터 가져오기
export const getAllChannelsData = async (localStorageData) => {
  const entries = Object.entries(localStorageData);
  const result = {};

  await Promise.all(
    entries.map(async ([channelId, item]) => {
      try {
        let live = null;
        if (item.platform === "chzzk") {
          live = await getChzzkLiveStatus(channelId);
        } else if (item.platform === "soop") {
          live = await getSoopLiveStatus(channelId);
        } else {
          console.warn(`⚠️ 지원하지 않는 플랫폼: ${item.platform}`);
          return;
        }

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
