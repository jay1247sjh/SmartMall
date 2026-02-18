---
inclusion: fileMatch
fileMatchPattern: "**/*.vue"
---

# i18n 国际化规范

## 核心规则

所有用户可见的 UI 文本必须通过 `t()` 函数获取，禁止在模板或脚本中硬编码自然语言字符串。

## 键名命名约定

格式：`模块.功能.描述`

| 层级 | 说明 | 示例 |
|------|------|------|
| 模块 | 业务模块名 | `ai`, `nav`, `settings`, `auth`, `merchant` |
| 功能 | 功能区域 | `sidebar`, `panel`, `quick`, `steps` |
| 描述 | 具体含义 | `title`, `placeholder`, `errorTimeout` |

示例：
- `ai.sidebar.title` — AI 侧边栏标题
- `settings.backToHome` — 设置面板返回首页
- `merchant.product.createSuccess` — 商品创建成功提示

## 语言文件

项目支持 8 种语言，文件位于 `src/i18n/locales/`：

| 文件 | 语言 |
|------|------|
| `en.json` | English（默认 / fallback） |
| `zh-CN.json` | 简体中文 |
| `zh-TW.json` | 繁體中文 |
| `ja.json` | 日本語 |
| `ko.json` | 한국어 |
| `es.json` | Español |
| `fr.json` | Français |
| `de.json` | Deutsch |

新增键值时必须同步更新全部 8 个文件。

## 代码示例

```vue
<!-- ✅ 正确：使用 t() -->
<template>
  <span>{{ t('settings.backToHome') }}</span>
  <ElButton>{{ t('common.confirm') }}</ElButton>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<!-- ❌ 错误：硬编码中文 -->
<template>
  <span>返回首页</span>
  <ElButton>确认</ElButton>
</template>
```

## 动态参数

```vue
<!-- 带参数的翻译 -->
<span>{{ t('admin.floorCount', { count: floors.length }) }}</span>
```

对应 JSON：
```json
{
  "admin": {
    "floorCount": "{count} Floors"
  }
}
```

## 验证清单

- [ ] 模板中是否有硬编码的自然语言文本？
- [ ] 新增的 i18n 键是否同步到全部 8 个语言文件？
- [ ] 键名是否遵循 `模块.功能.描述` 格式？
- [ ] 是否使用 `useI18n()` 的 `t()` 函数？
