import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@types': path.resolve(__dirname, './src/types'),
      '@three': path.resolve(__dirname, './src/three'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@orchestrator': path.resolve(__dirname, './src/orchestrator'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@agent': path.resolve(__dirname, './src/agent'),
      '@components': path.resolve(__dirname, './src/components'),
      '@views': path.resolve(__dirname, './src/views'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@api': path.resolve(__dirname, './src/api'),
    },
  },
})
