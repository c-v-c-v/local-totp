<template>
  <div class="app">
    <header class="app-header">
      <h1>🔐 TOTP 验证器</h1>
      <div class="header-actions">
        <button @click="showExportDialog = true" class="btn-header" title="导出备份">
          📤 导出
        </button>
        <button @click="showImportDialog = true" class="btn-header" title="导入备份">
          📥 导入
        </button>
      </div>
    </header>

    <main class="app-main">
      <div v-if="tokens.length === 0" class="empty-state">
        <p>暂无密钥</p>
        <button @click="showForm = true" class="btn-add-large">
          <span>➕</span> 添加第一个密钥
        </button>
      </div>
      
      <TokenList
        v-else
        :tokens="tokens"
        @edit="handleEdit"
        @delete="handleDelete"
        @add="showForm = true"
      />
    </main>

    <TokenForm
      v-if="showForm"
      :token="editingToken"
      @submit="handleSubmit"
      @close="handleCloseForm"
    />

    <ExportDialog
      v-if="showExportDialog"
      :tokens="tokens"
      @close="showExportDialog = false"
    />

    <ImportDialog
      v-if="showImportDialog"
      :existing-tokens="tokens"
      @import="handleImport"
      @close="showImportDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Token, TokenInput } from './types'
import { tokenRepository } from './repository'
import TokenList from './components/TokenList.vue'
import TokenForm from './components/TokenForm.vue'
import ExportDialog from './components/ExportDialog.vue'
import ImportDialog from './components/ImportDialog.vue'
import type { ImportResult } from './utils/export'

const tokens = ref<Token[]>([])
const showForm = ref(false)
const editingToken = ref<Token | null>(null)
const showExportDialog = ref(false)
const showImportDialog = ref(false)

// 加载所有 Token
const loadTokens = () => {
  tokens.value = tokenRepository.getAll()
}

// 添加/编辑提交
const handleSubmit = (formData: TokenInput) => {
  try {
    if (editingToken.value) {
      // 编辑模式
      tokenRepository.update(editingToken.value.id, { name: formData.name })
    } else {
      // 新增模式
      tokenRepository.create(formData)
    }
    loadTokens()
    handleCloseForm()
  } catch (error) {
    alert('操作失败：' + (error as Error).message)
  }
}

// 编辑
const handleEdit = (token: Token) => {
  editingToken.value = token
  showForm.value = true
}

// 删除
const handleDelete = (id: string) => {
  tokenRepository.delete(id)
  loadTokens()
}

// 关闭表单
const handleCloseForm = () => {
  showForm.value = false
  editingToken.value = null
}

// 导入
const handleImport = (result: ImportResult, strategy: 'skip' | 'overwrite' | 'keep-both') => {
  try {
    let imported = 0
    let skipped = 0

    for (const tokenData of result.tokens) {
      const isDuplicate = result.duplicates.includes(tokenData.name)

      if (isDuplicate) {
        if (strategy === 'skip') {
          skipped++
          continue
        } else if (strategy === 'overwrite') {
          // 找到现有token并删除
          const existing = tokens.value.find(t => t.name === tokenData.name)
          if (existing) {
            tokenRepository.delete(existing.id)
          }
        } else if (strategy === 'keep-both') {
          // 重命名
          tokenData.name = `${tokenData.name} (导入)`
        }
      }

      tokenRepository.create(tokenData)
      imported++
    }

    loadTokens()
    showImportDialog.value = false

    alert(`导入成功！\n新增：${imported} 个\n跳过：${skipped} 个`)
  } catch (error) {
    alert('导入失败：' + (error as Error).message)
  }
}

// 初始化加载
onMounted(() => {
  loadTokens()
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: #f5f5f5;
}

.app-header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header h1 {
  margin: 0;
  font-size: 24px;
  color: #212121;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-header {
  padding: 8px 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #424242;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-header:hover {
  background: #e0e0e0;
  transform: translateY(-1px);
}

.app-main {
  max-width: 1400px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #757575;
}

.empty-state p:first-child {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;
}

.btn-add-large {
  background: #2196f3;
  color: white;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.btn-add-large:hover {
  background: #1976d2;
}

@media (max-width: 600px) {
  .app-header h1 {
    font-size: 20px;
  }
  
  .btn-add {
    padding: 8px 16px;
    font-size: 14px;
  }
}
</style>
