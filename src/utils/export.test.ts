import { describe, it, expect } from 'vitest'
import type { Token } from '../types'
import {
  exportToJSON,
  importFromJSON,
  exportEncrypted,
  importEncrypted,
  isEncryptedFile
} from './export'

describe('export utils', () => {
  const mockTokens: Token[] = [
    {
      id: '1',
      name: 'Test Account 1',
      secret: 'JBSWY3DPEHPK3PXP',
      createdAt: 1704124800000
    },
    {
      id: '2',
      name: 'Test Account 2',
      secret: 'HXDMVJECJJWSRB3H',
      createdAt: 1704124900000
    }
  ]

  describe('exportToJSON', () => {
    it('should export tokens to JSON format', () => {
      const result = exportToJSON(mockTokens)

      expect(result.content).toBeTruthy()
      expect(result.filename).toMatch(/totp-backup-\d{8}\.json/)

      const data = JSON.parse(result.content)
      expect(data.version).toBe('1.0')
      expect(data.tokens).toHaveLength(2)
      expect(data.tokens[0]).toEqual({
        name: 'Test Account 1',
        secret: 'JBSWY3DPEHPK3PXP'
      })
    })

    it('should not include id and createdAt in export', () => {
      const result = exportToJSON(mockTokens)
      const data = JSON.parse(result.content)

      expect(data.tokens[0]).not.toHaveProperty('id')
      expect(data.tokens[0]).not.toHaveProperty('createdAt')
    })
  })

  describe('importFromJSON', () => {
    it('should import tokens from JSON', () => {
      const json = JSON.stringify({
        version: '1.0',
        exported_at: Date.now(),
        tokens: [
          { name: 'Account 1', secret: 'SECRET1' },
          { name: 'Account 2', secret: 'SECRET2' }
        ]
      })

      const result = importFromJSON(json, [])

      expect(result.total).toBe(2)
      expect(result.tokens).toHaveLength(2)
      expect(result.duplicates).toHaveLength(0)
    })

    it('should detect duplicate names', () => {
      const json = JSON.stringify({
        version: '1.0',
        exported_at: Date.now(),
        tokens: [
          { name: 'Test Account 1', secret: 'SECRET1' },
          { name: 'New Account', secret: 'SECRET2' }
        ]
      })

      const result = importFromJSON(json, mockTokens)

      expect(result.total).toBe(2)
      expect(result.duplicates).toEqual(['Test Account 1'])
    })

    it('should throw error for invalid format', () => {
      expect(() => importFromJSON('invalid json', [])).toThrow()
      expect(() => importFromJSON('{"invalid": true}', [])).toThrow('无效的备份文件格式')
    })

    it('should skip invalid tokens', () => {
      const json = JSON.stringify({
        version: '1.0',
        exported_at: Date.now(),
        tokens: [
          { name: 'Valid', secret: 'SECRET1' },
          { name: '', secret: 'SECRET2' }, // invalid
          { name: 'Valid2' }, // missing secret
          { name: 'Valid3', secret: 'SECRET3' }
        ]
      })

      const result = importFromJSON(json, [])

      expect(result.total).toBe(2)
      expect(result.tokens).toHaveLength(2)
    })
  })

  describe('encryption/decryption', () => {
    const password = 'TestPassword123!'

    it('should encrypt and decrypt tokens', async () => {
      // 导出加密
      const exportResult = await exportEncrypted(mockTokens, password)

      expect(exportResult.content).toBeTruthy()
      expect(exportResult.filename).toMatch(/totp-backup-encrypted-\d{8}\.json/)

      const encryptedData = JSON.parse(exportResult.content)
      expect(encryptedData.version).toBe('1.0')
      expect(encryptedData.encrypted).toBe(true)
      expect(encryptedData.data).toBeTruthy()
      expect(encryptedData.salt).toBeTruthy()
      expect(encryptedData.iv).toBeTruthy()

      // 导入解密
      const importResult = await importEncrypted(exportResult.content, password, [])

      expect(importResult.total).toBe(2)
      expect(importResult.tokens[0]).toEqual({
        name: 'Test Account 1',
        secret: 'JBSWY3DPEHPK3PXP'
      })
    })

    it('should fail with wrong password', async () => {
      const exportResult = await exportEncrypted(mockTokens, password)

      await expect(
        importEncrypted(exportResult.content, 'WrongPassword', [])
      ).rejects.toThrow('密码错误或文件已损坏')
    })

    it('should fail with invalid encrypted format', async () => {
      const invalidData = JSON.stringify({
        encrypted: true,
        data: 'invalid'
      })

      await expect(
        importEncrypted(invalidData, password, [])
      ).rejects.toThrow('无效的加密备份文件格式')
    })
  })

  describe('isEncryptedFile', () => {
    it('should detect encrypted file', () => {
      const encrypted = JSON.stringify({ encrypted: true })
      const unencrypted = JSON.stringify({ version: '1.0' })

      expect(isEncryptedFile(encrypted)).toBe(true)
      expect(isEncryptedFile(unencrypted)).toBe(false)
    })

    it('should return false for invalid JSON', () => {
      expect(isEncryptedFile('invalid json')).toBe(false)
    })
  })
})
