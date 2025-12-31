export { BaseTokenRepository } from './ITokenRepository'
export { LocalStorageRepository } from './LocalStorageRepository'

// 导出默认实例
import { LocalStorageRepository } from './LocalStorageRepository'
export const tokenRepository = new LocalStorageRepository()
