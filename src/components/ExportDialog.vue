<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h2>📤 导出备份</h2>
        <button @click="handleClose" class="btn-close">✕</button>
      </div>

      <form @submit.prevent="handleExport" class="export-form">
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="useEncryption" />
            <span>🔒 加密导出（推荐）</span>
          </label>
          <small class="hint">使用密码保护您的备份文件</small>
        </div>

        <div v-if="useEncryption" class="password-section">
          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="输入加密密码（至少8位）"
              :required="useEncryption"
              minlength="8"
            />
            <small class="hint password-strength" :class="passwordStrengthClass">
              {{ passwordStrengthText }}
            </small>
          </div>

          <div class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              placeholder="再次输入密码"
              :required="useEncryption"
            />
            <small v-if="confirmPassword && password !== confirmPassword" class="error">
              密码不一致
            </small>
          </div>
        </div>

        <div class="info-box">
          <p><strong>导出信息：</strong></p>
          <ul>
            <li>共 {{ tokenCount }} 个密钥</li>
            <li>{{ useEncryption ? '加密' : '未加密' }} JSON 格式</li>
            <li v-if="!useEncryption" class="warning">⚠️ 未加密文件包含明文密钥，请妥善保管</li>
          </ul>
        </div>

        <div class="form-actions">
          <button type="button" @click="handleClose" class="btn btn-secondary">
            取消
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isExportDisabled || exporting"
          >
            {{ exporting ? '导出中...' : '导出' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Token } from '../types'
import { exportToJSON, exportEncrypted, downloadFile } from '../utils/export'

interface Props {
  tokens: Token[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const useEncryption = ref(true)
const password = ref('')
const confirmPassword = ref('')
const exporting = ref(false)

const tokenCount = computed(() => props.tokens.length)

const passwordStrength = computed(() => {
  const pwd = password.value
  if (!pwd) return 0
  
  let strength = 0
  if (pwd.length >= 8) strength++
  if (pwd.length >= 12) strength++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
  if (/\d/.test(pwd)) strength++
  if (/[^a-zA-Z0-9]/.test(pwd)) strength++
  
  return strength
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'weak'
  if (strength <= 3) return 'medium'
  return 'strong'
})

const passwordStrengthText = computed(() => {
  if (!password.value) return '请输入密码'
  const strength = passwordStrength.value
  if (strength <= 2) return '密码强度：弱'
  if (strength <= 3) return '密码强度：中'
  return '密码强度：强'
})

const isExportDisabled = computed(() => {
  if (!useEncryption.value) return false
  return !password.value || password.value !== confirmPassword.value || password.value.length < 8
})

const handleExport = async () => {
  if (isExportDisabled.value) return

  exporting.value = true

  try {
    let result
    if (useEncryption.value) {
      result = await exportEncrypted(props.tokens, password.value)
    } else {
      result = exportToJSON(props.tokens)
    }

    downloadFile(result.content, result.filename)
    emit('close')
  } catch (error) {
    alert('导出失败：' + (error as Error).message)
  } finally {
    exporting.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #212121;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #757575;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.btn-close:hover {
  background: #f5f5f5;
}

.export-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #424242;
  font-size: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-group input[type="password"] {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #2196f3;
}

.form-group small {
  display: block;
  margin-top: 6px;
  font-size: 12px;
}

.hint {
  color: #757575;
}

.error {
  color: #f44336;
}

.password-strength {
  font-weight: 600;
}

.password-strength.weak {
  color: #f44336;
}

.password-strength.medium {
  color: #ff9800;
}

.password-strength.strong {
  color: #4caf50;
}

.password-section {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-box {
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-box p {
  margin: 0 0 8px 0;
  color: #1976d2;
}

.info-box ul {
  margin: 0;
  padding-left: 20px;
  color: #424242;
}

.info-box li {
  margin-bottom: 4px;
}

.info-box li.warning {
  color: #f57c00;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f5f5f5;
  color: #424242;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #2196f3;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1976d2;
}

.btn-primary:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .modal-content {
    max-width: 100%;
  }
}
</style>
