import { ref, watch } from 'vue'
import { generateTOTP } from '../utils/totp'
import { useCountdown } from './useCountdown'
import type { TOTPState } from '../types'

/**
 * TOTP Composable
 * @param secret - Base32 密钥
 */
export function useTOTP(secret: string): TOTPState {
  const code = ref('------')
  const { remainingSeconds, progress, isExpiringSoon } = useCountdown(30)

  // 生成验证码
  const updateCode = async () => {
    code.value = await generateTOTP(secret)
  }

  // 初始化
  updateCode()

  // 监听倒计时，新周期时刷新验证码
  watch(remainingSeconds, (val) => {
    if (val === 30) {
      updateCode()
    }
  })

  return {
    code,
    remainingSeconds,
    progress,
    isExpiringSoon
  }
}
