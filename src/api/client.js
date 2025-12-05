import axios from "axios";

export const chzzk_client = axios.create({
  baseURL: "/api/chzzk",
  headers: {
    "Content-Type": "application/json",
  },
});

export const soop_channel_client = axios.create({
  baseURL: "/api/soop/channel",
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
