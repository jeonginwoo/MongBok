import axios from "axios";

export const chzzk_client = axios.create({
  baseURL: "/api/chzzk/live",
  headers: {
    "Content-Type": "application/json",
  },
});

export const soop_channel_client = axios.create({
  baseURL: "/api/soop/station",
  headers: {
    "Content-Type": "application/json",
  },
});

export const soop_search_client = axios.create({
  baseURL: "/api/soop/search",
  headers: {
    "Content-Type": "application/json",
  },
});

export const soop_live_client = axios.create({
  baseURL: "/api/soop/live",
  headers: {
    "Content-Type": "application/json",
  },
});

export const youtube_search_client = axios.create({
  baseURL: "/api/youtube/search",
  headers: {
    "Content-Type": "application/json",
  },
});

export const youtube_channel_client = axios.create({
  baseURL: "/api/youtube/channel",
  headers: {
    "Content-Type": "application/json",
  },
});

export const youtube_chat_client = axios.create({
  baseURL: "/api/youtube/chat",
  headers: {
    "Content-Type": "application/json",
  },
});
