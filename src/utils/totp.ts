/**
 * Base32 解码
 */
function base32Decode(base32: string): Uint8Array {
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const base32Clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  
  let bits = '';
  for (let i = 0; i < base32Clean.length; i++) {
    const val = base32Chars.indexOf(base32Clean[i]);
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }
  
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  
  return new Uint8Array(bytes);
}

/**
 * HMAC-SHA1 实现（使用 Web Crypto API）
 */
async function hmacSHA1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message as BufferSource);
  return new Uint8Array(signature);
}

/**
 * 生成 TOTP 验证码
 */
export async function generateTOTP(
  secret: string,
  timestamp: number = Date.now(),
  digits: number = 6,
  period: number = 30
): Promise<string> {
  try {
    // 1. 计算时间步长
    let counter = Math.floor(timestamp / 1000 / period);
    
    // 2. 将 counter 转为 8 字节大端序
    const counterBytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = counter & 0xff;
      counter >>= 8;
    }
    
    // 3. Base32 解码密钥
    const keyBytes = base32Decode(secret);
    
    // 4. HMAC-SHA1
    const hmac = await hmacSHA1(keyBytes, counterBytes);
    
    // 5. 动态截断
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % Math.pow(10, digits);
    
    // 6. 补零到指定位数
    return code.toString().padStart(digits, '0');
  } catch (error) {
    console.error('TOTP generation error:', error);
    return '------';
  }
}

/**
 * 验证 Base32 格式
 */
export function validateBase32(secret: string): boolean {
  const base32Regex = /^[A-Z2-7]+=*$/;
  const cleaned = secret.toUpperCase().replace(/\s/g, '');
  return base32Regex.test(cleaned);
}
