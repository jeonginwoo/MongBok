import { ChzzkClient } from "chzzk"

const client = new ChzzkClient({
    baseUrls: {
        chzzkBaseUrl: "/chzzk_api",
        gameBaseUrl: "/chzzk_game"
    }
})

export const getChzzkLiveStatus = async (channelId) => {
  try {
    const data = await client.live.detail(channelId);

    return {
      name: data?.channel?.channelName ?? "",
      imageUrl: data?.channel?.channelImageUrl ?? null,
      liveTitle: data?.liveTitle ?? "",
      openDate: data?.openDate ?? null,
      isLive: data?.status === "OPEN",
      userCount: data?.status === "CLOSE" ? 0 : data?.concurrentUserCount ?? 0,
    };
  } catch (error) {
    console.error("❌ 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};

export const getChzzkAllChannelsData = async (localStorageData) => {
  const entries = Object.entries(localStorageData);
  const result = {};

  await Promise.all(
    entries.map(async ([channelId, item]) => {
      try {
        const live = await getChzzkLiveStatus(channelId)

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