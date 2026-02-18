/**
 * vue-i18n 国际化配置
 *
 * Composition API 模式，默认语言 English，fallback English。
 * 非英文语言包通过动态 import 懒加载。
 */
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en },
})

export default i18n
