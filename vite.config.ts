import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 9527,
    proxy: {
      '/APS': {
        target: 'http://aps-a8fk.dev.hxcz-cloud.com/FKAPI/', 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/APS/, '')
      },
    }
  },
})
