import { describe, it, expect } from 'vitest';
import { parseTotpUri } from './qrcode';

describe('TOTP URI Parser', () => {
  it('should parse standard TOTP URI', () => {
    const uri = 'otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example';
    const result = parseTotpUri(uri);

    // issuer 现在会合并到 name 中，格式为 "Issuer - Account"
    expect(result.name).toBe('Example - user@example.com');
    expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
  });

  it('should parse URI without issuer', () => {
    const uri = 'otpauth://totp/user@example.com?secret=JBSWY3DPEHPK3PXP';
    const result = parseTotpUri(uri);

    expect(result.name).toBe('user@example.com');
    expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
  });

  it('should parse URI with encoded characters', () => {
    const uri = 'otpauth://totp/Google%3Auser%40gmail.com?secret=JBSWY3DPEHPK3PXP';
    const result = parseTotpUri(uri);

    expect(result.name).toBe('user@gmail.com');
  });

  it('should convert secret to uppercase and remove spaces', () => {
    const uri = 'otpauth://totp/Test?secret=jbsw%20y3dp%20ehpk';
    const result = parseTotpUri(uri);

    expect(result.secret).toBe('JBSWY3DPEHPK');
  });

  it('should reject non-otpauth protocol', () => {
    const uri = 'https://example.com/totp?secret=SECRET';
    
    expect(() => parseTotpUri(uri)).toThrow('无效的协议');
  });

  it('should reject non-totp type', () => {
    const uri = 'otpauth://hotp/Example?secret=SECRET';
    
    expect(() => parseTotpUri(uri)).toThrow('仅支持 TOTP 类型');
  });

  it('should reject URI without secret', () => {
    const uri = 'otpauth://totp/Example';
    
    expect(() => parseTotpUri(uri)).toThrow('缺少密钥参数');
  });

  it('should handle empty label', () => {
    const uri = 'otpauth://totp/?secret=JBSWY3DPEHPK3PXP';
    const result = parseTotpUri(uri);

    expect(result.name).toBe('未命名账户');
  });
});
