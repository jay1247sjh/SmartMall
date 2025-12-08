import antfu from '@antfu/eslint-config'

// ESLint 配置 - 使用 @antfu/eslint-config 预设
// 文档: https://github.com/antfu/eslint-config
export default antfu({
  // 启用 Vue 支持
  vue: true,
  
  // 启用 TypeScript 支持
  typescript: true,
  
  // 启用格式化器支持
  formatters: {
    css: true,      // CSS 格式化
    html: true,     // HTML 格式化
    markdown: true  // Markdown 格式化
  },
  
  // 自定义规则
  rules: {
    'no-console': 'warn',                      // console 语句警告（生产环境应移除）
    'vue/multi-word-component-names': 'off',   // 允许单词组件名（如 App.vue）
    '@typescript-eslint/no-explicit-any': 'warn' // any 类型警告
  }
})
