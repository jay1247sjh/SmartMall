/**
 * 共享工具类型
 * TypeScript 通用工具类型，跨领域使用
 */

/**
 * Nullable<T>
 * 表示一个值可以是 T 类型或 null
 * 
 * @example
 * ```typescript
 * const name: Nullable<string> = null; // ✓
 * const age: Nullable<number> = 25;    // ✓
 * ```
 */
export type Nullable<T> = T | null

/**
 * Optional<T>
 * 表示一个值可以是 T 类型或 undefined
 * 
 * @example
 * ```typescript
 * const email: Optional<string> = undefined; // ✓
 * const count: Optional<number> = 10;        // ✓
 * ```
 */
export type Optional<T> = T | undefined

/**
 * DeepPartial<T>
 * 递归地将对象的所有属性变为可选
 * 用于部分更新对象、配置合并等场景
 * 
 * @example
 * ```typescript
 * interface Config {
 *   server: {
 *     host: string;
 *     port: number;
 *   };
 * }
 * 
 * const partialConfig: DeepPartial<Config> = {
 *   server: { port: 3000 } // host 可以省略
 * };
 * ```
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * DeepReadonly<T>
 * 递归地将对象的所有属性变为只读
 * 用于确保数据不可变性
 * 
 * @example
 * ```typescript
 * interface User {
 *   profile: {
 *     name: string;
 *   };
 * }
 * 
 * const user: DeepReadonly<User> = {
 *   profile: { name: 'Alice' }
 * };
 * // user.profile.name = 'Bob'; // ✗ 编译错误
 * ```
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * ValueOf<T>
 * 获取对象所有值的联合类型
 * 
 * @example
 * ```typescript
 * const Colors = {
 *   RED: '#ff0000',
 *   GREEN: '#00ff00',
 *   BLUE: '#0000ff'
 * } as const;
 * 
 * type ColorValue = ValueOf<typeof Colors>; // '#ff0000' | '#00ff00' | '#0000ff'
 * ```
 */
export type ValueOf<T> = T[keyof T]

/**
 * RequiredKeys<T>
 * 提取对象中必填的键
 * 
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email?: string;
 * }
 * 
 * type Required = RequiredKeys<User>; // 'id' | 'name'
 * ```
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]

/**
 * OptionalKeys<T>
 * 提取对象中可选的键
 * 
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email?: string;
 * }
 * 
 * type Optional = OptionalKeys<User>; // 'email'
 * ```
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

/**
 * Prettify<T>
 * 展开类型定义，使其在 IDE 中更易读
 * 
 * @example
 * ```typescript
 * type A = { a: string } & { b: number };
 * type B = Prettify<A>; // { a: string; b: number }
 * ```
 */
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

/**
 * NonEmptyArray<T>
 * 表示至少包含一个元素的数组
 * 
 * @example
 * ```typescript
 * const items: NonEmptyArray<string> = ['a']; // ✓
 * const empty: NonEmptyArray<string> = [];    // ✗ 类型错误
 * ```
 */
export type NonEmptyArray<T> = [T, ...T[]]

/**
 * Mutable<T>
 * 移除对象所有属性的 readonly 修饰符
 * 
 * @example
 * ```typescript
 * interface ReadonlyUser {
 *   readonly id: string;
 *   readonly name: string;
 * }
 * 
 * type MutableUser = Mutable<ReadonlyUser>;
 * // { id: string; name: string; }
 * ```
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

/**
 * PickByValue<T, V>
 * 根据值类型筛选对象的键
 * 
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   age: number;
 *   name: string;
 * }
 * 
 * type StringKeys = PickByValue<User, string>; // { id: string; name: string; }
 * ```
 */
export type PickByValue<T, V> = Pick<T, {
  [K in keyof T]: T[K] extends V ? K : never
}[keyof T]>

/**
 * OmitByValue<T, V>
 * 根据值类型排除对象的键
 * 
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   age: number;
 *   name: string;
 * }
 * 
 * type NonStringKeys = OmitByValue<User, string>; // { age: number; }
 * ```
 */
export type OmitByValue<T, V> = Pick<T, {
  [K in keyof T]: T[K] extends V ? never : K
}[keyof T]>
