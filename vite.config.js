import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // ← ← ← ← ← ←
    https:false,
    host: "0.0.0.0", // ← 新增内容 ←
    hmr: true, //开启热更新
    // proxy: {
    //   "/api": {
    //     // target: 'http://192.188.32.66:8500/',  // 李芳园
    //     // target: "http://192.188.239.49:8000/", // 何亚森
    //     // target: 'http://192.188.233.31:8000/', // 本地
    //     // target: "http://10.10.16.6:8000/", //客户
    //     target: 'http://192.188.32.66:8000/', //云桌面
    //     // target: 'http://192.188.32.66:8103/', //邹工
    //     // target:'http://192.188.32.66:8181/',//严工,
    //     // target: env.VITE_APP_BASEURL,
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ""),
    //   },
    // },
  },
})
