import axios from "axios";

const chzzkApi = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const getChzzkChannelsImageUrl = async (channelId) => {
  try {
    const response = await chzzkApi.get(`/service/v1/channels/${channelId}`);
    return response.data?.content?.channelImageUrl ?? null;
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
      status: data?.content?.status ?? "UNKNOWN",
      userCount: data?.content?.status === "CLOSE" ? 0 : data?.content?.concurrentUserCount ?? 0,
    };
  } catch (error) {
    console.error("❌ 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};
