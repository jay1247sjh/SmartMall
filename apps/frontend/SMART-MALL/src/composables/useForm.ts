/**
 * useForm Composable
 * 
 * 通用表单状态管理 composable，提供表单数据管理、验证、重置、脏状态跟踪等功能
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'

/**
 * 表单错误类型
 */
export type FormErrors<T> = Partial<Record<keyof T, string>>

/**
 * useForm 配置选项
 */
export interface UseFormOptions<T extends Record<string, any>> {
  /** 表单初始值 */
  initialValues: T
  /** 验证函数 */
  validate?: (values: T) => FormErrors<T> | Promise<FormErrors<T>>
  /** 提交回调 */
  onSubmit?: (values: T) => void | Promise<void>
}

/**
 * useForm 返回类型
 */
export interface UseFormReturn<T extends Record<string, any>> {
  /** 表单值 */
  values: Ref<T>
  /** 表单错误 */
  errors: Ref<FormErrors<T>>
  /** 字段触摸状态 */
  touched: Ref<Record<keyof T, boolean>>
  /** 表单是否脏（已修改） */
  isDirty: ComputedRef<boolean>
  /** 表单是否有效 */
  isValid: ComputedRef<boolean>
  /** 是否正在提交 */
  isSubmitting: Ref<boolean>
  /** 设置字段值 */
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void
  /** 设置字段错误 */
  setFieldError: <K extends keyof T>(field: K, error: string) => void
  /** 设置字段触摸状态 */
  setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void
  /** 验证单个字段 */
  validateField: <K extends keyof T>(field: K) => Promise<boolean>
  /** 验证整个表单 */
  validateForm: () => Promise<boolean>
  /** 重置表单 */
  resetForm: (values?: Partial<T>) => void
  /** 提交表单 */
  submitForm: () => Promise<void>
  /** 序列化表单状态 */
  serialize: () => string
  /** 反序列化表单状态 */
  deserialize: (json: string) => void
}

/**
 * 深拷贝对象
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 比较两个值是否相等
 */
function isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * 表单状态管理 Composable
 * 
 * @param options - 配置选项
 * @returns 表单状态和方法
 * 
 * @example
 * ```ts
 * const { values, errors, isDirty, submitForm } = useForm({
 *   initialValues: { name: '', email: '' },
 *   validate: (values) => {
 *     const errors: FormErrors<typeof values> = {}
 *     if (!values.name) errors.name = '名称不能为空'
 *     if (!values.email) errors.email = '邮箱不能为空'
 *     return errors
 *   },
 *   onSubmit: async (values) => {
 *     await api.submit(values)
 *   }
 * })
 * ```
 */
export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const { initialValues, validate, onSubmit } = options

  // 保存初始值的深拷贝
  const initialValuesCopy = deepClone(initialValues)

  // 表单状态
  const values = ref<T>(deepClone(initialValues)) as Ref<T>
  const errors = ref<FormErrors<T>>({}) as Ref<FormErrors<T>>
  const touched = ref<Record<keyof T, boolean>>(
    Object.keys(initialValues).reduce((acc, key) => {
      acc[key as keyof T] = false
      return acc
    }, {} as Record<keyof T, boolean>)
  ) as Ref<Record<keyof T, boolean>>
  const isSubmitting = ref(false)

  // 计算属性：表单是否脏
  const isDirty = computed(() => {
    return !isEqual(values.value, initialValuesCopy)
  })

  // 计算属性：表单是否有效
  const isValid = computed(() => {
    return Object.keys(errors.value).length === 0
  })

  /**
   * 设置字段值
   */
  function setFieldValue<K extends keyof T>(field: K, value: T[K]): void {
    values.value[field] = value
  }

  /**
   * 设置字段错误
   */
  function setFieldError<K extends keyof T>(field: K, error: string): void {
    errors.value[field] = error
  }

  /**
   * 设置字段触摸状态
   */
  function setFieldTouched<K extends keyof T>(field: K, isTouched = true): void {
    touched.value[field] = isTouched
  }

  /**
   * 验证单个字段
   */
  async function validateField<K extends keyof T>(field: K): Promise<boolean> {
    if (!validate) return true

    const allErrors = await validate(values.value)
    const fieldError = allErrors[field]

    if (fieldError) {
      errors.value[field] = fieldError
      return false
    } else {
      delete errors.value[field]
      return true
    }
  }

  /**
   * 验证整个表单
   */
  async function validateForm(): Promise<boolean> {
    if (!validate) {
      errors.value = {}
      return true
    }

    const validationErrors = await validate(values.value)
    errors.value = validationErrors
    return Object.keys(validationErrors).length === 0
  }

  /**
   * 重置表单
   */
  function resetForm(newValues?: Partial<T>): void {
    if (newValues) {
      values.value = deepClone({ ...initialValuesCopy, ...newValues }) as T
    } else {
      values.value = deepClone(initialValuesCopy) as T
    }
    errors.value = {}
    touched.value = Object.keys(initialValues).reduce((acc, key) => {
      acc[key as keyof T] = false
      return acc
    }, {} as Record<keyof T, boolean>)
  }

  /**
   * 提交表单
   */
  async function submitForm(): Promise<void> {
    // 标记所有字段为已触摸
    Object.keys(values.value).forEach((key) => {
      touched.value[key as keyof T] = true
    })

    // 验证表单
    const isFormValid = await validateForm()
    if (!isFormValid) return

    // 执行提交
    if (onSubmit) {
      isSubmitting.value = true
      try {
        await onSubmit(values.value)
      } finally {
        isSubmitting.value = false
      }
    }
  }

  /**
   * 序列化表单状态
   */
  function serialize(): string {
    return JSON.stringify({
      values: values.value,
      errors: errors.value,
      touched: touched.value
    })
  }

  /**
   * 反序列化表单状态
   */
  function deserialize(json: string): void {
    try {
      const state = JSON.parse(json)
      if (state.values) {
        values.value = state.values
      }
      if (state.errors) {
        errors.value = state.errors
      }
      if (state.touched) {
        touched.value = state.touched
      }
    } catch (e) {
      console.error('Failed to deserialize form state:', e)
    }
  }

  return {
    values,
    errors,
    touched,
    isDirty,
    isValid,
    isSubmitting,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateForm,
    resetForm,
    submitForm,
    serialize,
    deserialize
  }
}
