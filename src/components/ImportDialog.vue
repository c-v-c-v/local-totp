<template>
  <div class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h2>📥 导入备份</h2>
        <button @click="handleClose" class="btn-close">✕</button>
      </div>

      <form @submit.prevent="handleImport" class="import-form">
        <!-- 文件选择 -->
        <div v-if="!fileSelected" class="file-upload">
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            @change="handleFileSelect"
            style="display: none"
          />
          <button type="button" @click="triggerFileSelect" class="btn-upload">
            📁 选择备份文件
          </button>
          <small class="hint">支持 .json 格式的备份文件</small>
        </div>

        <!-- 文件已选择 -->
        <div v-else class="file-selected">
          <div class="file-info">
            <span class="file-icon">📄</span>
            <div class="file-details">
              <div class="file-name">{{ selectedFile?.name }}</div>
              <div class="file-size">{{ formatFileSize(selectedFile?.size || 0) }}</div>
            </div>
            <button type="button" @click="clearFile" class="btn-clear">✕</button>
          </div>

          <!-- 密码输入（如果文件加密） -->
          <div v-if="isEncrypted && !previewData" class="password-section">
            <div class="form-group">
              <label for="password">解密密码</label>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="输入备份文件的密码"
                required
                @keypress.enter="loadPreview"
                class="password-input"
                :disabled="previewing"
              />
              <small class="hint">输入密码后点击"预览"查看导入内容</small>
              <button
                type="button"
                @click="loadPreview"
                class="btn-preview"
                :disabled="!password || previewing"
              >
                {{ previewing ? '预览中...' : '预览' }}
              </button>
            </div>
          </div>

          <!-- 预览信息 -->
          <div v-if="previewData" class="preview-box">
            <p><strong>📋 导入预览：</strong></p>
            <ul>
              <li>共 {{ previewData.total }} 个密钥</li>
              <li v-if="previewData.duplicates.length > 0" class="warning">
                ⚠️ {{ previewData.duplicates.length }} 个重复名称
              </li>
            </ul>

            <!-- 重复项详情 -->
            <div v-if="previewData.duplicates.length > 0" class="duplicates-section">
              <p class="duplicates-title">重复的密钥：</p>
              <ul class="duplicates-list">
                <li v-for="name in previewData.duplicates" :key="name">{{ name }}</li>
              </ul>

              <!-- 冲突处理策略 -->
              <div class="conflict-strategy">
                <p><strong>处理方式：</strong></p>
                <label class="radio-label">
                  <input type="radio" v-model="conflictStrategy" value="skip" />
                  <span>跳过重复项（保留现有）</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="conflictStrategy" value="overwrite" />
                  <span>覆盖现有密钥</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="conflictStrategy" value="keep-both" />
                  <span>保留两者（重命名新密钥）</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="errorMessage" class="error-box">
            {{ errorMessage }}
          </div>
        </div>

        <div class="form-actions">
          <button type="button" @click="handleClose" class="btn btn-secondary">
            取消
          </button>
          <button
            v-if="fileSelected"
            type="submit"
            class="btn btn-primary"
            :disabled="importing || !canImport"
          >
            {{ importing ? '导入中...' : '导入' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Token } from '../types'
import {
  readFile,
  isEncryptedFile,
  importFromJSON,
  importEncrypted,
  type ImportResult
} from '../utils/export'

interface Props {
  existingTokens: Token[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  import: [tokens: ImportResult, strategy: ConflictStrategy]
  close: []
}>()

type ConflictStrategy = 'skip' | 'overwrite' | 'keep-both'

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File>()
const fileContent = ref('')
const isEncrypted = ref(false)
const password = ref('')
const previewData = ref<ImportResult>()
const errorMessage = ref('')
const importing = ref(false)
const previewing = ref(false)
const conflictStrategy = ref<ConflictStrategy>('skip')

const fileSelected = computed(() => !!selectedFile.value)

const canImport = computed(() => {
  return !!previewData.value
})

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  selectedFile.value = file
  errorMessage.value = ''
  previewData.value = undefined

  try {
    fileContent.value = await readFile(file)
    isEncrypted.value = isEncryptedFile(fileContent.value)

    // 如果未加密，立即预览
    if (!isEncrypted.value) {
      await loadPreview()
    }
  } catch (error) {
    errorMessage.value = '文件读取失败：' + (error as Error).message
  }
}

const loadPreview = async () => {
  if (!fileContent.value) return
  if (previewing.value) return

  previewing.value = true
  errorMessage.value = ''

  try {
    let result: ImportResult
    if (isEncrypted.value) {
      if (!password.value) {
        previewing.value = false
        return
      }
      result = await importEncrypted(fileContent.value, password.value, props.existingTokens)
    } else {
      result = importFromJSON(fileContent.value, props.existingTokens)
    }

    previewData.value = result
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = (error as Error).message
    // 保持密码区域显示，不设置 previewData，让用户可以重试
  } finally {
    previewing.value = false
  }
}

const handleImport = async () => {
  if (!previewData.value) {
    errorMessage.value = '请先预览导入内容'
    return
  }

  importing.value = true

  try {
    emit('import', previewData.value, conflictStrategy.value)
  } catch (error) {
    errorMessage.value = '导入失败：' + (error as Error).message
  } finally {
    importing.value = false
  }
}

const clearFile = () => {
  selectedFile.value = undefined
  fileContent.value = ''
  isEncrypted.value = false
  password.value = ''
  previewData.value = undefined
  errorMessage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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

.import-form {
  padding: 20px;
}

.file-upload {
  text-align: center;
  padding: 40px 20px;
}

.btn-upload {
  width: 100%;
  padding: 16px;
  background: #e3f2fd;
  border: 2px dashed #2196f3;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  color: #1976d2;
  transition: all 0.2s;
  margin-bottom: 8px;
}

.btn-upload:hover {
  background: #bbdefb;
  border-color: #1976d2;
}

.file-selected {
  margin-bottom: 20px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.file-icon {
  font-size: 24px;
}

.file-details {
  flex: 1;
}

.file-name {
  font-weight: 600;
  color: #212121;
  margin-bottom: 4px;
  word-break: break-all;
}

.file-size {
  font-size: 12px;
  color: #757575;
}

.btn-clear {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #757575;
  padding: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.btn-clear:hover {
  background: #e0e0e0;
}

.password-section {
  background: #fff3e0;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.password-section .form-group {
  margin-bottom: 0;
}

.password-section .password-input {
  margin-bottom: 8px;
}

.password-section .hint {
  display: block;
  margin-bottom: 12px;
}

.btn-preview {
  width: 100%;
  padding: 10px 20px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-preview:hover:not(:disabled) {
  background: #1976d2;
}

.btn-preview:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
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

.form-group small {
  display: block;
  margin-top: 6px;
  font-size: 12px;
}

.hint {
  color: #757575;
  display: block;
  text-align: center;
}

.preview-box {
  background: #e8f5e9;
  border: 1px solid #4caf50;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.preview-box p {
  margin: 0 0 8px 0;
  color: #2e7d32;
}

.preview-box ul {
  margin: 0;
  padding-left: 20px;
  color: #424242;
}

.preview-box li {
  margin-bottom: 4px;
}

.preview-box li.warning {
  color: #f57c00;
  font-weight: 600;
}

.duplicates-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #c8e6c9;
}

.duplicates-title {
  font-size: 13px;
  font-weight: 600;
  color: #f57c00;
  margin: 0 0 8px 0;
}

.duplicates-list {
  max-height: 100px;
  overflow-y: auto;
  background: white;
  padding: 8px 12px 8px 28px;
  border-radius: 4px;
  margin: 0 0 12px 0;
  font-size: 13px;
}

.duplicates-list li {
  margin-bottom: 2px;
  color: #757575;
}

.conflict-strategy {
  margin-top: 12px;
}

.conflict-strategy p {
  font-size: 13px;
  margin: 0 0 8px 0;
  color: #2e7d32;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
  font-size: 13px;
  color: #424242;
}

.radio-label:hover {
  background: rgba(255, 255, 255, 0.5);
}

.radio-label input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.error-box {
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 8px;
  padding: 12px;
  color: #c62828;
  font-size: 14px;
  margin-bottom: 16px;
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
