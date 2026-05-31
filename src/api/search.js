import { chzzk_live_client, soop_search_client, youtube_search_client } from "@/api/client";
import { getLiveStatus } from "@/api/live";
import { ENABLE_CHZZK, ENABLE_SOOP, ENABLE_YOUTUBE } from "@/data/config";

const getChzzkSearch = async (keyword) => {
  try {
    const response = await chzzk_live_client.get(`/service/v1/search/channels`, {
      params: { keyword, size: 5 },
    });

    const list = response.data?.content?.data ?? [];
    const result = await Promise.all(
      list.map(async (item) => {
        try {
          const liveStatus = await getLiveStatus(
            item.channel.channelId,
            "chzzk"
          );
          return {
            ...liveStatus,
            id: item.channel.channelId,
            platform: "chzzk",
          };
        } catch (e) {
          return null;
        }
      })
    );

    return result.filter((item) => item !== null);
  } catch (error) {
    console.error("❌ [Chzzk] 검색 실패:", error.message || error);
    return [];
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
        try {
          const liveStatus = await getLiveStatus(item.user_id, "soop");
          return {
            ...liveStatus,
            id: item.user_id,
            platform: "soop",
          };
        } catch (e) {
          return null;
        }
      })
    );

    return result.filter((item) => item !== null);
  } catch (error) {
    console.error("❌ [Soop] 검색 실패:", error.message || error);
    return [];
  }
};

const getYoutubeSearch = async (keyword) => {
  try {
    const response = await youtube_search_client.get(``, {
      params: { keyword },
      timeout: 10000, // 10초 타임아웃
    });

    const list = response.data?.channels ?? [];
    const result = await Promise.all(
      list.map(async (item) => {
        try {
          const liveStatus = await getLiveStatus(item.id, "youtube");
          return {
            ...liveStatus,
            id: item.id,
            platform: "youtube",
          };
        } catch (e) {
          return null;
        }
      })
    );

    return result.filter((item) => item !== null);
  } catch (error) {
    console.error("❌ [YouTube] 검색 실패:", error.message || error);
    // Network Error나 timeout이 발생해도 빈 배열 반환
    return [];
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

  if (platform === "youtube") {
    return await getYoutubeSearch(keyword);
  }

  console.warn(`⚠️ 지원하지 않는 플랫폼: ${platform}`);
  return [];
};

export const searchAllPlatforms = async (keyword, limit = 6) => {
  // 각 플랫폼별로 검색 실행 (활성화된 것만)
  const searchPromises = [];
  
  if (ENABLE_CHZZK) {
    searchPromises.push(
      getChzzkSearch(keyword).catch(err => {
        console.error("❌ [searchAll] Chzzk 검색 실패:", err.message);
        return [];
      })
    );
  } else {
    searchPromises.push(Promise.resolve([]));
  }
  
  if (ENABLE_SOOP) {
    searchPromises.push(
      getSoopSearch(keyword).catch(err => {
        console.error("❌ [searchAll] Soop 검색 실패:", err.message);
        return [];
      })
    );
  } else {
    searchPromises.push(Promise.resolve([]));
  }
  
  if (ENABLE_YOUTUBE) {
    searchPromises.push(
      getYoutubeSearch(keyword).catch(err => {
        console.error("❌ [searchAll] YouTube 검색 실패:", err.message);
        return [];
      })
    );
  } else {
    searchPromises.push(Promise.resolve([]));
  }

  const [chzzk, soop, youtube] = await Promise.all(searchPromises);

  const CHZZK_WEIGHT = 1002;
  const SOOP_WEIGHT = 1001;
  const YOUTUBE_WEIGHT = 1000;

  const normalized = [
    ...chzzk.map((item, i) => ({
      ...item,
      _score: CHZZK_WEIGHT - i * 10,
    })),
    ...soop.map((item, i) => ({
      ...item,
      _score: SOOP_WEIGHT - i * 10,
    })),
    ...youtube.map((item, i) => ({
      ...item,
      _score: YOUTUBE_WEIGHT - i * 10,
    })),
  ];

  return normalized.sort((a, b) => b._score - a._score).slice(0, limit);
};
