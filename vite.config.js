import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/chzzk_api": {
        target: "https://api.chzzk.naver.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chzzk_api/, ""),
      },
      "/soop_channel_api": {
        target: "https://chapi.sooplive.co.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/soop_channel_api/, ""),
      },
      "/soop_search_api": {
        target: "https://sch.sooplive.co.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/soop_search_api/, ""),
      },
    },
  },
})
