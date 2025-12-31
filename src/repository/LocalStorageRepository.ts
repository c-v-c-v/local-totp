import { BaseTokenRepository } from './ITokenRepository'
import { generateId } from '../utils/helpers'
import type { Token, TokenInput } from '../types'

/**
 * LocalStorage 实现的 Token Repository
 */
export class LocalStorageRepository extends BaseTokenRepository {
  private storageKey: string

  constructor(storageKey: string = 'totp_tokens') {
    super()
    this.storageKey = storageKey
  }

  /**
   * 从 LocalStorage 读取数据
   */
  private _loadFromStorage(): Token[] {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return []
    }
  }

  /**
   * 保存数据到 LocalStorage
   */
  private _saveToStorage(tokens: Token[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(tokens))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  getAll(): Token[] {
    return this._loadFromStorage()
  }

  getById(id: string): Token | null {
    const tokens = this._loadFromStorage()
    return tokens.find(token => token.id === id) || null
  }

  create(tokenData: TokenInput): Token {
    const tokens = this._loadFromStorage()
    const newToken: Token = {
      id: generateId(),
      name: tokenData.name,
      secret: tokenData.secret,
      createdAt: Date.now()
    }
    tokens.push(newToken)
    this._saveToStorage(tokens)
    return newToken
  }

  update(id: string, updates: Partial<TokenInput>): Token {
    const tokens = this._loadFromStorage()
    const index = tokens.findIndex(token => token.id === id)
    
    if (index === -1) {
      throw new Error(`Token with id ${id} not found`)
    }
    
    tokens[index] = { ...tokens[index], ...updates }
    this._saveToStorage(tokens)
    return tokens[index]
  }

  delete(id: string): boolean {
    const tokens = this._loadFromStorage()
    const filteredTokens = tokens.filter(token => token.id !== id)
    
    if (filteredTokens.length === tokens.length) {
      return false // 没有找到要删除的项
    }
    
    this._saveToStorage(filteredTokens)
    return true
  }
}
