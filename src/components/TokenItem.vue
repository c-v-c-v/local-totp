<template>
  <div class="token-item" @click="copyCode" title="点击复制验证码">
    <div class="token-header">
      <h3 class="token-name">{{ token.name }}</h3>
      <div class="token-actions" @click.stop>
        <button @click="handleEdit" class="btn-icon" title="编辑">
          <span>✏️</span>
        </button>
        <button @click="handleDelete" class="btn-icon" title="删除">
          <span>🗑️</span>
        </button>
      </div>
    </div>

    <div class="token-code">
      {{ formattedCode }}
    </div>

    <div class="token-footer">
      <ProgressBar :progress="progress" :isWarning="isExpiringSoon" />
      <span class="remaining-time" :class="{ 'warning': isExpiringSoon }">
        {{ remainingSeconds }}s
      </span>
    </div>

    <div v-if="showCopied" class="copy-toast">已复制</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTOTP } from '../composables/useTOTP'
import { formatCode } from '../utils/helpers'
import ProgressBar from './ProgressBar.vue'
import type { Token } from '../types'

interface Props {
  token: Token
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [token: Token]
  delete: [id: string]
}>()

const { code, remainingSeconds, progress, isExpiringSoon } = useTOTP(props.token.secret)

const formattedCode = computed(() => formatCode(code.value))

const showCopied = ref(false)

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(code.value)
    showCopied.value = true
    setTimeout(() => {
      showCopied.value = false
    }, 1500)
  } catch (error) {
    console.error('Failed to copy:', error)
    alert('复制失败')
  }
}

const handleEdit = () => {
  emit('edit', props.token)
}

const handleDelete = () => {
  if (confirm(`确定删除 "${props.token.name}" 吗？`)) {
    emit('delete', props.token.id)
  }
}
</script>

<style scoped>
.token-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  cursor: pointer;
}

.token-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.token-name {
  font-size: 16px;
  font-weight: 600;
  color: #212121;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.token-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 18px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.token-code {
  font-size: 32px;
  font-weight: 700;
  color: #2196f3;
  text-align: center;
  margin: 20px 0;
  user-select: none;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}

.token-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.remaining-time {
  font-size: 14px;
  font-weight: 600;
  color: #757575;
  min-width: 30px;
  text-align: right;
}

.remaining-time.warning {
  color: #f44336;
}

.copy-toast {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  animation: fadeInOut 1.5s;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  20%, 80% { opacity: 1; }
}

@media (max-width: 600px) {
  .token-code {
    font-size: 28px;
  }
}
</style>
