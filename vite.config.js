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
      "/chzzk_game": {
        target: "https://comm-api.game.naver.com/nng_main",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chzzk_game/, ""),
      },
    },
  },
})
