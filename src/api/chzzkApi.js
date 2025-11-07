import axios from "axios";

const chzzkApi = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const getChzzkChannelInfo = async (channelId) => {
  try {
    const response = await chzzkApi.get(`/service/v1/channels/${channelId}`);
    const data = response.data;
    return {
      name: data?.content?.channelName ?? "",
      imageUrl: data?.content?.channelImageUrl ?? null,
    };
  } catch (error) {
    console.error("❌ 채널 이미지 가져오기 실패:", error);
    throw error;
  }
};

export const getChzzkLiveStatus = async (channelId) => {
  try {
    const response = await chzzkApi.get(`/polling/v3.1/channels/${channelId}/live-status`);
    const data = response.data;
    return {
      liveTitle: data?.content?.liveTitle ?? "",
      openDate: data?.content?.openDate ?? null,
      isLive: data?.content?.status === "OPEN",
      userCount: data?.content?.status === "CLOSE" ? 0 : data?.content?.concurrentUserCount ?? 0,
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
        const [info, live] = await Promise.all([
          getChzzkChannelInfo(channelId),
          getChzzkLiveStatus(channelId),
        ]);

        result[channelId] = {
          id: channelId,
          isVisible: item.isVisible ?? false,
          name: info.name,
          liveTitle: live.liveTitle,
          openDate: live.openDate,
          isLive: live.isLive,
          userCount: live.userCount,
          imageUrl: info.imageUrl,
          zoneId: item.zoneId,
          platform: item.platform,
        };
      } catch (error) {
        console.error(`⚠️ ${channelId} 데이터 불러오기 실패:`, error);
      }
    })
  );

  return result;
};