import type { Token, TokenInput } from '../types'

/**
 * 导出数据格式
 */
interface ExportData {
  version: string
  exported_at: number
  tokens: TokenInput[]
}

/**
 * 加密导出数据格式
 */
interface EncryptedExportData {
  version: string
  encrypted: true
  data: string
  salt: string
  iv: string
}

/**
 * 导出结果
 */
export interface ExportResult {
  content: string
  filename: string
}

/**
 * 导入结果
 */
export interface ImportResult {
  tokens: TokenInput[]
  total: number
  duplicates: string[]
}

/**
 * 导出到 JSON（未加密）
 */
export function exportToJSON(tokens: Token[]): ExportResult {
  const data: ExportData = {
    version: '1.0',
    exported_at: Date.now(),
    tokens: tokens.map(({ name, secret }) => ({ name, secret }))
  }

  const content = JSON.stringify(data, null, 2)
  const filename = `totp-backup-${formatDate(new Date())}.json`

  return { content, filename }
}

/**
 * 从 JSON 导入（未加密）
 */
export function importFromJSON(json: string, existingTokens: Token[]): ImportResult {
  const data = JSON.parse(json) as ExportData

  if (!data.version || !Array.isArray(data.tokens)) {
    throw new Error('无效的备份文件格式')
  }

  const existingNames = new Set(existingTokens.map(t => t.name))
  const duplicates: string[] = []
  const tokens: TokenInput[] = []

  for (const token of data.tokens) {
    if (!token.name || !token.secret) {
      continue
    }

    if (existingNames.has(token.name)) {
      duplicates.push(token.name)
    }

    tokens.push({
      name: token.name,
      secret: token.secret
    })
  }

  return {
    tokens,
    total: tokens.length,
    duplicates
  }
}

/**
 * 导出加密 JSON
 */
export async function exportEncrypted(tokens: Token[], password: string): Promise<ExportResult> {
  const data: ExportData = {
    version: '1.0',
    exported_at: Date.now(),
    tokens: tokens.map(({ name, secret }) => ({ name, secret }))
  }

  const plaintext = JSON.stringify(data)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // 使用 PBKDF2 派生密钥
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )

  // 加密数据
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  )

  const encryptedData: EncryptedExportData = {
    version: '1.0',
    encrypted: true,
    data: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer)
  }

  const content = JSON.stringify(encryptedData, null, 2)
  const filename = `totp-backup-encrypted-${formatDate(new Date())}.json`

  return { content, filename }
}

/**
 * 导入加密 JSON
 */
export async function importEncrypted(
  json: string,
  password: string,
  existingTokens: Token[]
): Promise<ImportResult> {
  const encryptedData = JSON.parse(json) as EncryptedExportData

  if (!encryptedData.encrypted || !encryptedData.data || !encryptedData.salt || !encryptedData.iv) {
    throw new Error('无效的加密备份文件格式')
  }

  const salt = base64ToArrayBuffer(encryptedData.salt)
  const iv = base64ToArrayBuffer(encryptedData.iv)
  const encrypted = base64ToArrayBuffer(encryptedData.data)

  // 使用 PBKDF2 派生密钥
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  // 解密数据
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )

    const plaintext = new TextDecoder().decode(decrypted)
    return importFromJSON(plaintext, existingTokens)
  } catch (error) {
    throw new Error('密码错误或文件已损坏')
  }
}

/**
 * 检测文件是否加密
 */
export function isEncryptedFile(json: string): boolean {
  try {
    const data = JSON.parse(json)
    return data.encrypted === true
  } catch {
    return false
  }
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * 读取文件内容
 */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// 辅助函数

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}
