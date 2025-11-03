import axios from "axios";

const chzzkApi = axios.create({
  baseURL: "/api/service/v3.2", // ✅ 프록시를 통해 요청
  headers: {
    "Content-Type": "application/json",
  },
});

export const getChzzkLiveDetail = async (channelId) => {
  try {
    const response = await chzzkApi.get(`/channels/${channelId}/live-detail`);
    return response.data;
  } catch (error) {
    console.error("❌ 라이브 정보 가져오기 실패:", error);
    throw error;
  }
};
