<template>
  <div class="app">
    <header class="app-header">
      <h1>🔐 TOTP 验证器</h1>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Token, TokenInput } from './types'
import { tokenRepository } from './repository'
import TokenList from './components/TokenList.vue'
import TokenForm from './components/TokenForm.vue'

const tokens = ref<Token[]>([])
const showForm = ref(false)
const editingToken = ref<Token | null>(null)

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
  justify-content: center;
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
