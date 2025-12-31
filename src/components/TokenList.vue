<template>
  <div class="token-list">
    <TokenItem
      v-for="token in tokens"
      :key="token.id"
      :token="token"
      @edit="handleEdit"
      @delete="handleDelete"
    />
    
    <div class="add-card" @click="handleAdd" title="添加新密钥">
      <span class="add-icon">➕</span>
      <span class="add-text">添加密钥</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Token } from '../types'
import TokenItem from './TokenItem.vue'

interface Props {
  tokens: Token[]
}

defineProps<Props>()

const emit = defineEmits<{
  edit: [token: Token]
  delete: [id: string]
  add: []
}>()

const handleEdit = (token: Token) => {
  emit('edit', token)
}

const handleDelete = (id: string) => {
  emit('delete', id)
}

const handleAdd = () => {
  emit('add')
}
</script>

<style scoped>
.token-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

@media (max-width: 600px) {
  .token-list {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  .token-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 961px) {
  .token-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

.add-card {
  background: white;
  border: 2px dashed #bdbdbd;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-card:hover {
  border-color: #2196f3;
  background: #f5f9ff;
  transform: translateY(-2px);
}

.add-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.add-card:hover .add-icon {
  opacity: 1;
}

.add-text {
  font-size: 16px;
  color: #757575;
  font-weight: 600;
}

.add-card:hover .add-text {
  color: #2196f3;
}
</style>
