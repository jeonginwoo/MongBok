import axios from "axios";

const chzzkApi = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const getChzzkLiveDetail = async (channelId) => {
  try {
    const response = await chzzkApi.get(`/service/v3.2/channels/${channelId}/live-detail`);
    return response.data;
  } catch (error) {
    console.error("❌ 라이브 정보 가져오기 실패:", error);
    throw error;
  }
};

export const getChzzkLiveStatus = async (channelId) => {
  try {
    const response = await chzzkApi.get(`/polling/v3.1/channels/${channelId}/live-status`);
    return response.data;
  } catch (error) {
    console.error("❌ 라이브 상태 가져오기 실패:", error);
    throw error;
  }
};
