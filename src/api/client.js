import axios from "axios";

export const chzzk_client = axios.create({
  baseURL: "/chzzk_api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const soop_channel_client = axios.create({
  baseURL: "/soop_channel_api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const soop_search_client = axios.create({
  baseURL: "/soop_search_api",
  headers: {
    "Content-Type": "application/json",
  },
});
