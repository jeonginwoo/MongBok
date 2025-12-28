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
      "/api/chzzk/chat": {
        target: "https://comm-api.game.naver.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chzzk\/chat/, ""),
      },
      "/api/chzzk/live": {
        target: "https://api.chzzk.naver.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/chzzk\/live/, ""),
      },
      "/api/soop/channel": {
        target: "https://chapi.sooplive.co.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/soop\/channel/, ""),
      },
      "/api/soop/search": {
        target: "https://sch.sooplive.co.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/soop\/search/, ""),
      },
      "/api/soop/live": {
        target: "https://live.sooplive.co.kr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/soop\/live/, ""),
      },
      "/api/soop/station": {
        target: "https://bjapi.afreecatv.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/soop\/station/, ""),
      },
    },
  },
})
