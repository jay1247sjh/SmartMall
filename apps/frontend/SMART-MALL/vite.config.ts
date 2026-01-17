import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// Vite 配置文档: https://vite.dev/config/
export default defineConfig({

  // Vue 插件配置
  plugins: [vue()],
  
  // 开发服务器配置
  server: {
    port: 5173,
    // API 代理配置
    proxy: {
      // 后端 API - 运行在 8081 端口
      // 所有 /api 请求都转发到 Java 后端，包括 AI 相关接口
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      }
    }
  },
  
  // 模块解析配置
  resolve: {
    // 路径别名配置 - 简化导入路径
    alias: {
      '@': path.resolve(__dirname, './src'),                    // 根目录别名
      '@types': path.resolve(__dirname, './src/types'),         // 类型定义
      '@domain': path.resolve(__dirname, './src/domain'),       // 领域场景层
      '@stores': path.resolve(__dirname, './src/stores'),       // Pinia 状态管理
      '@agent': path.resolve(__dirname, './src/agent'),         // AI Agent 模块
      '@components': path.resolve(__dirname, './src/components'), // Vue 组件
      '@views': path.resolve(__dirname, './src/views'),         // 页面视图
      '@api': path.resolve(__dirname, './src/api'),             // API 接口
      '@engine': path.resolve(__dirname, './src/engine'),       // 3D 引擎层
      '@builder': path.resolve(__dirname, './src/builder'),     // 建模器模块
      '@protocol': path.resolve(__dirname, './src/protocol'),   // 协议层
      '@shared': path.resolve(__dirname, './src/shared')        // 共享模块
    }
  }
})
