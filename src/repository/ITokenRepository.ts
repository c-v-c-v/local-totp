import type { Token, TokenInput, TokenRepository } from '../types'

/**
 * Token Repository 抽象基类
 */
export abstract class BaseTokenRepository implements TokenRepository {
  abstract getAll(): Token[]
  abstract getById(id: string): Token | null
  abstract create(data: TokenInput): Token
  abstract update(id: string, updates: Partial<TokenInput>): Token
  abstract delete(id: string): boolean
}
