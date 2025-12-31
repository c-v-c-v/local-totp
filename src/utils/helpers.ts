/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 计算当前周期剩余秒数
 */
export function getRemainingSeconds(period: number = 30): number {
  const now = Math.floor(Date.now() / 1000);
  return period - (now % period);
}

/**
 * 计算进度百分比
 */
export function getProgress(remainingSeconds: number, period: number = 30): number {
  return (remainingSeconds / period) * 100;
}

/**
 * 格式化验证码显示（3位一组）
 */
export function formatCode(code: string): string {
  return code.replace(/(\d{3})(\d{3})/, '$1 $2');
}
