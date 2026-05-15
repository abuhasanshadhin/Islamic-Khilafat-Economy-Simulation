import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // listen on all addresses so container -> host access works
    host: true,
    port: 5173,
    // enable polling-based file watch which is more reliable across Docker/Windows mounts
    watch: {
      usePolling: true
    }
  }
})
