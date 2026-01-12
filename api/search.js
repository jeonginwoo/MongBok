import { chzzk_client, soop_search_client } from "@/api/client";
import { getLiveStatus } from "@/api/live";

const getChzzkSearch = async (keyword) => {
  try {
    const response = await chzzk_client.get(`/service/v1/search/channels`, {
      params: { keyword, size: 5 },
    });

    const list = response.data?.content?.data ?? [];
    const result = await Promise.all(
      list.map(async (item) => {
        const liveStatus = await getLiveStatus(item.channel.channelId, "chzzk");
        return {
          ...liveStatus,
          id: item.channel.channelId,
          platform: "chzzk",
        };
      })
    );

    return result;
  } catch (error) {
    console.error("❌ [Chzzk] 검색 실패:", error);
    throw error;
  }
};

const getSoopSearch = async (keyword) => {
  try {
    const response = await soop_search_client.get(`/api.php`, {
      params: {
        m: "searchHistory",
        service: "list",
        d: keyword,
      },
    });

    const list = response.data?.suggest_bj ?? [];
    const result = await Promise.all(
      list.map(async (item) => {
        const liveStatus = await getLiveStatus(item.user_id, "soop");
        return {
          ...liveStatus,
          id: item.user_id,
          platform: "soop",
        };
      })
    );

    return result;
  } catch (error) {
    console.error("❌ [Soop] 검색 실패:", error);
    throw error;
  }
};

export const searchChannels = async (keyword, platform) => {
  if (!keyword || keyword.trim() === "") return [];

  if (platform === "chzzk") {
    return await getChzzkSearch(keyword);
  }

  if (platform === "soop") {
    return await getSoopSearch(keyword);
  }

  console.warn(`⚠️ 지원하지 않는 플랫폼: ${platform}`);
  return [];
};

export const searchAllPlatforms = async (keyword, limit = 6) => {
  const [chzzk, soop] = await Promise.all([
    getChzzkSearch(keyword),
    getSoopSearch(keyword),
  ]);

  const CHZZK_WEIGHT = 1001;
  const SOOP_WEIGHT = 1000;

  const normalized = [
    ...chzzk.map((item, i) => ({
      ...item,
      _score: CHZZK_WEIGHT - i * 10,
    })),
    ...soop.map((item, i) => ({
      ...item,
      _score: SOOP_WEIGHT - i * 10,
    })),
  ];

  return normalized.sort((a, b) => b._score - a._score).slice(0, limit);
};
