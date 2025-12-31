<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEditMode ? '编辑密钥' : '添加密钥' }}</h2>
        <button @click="handleClose" class="btn-close">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="token-form">
        <div class="import-section">
          <button type="button" @click="showUriInput = !showUriInput" class="btn-import">
            {{ showUriInput ? '隐藏 URI 导入' : '📷 从 URI 导入' }}
          </button>
        </div>

        <div v-if="showUriInput" class="form-group">
          <label for="uri">TOTP URI</label>
          <div class="uri-input-group">
            <input
              id="uri"
              v-model="uriInput"
              type="text"
              placeholder="otpauth://totp/..."
            />
            <button type="button" @click="handleUriParse" class="btn-parse">
              解析
            </button>
          </div>
          <small class="hint">粘贴 otpauth:// 开头的完整 URI，然后点击"解析"<br/>
          示例：otpauth://totp/Google:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Google</small>
        </div>

        <div class="divider" v-if="showUriInput">或手动输入</div>

        <div class="form-group">
          <label for="name">账户名称</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="例如：Google - user@example.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="secret">密钥（Base32）</label>
          <input
            id="secret"
            v-model="formData.secret"
            type="text"
            placeholder="例如：JBSWY3DPEHPK3PXP"
            required
            :disabled="isEditMode"
          />
          <small v-if="secretError" class="error">{{ secretError }}</small>
          <small v-else class="hint">16位或32位Base32字符（A-Z, 2-7）</small>
        </div>

        <div class="form-actions">
          <button type="button" @click="handleClose" class="btn btn-secondary">
            取消
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!isValid">
            {{ isEditMode ? '保存' : '添加' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Token, TokenInput } from '../types'
import { validateBase32 } from '../utils/totp'
import { parseTotpUri } from '../utils/qrcode'

interface Props {
  token?: Token | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: TokenInput]
  close: []
}>()

const isEditMode = computed(() => !!props.token)

const formData = ref({
  name: '',
  secret: ''
})

const secretError = ref('')
const showUriInput = ref(false)
const uriInput = ref('')

// 初始化表单数据
if (props.token) {
  formData.value = {
    name: props.token.name,
    secret: props.token.secret
  }
}

// 解析 URI
const handleUriParse = () => {
  if (!uriInput.value.trim()) return
  
  try {
    const parsed = parseTotpUri(uriInput.value.trim())
    formData.value.name = parsed.name
    formData.value.secret = parsed.secret
    uriInput.value = ''
    showUriInput.value = false
  } catch (error) {
    alert((error as Error).message)
  }
}

// 验证密钥格式
watch(() => formData.value.secret, (val) => {
  if (val && val.trim() && !validateBase32(val)) {
    secretError.value = '无效的Base32格式'
  } else {
    secretError.value = ''
  }
})

const isValid = computed(() => {
  const hasName = formData.value.name.trim().length > 0
  const hasSecret = formData.value.secret.trim().length > 0
  const isSecretValid = hasSecret && validateBase32(formData.value.secret.trim())
  
  return hasName && isSecretValid && !secretError.value
})

const handleSubmit = () => {
  if (!isValid.value) return
  
  emit('submit', {
    name: formData.value.name.trim(),
    secret: formData.value.secret.trim().toUpperCase().replace(/\s/g, '')
  })
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

.token-form {
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

.form-group input {
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

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
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

.btn-primary:hover {
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

.import-section {
  margin-bottom: 16px;
}

.btn-import {
  width: 100%;
  padding: 10px;
  background: #f5f5f5;
  border: 2px dashed #bdbdbd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #424242;
  transition: all 0.2s;
}

.btn-import:hover {
  background: #e3f2fd;
  border-color: #2196f3;
  color: #2196f3;
}

.divider {
  text-align: center;
  color: #9e9e9e;
  font-size: 14px;
  margin: 20px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #e0e0e0;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.uri-input-group {
  display: flex;
  gap: 8px;
}

.uri-input-group input {
  flex: 1;
}

.btn-parse {
  padding: 10px 20px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-parse:hover {
  background: #1976d2;
}

.divider::after {
  right: 0;
}
</style>
