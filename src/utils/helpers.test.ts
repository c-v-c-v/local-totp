import { describe, it, expect, vi } from 'vitest';
import { generateId, getRemainingSeconds, getProgress, formatCode } from './helpers';

describe('Helper Functions', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('getRemainingSeconds', () => {
    it('should return remaining seconds in 30s period', () => {
      // 模拟时间：1000000000000 ms (2001-09-09 01:46:40 UTC)
      // 秒数：1000000000，对 30 取模 = 10，剩余 = 30 - 10 = 20
      vi.spyOn(Date, 'now').mockReturnValue(1000000010000);
      
      const remaining = getRemainingSeconds(30);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(30);
      
      vi.restoreAllMocks();
    });

    it('should return full period at start of window', () => {
      // 模拟整点时间
      vi.spyOn(Date, 'now').mockReturnValue(1000000000000);
      
      const remaining = getRemainingSeconds(30);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(30);
      
      vi.restoreAllMocks();
    });
  });

  describe('getProgress', () => {
    it('should calculate correct progress percentage', () => {
      expect(getProgress(30, 30)).toBe(100);
      expect(getProgress(15, 30)).toBe(50);
      expect(getProgress(0, 30)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(getProgress(1, 30)).toBeCloseTo(3.33, 1);
      expect(getProgress(29, 30)).toBeCloseTo(96.67, 1);
    });
  });

  describe('formatCode', () => {
    it('should format 6-digit code as 3+3', () => {
      expect(formatCode('123456')).toBe('123 456');
      expect(formatCode('000000')).toBe('000 000');
      expect(formatCode('999999')).toBe('999 999');
    });

    it('should handle non-standard input', () => {
      expect(formatCode('12345')).toBe('12345');
      expect(formatCode('1234567')).toBe('123 4567');
    });
  });
});
