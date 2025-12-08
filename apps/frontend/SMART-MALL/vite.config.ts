import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// Vite 配置文档: https://vite.dev/config/
export default defineConfig({
  // Vue 插件配置
  plugins: [vue()],
  
  // 模块解析配置
  resolve: {
    // 路径别名配置 - 简化导入路径
    alias: {
      '@': path.resolve(__dirname, './src'),                    // 根目录别名
      '@types': path.resolve(__dirname, './src/types'),         // 类型定义
      '@three': path.resolve(__dirname, './src/three'),         // Three.js 渲染引擎层
      '@domain': path.resolve(__dirname, './src/domain'),       // 领域场景层
      '@orchestrator': path.resolve(__dirname, './src/orchestrator'), // 业务协调层
      '@stores': path.resolve(__dirname, './src/stores'),       // Pinia 状态管理
      '@agent': path.resolve(__dirname, './src/agent'),         // AI Agent 模块
      '@components': path.resolve(__dirname, './src/components'), // Vue 组件
      '@views': path.resolve(__dirname, './src/views'),         // 页面视图
      '@utils': path.resolve(__dirname, './src/utils'),         // 工具函数
      '@api': path.resolve(__dirname, './src/api')              // API 接口
    }
  }
})
