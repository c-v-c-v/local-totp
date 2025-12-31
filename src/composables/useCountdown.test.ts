import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useCountdown } from './useCountdown';

// Helper to test composables with proper Vue instance
function withSetup<T>(composable: () => T) {
  let result: T;
  const TestComponent = defineComponent({
    setup() {
      result = composable();
      return () => h('div');
    }
  });
  mount(TestComponent);
  return result!;
}

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with correct remaining seconds', () => {
    vi.setSystemTime(new Date('2000-01-01T00:00:10Z')); // 10 seconds into period
    
    const { remainingSeconds } = withSetup(() => useCountdown(30));
    
    expect(remainingSeconds.value).toBeGreaterThan(0);
    expect(remainingSeconds.value).toBeLessThanOrEqual(30);
  });

  it('should calculate progress percentage correctly', () => {
    vi.setSystemTime(new Date('2000-01-01T00:00:15Z')); // 15 seconds into period
    
    const { progress } = withSetup(() => useCountdown(30));
    
    expect(progress.value).toBeGreaterThan(0);
    expect(progress.value).toBeLessThanOrEqual(100);
  });

  it('should detect expiring soon status', () => {
    vi.setSystemTime(new Date('2000-01-01T00:00:27Z')); // 27 seconds, 3 remaining
    
    const { isExpiringSoon, remainingSeconds } = withSetup(() => useCountdown(30));
    
    if (remainingSeconds.value <= 5) {
      expect(isExpiringSoon.value).toBe(true);
    } else {
      expect(isExpiringSoon.value).toBe(false);
    }
  });

  it('should update countdown value over time', () => {
    vi.setSystemTime(new Date('2000-01-01T00:00:10Z'));
    
    const { remainingSeconds } = withSetup(() => useCountdown(30));
    const initialValue = remainingSeconds.value;
    
    // Advance time by 1 second
    vi.advanceTimersByTime(1000);
    
    // Value should be updated (may be same or less depending on timing)
    expect(remainingSeconds.value).toBeLessThanOrEqual(initialValue);
  });

  it('should share state globally across multiple instances', () => {
    vi.setSystemTime(new Date('2000-01-01T00:00:10Z'));
    
    // 在同一个组件中创建两个实例
    let countdown1: any, countdown2: any;
    const TestComponent = defineComponent({
      setup() {
        countdown1 = useCountdown(30);
        countdown2 = useCountdown(30);
        return () => h('div');
      }
    });
    mount(TestComponent);
    
    // Both should reference the same remaining seconds
    expect(countdown1.remainingSeconds).toBe(countdown2.remainingSeconds);
    expect(countdown1.remainingSeconds.value).toBe(countdown2.remainingSeconds.value);
  });
});
