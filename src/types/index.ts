import type { Ref, ComputedRef } from 'vue'

/**
 * TOTP Token 数据结构
 */
export interface Token {
  readonly id: string
  name: string
  secret: string
  readonly createdAt: number
}

/**
 * 创建或更新 Token 的输入数据
 */
export type TokenInput = Omit<Token, 'id' | 'createdAt'>

/**
 * Token Repository 接口
 */
export interface TokenRepository {
  getAll(): Token[]
  getById(id: string): Token | null
  create(data: TokenInput): Token
  update(id: string, updates: Partial<TokenInput>): Token
  delete(id: string): boolean
}

/**
 * Composable 返回的倒计时状态
 */
export interface CountdownState {
  readonly remainingSeconds: Ref<number>
  readonly progress: ComputedRef<number>
  readonly isExpiringSoon: ComputedRef<boolean>
}

/**
 * Composable 返回的 TOTP 状态
 */
export interface TOTPState extends CountdownState {
  readonly code: Ref<string>
}

/**
 * TOTP URI 解析结果
 */
export interface ParsedTotpUri {
  name: string
  secret: string
  algorithm?: string
  digits?: number
  period?: number
}
