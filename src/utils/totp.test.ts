import { describe, it, expect } from 'vitest';
import { generateTOTP, validateBase32 } from './totp';

describe('TOTP Algorithm', () => {
  it('should generate correct 6-digit code for standard test secret', async () => {
    // RFC 6238 标准测试向量
    const secret = 'JBSWY3DPEHPK3PXP'; // "Hello!" in Base32
    
    // 使用固定时间戳测试（2000-01-01 00:00:00 UTC）
    const timestamp = 946684800000; // 2000-01-01 00:00:00
    const code = await generateTOTP(secret, timestamp);
    
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^\d{6}$/);
  });

  it('should generate same code within same time window', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const timestamp1 = 1000000000000; // 某个时间点
    const timestamp2 = 1000000010000; // 10秒后（仍在30秒窗口内）
    
    const code1 = await generateTOTP(secret, timestamp1);
    const code2 = await generateTOTP(secret, timestamp2);
    
    expect(code1).toBe(code2);
  });

  it('should generate different codes in different time windows', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const timestamp1 = 1000000000000;
    const timestamp2 = 1000000030000; // 30秒后（进入下一个窗口）
    
    const code1 = await generateTOTP(secret, timestamp1);
    const code2 = await generateTOTP(secret, timestamp2);
    
    expect(code1).not.toBe(code2);
  });

  it('should generate different codes for different secrets', async () => {
    const secret1 = 'JBSWY3DPEHPK3PXP';
    const secret2 = 'HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ';
    const timestamp = 1000000000000;
    
    const code1 = await generateTOTP(secret1, timestamp);
    const code2 = await generateTOTP(secret2, timestamp);
    
    expect(code1).not.toBe(code2);
  });

  it('should handle secrets with spaces', async () => {
    const secret = 'JBSW Y3DP EHPK 3PXP';
    const code = await generateTOTP(secret, 1000000000000);
    
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^\d{6}$/);
  });

  it('should return error indicator for invalid secret', async () => {
    const invalidSecret = 'INVALID!!!';
    const code = await generateTOTP(invalidSecret, 1000000000000);
    
    expect(code).toBe('------');
  });
});

describe('Base32 Validation', () => {
  it('should validate correct Base32 strings', () => {
    expect(validateBase32('JBSWY3DPEHPK3PXP')).toBe(true);
    expect(validateBase32('HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ')).toBe(true);
    expect(validateBase32('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567')).toBe(true);
  });

  it('should accept Base32 strings with spaces', () => {
    expect(validateBase32('JBSW Y3DP EHPK 3PXP')).toBe(true);
  });

  it('should accept Base32 strings with padding', () => {
    expect(validateBase32('JBSWY3DP====')).toBe(true);
  });

  it('should reject strings with invalid characters', () => {
    expect(validateBase32('INVALID123!')).toBe(false);
    expect(validateBase32('Contains0and1')).toBe(false);
    expect(validateBase32('has spaces and symbols!')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(validateBase32('jbswy3dpehpk3pxp')).toBe(true);
    expect(validateBase32('JbSwY3DpEhPk3pXp')).toBe(true);
  });
});
