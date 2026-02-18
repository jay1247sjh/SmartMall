/**
 * 注册表单纯验证函数
 *
 * 从 RegisterView.vue 中提取的验证逻辑，
 * 便于单元测试和属性测试直接调用。
 */

/**
 * 验证用户名格式
 * 规则：3-20 字符，仅允许字母、数字、下划线
 * @returns 错误信息字符串，空字符串表示验证通过
 */
export function validateUsername(value: string): string {
  if (!value) return ''
  if (value.length < 3) return '用户名至少3个字符'
  if (value.length > 20) return '用户名最多20个字符'
  if (!/^[a-zA-Z0-9_]+$/.test(value)) return '只能包含字母、数字和下划线'
  return ''
}

/**
 * 验证邮箱格式
 * @returns 错误信息字符串，空字符串表示验证通过
 */
export function validateEmail(value: string): string {
  if (!value) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '邮箱格式不正确'
  return ''
}

/**
 * 验证密码长度
 * 规则：至少 6 字符
 * @returns 错误信息字符串，空字符串表示验证通过
 */
export function validatePassword(value: string): string {
  if (!value) return ''
  if (value.length < 6) return '密码至少6个字符'
  return ''
}

/**
 * 验证确认密码一致性
 * @returns 错误信息字符串，空字符串表示验证通过
 */
export function validateConfirmPassword(confirmPassword: string, password: string): string {
  if (!confirmPassword) return ''
  if (confirmPassword !== password) return '两次密码不一致'
  return ''
}

/**
 * 验证手机号格式
 * 规则：11 位中国大陆手机号（1 开头，第二位 3-9）
 * @returns 错误信息字符串，空字符串表示验证通过
 */
export function validatePhone(value: string): string {
  if (!value) return ''
  if (!/^1[3-9]\d{9}$/.test(value)) return '手机号格式不正确'
  return ''
}

/**
 * 表单字段输入
 */
export interface FormFields {
  username: string
  email: string
  password: string
  confirmPassword: string
  phone: string
}

/**
 * 计算表单是否有效（可以提交）
 *
 * 条件：
 * 1. 所有必填字段（username, email, password, confirmPassword）非空
 * 2. 所有验证函数返回空字符串（无格式错误）
 *
 * 注意：此函数不检查可用性状态（usernameAvailable / emailAvailable），
 * 那部分由 RegisterView.vue 的 computed 额外处理。
 *
 * @returns true 表示表单有效，false 表示无效
 */
export function isFormValid(fields: FormFields): boolean {
  const { username, email, password, confirmPassword, phone } = fields

  // 必填字段非空检查
  if (!username || !email || !password || !confirmPassword) {
    return false
  }

  // 所有验证函数无错误
  if (validateUsername(username) !== '') return false
  if (validateEmail(email) !== '') return false
  if (validatePassword(password) !== '') return false
  if (validateConfirmPassword(confirmPassword, password) !== '') return false
  if (validatePhone(phone) !== '') return false

  return true
}
