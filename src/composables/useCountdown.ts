import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getRemainingSeconds, getProgress } from '../utils/helpers'
import type { CountdownState } from '../types'

// 全局共享的倒计时状态
const globalRemainingSeconds = ref(getRemainingSeconds(30))
let globalTimer: NodeJS.Timeout | null = null
let listenerCount = 0

// 全局更新函数
const updateGlobalCountdown = () => {
  globalRemainingSeconds.value = getRemainingSeconds(30)
}

// 启动全局定时器
const startGlobalTimer = () => {
  if (!globalTimer) {
    updateGlobalCountdown()
    globalTimer = setInterval(updateGlobalCountdown, 100) // 使用100ms更精确
  }
}

// 停止全局定时器
const stopGlobalTimer = () => {
  if (globalTimer && listenerCount === 0) {
    clearInterval(globalTimer)
    globalTimer = null
  }
}

/**
 * 倒计时 Composable（全局同步版本）
 * @param period - 周期（秒）
 */
export function useCountdown(period: number = 30): CountdownState {
  // 计算进度百分比
  const progress = computed(() => getProgress(globalRemainingSeconds.value, period))

  // 是否即将过期（<5秒）
  const isExpiringSoon = computed(() => globalRemainingSeconds.value <= 5)

  onMounted(() => {
    listenerCount++
    startGlobalTimer()
  })

  onUnmounted(() => {
    listenerCount--
    stopGlobalTimer()
  })

  return {
    remainingSeconds: globalRemainingSeconds,
    progress,
    isExpiringSoon
  }
}
