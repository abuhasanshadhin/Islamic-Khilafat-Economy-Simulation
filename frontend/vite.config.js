import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Prefer backend on localhost:3000 for local dev; docker-compose sets VITE_API_PROXY_TARGET
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [vue()],
    server: {
      // listen on all addresses so container -> host access works
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true
        },
        '/socket.io': {
          target: proxyTarget,
          changeOrigin: true,
          ws: true
        }
      },
      // enable polling-based file watch which is more reliable across Docker/Windows mounts
      watch: {
        usePolling: true
      }
    }
  }
})
