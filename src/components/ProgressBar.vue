<template>
  <div class="progress-bar">
    <div 
      class="progress-fill" 
      :class="{ 'warning': isWarning }"
      :style="{ width: progress + '%' }"
    ></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  progress: number
  isWarning?: boolean
}>()
</script>

<style scoped>
.progress-bar {
  width: 100%;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 1s linear, background 0.3s;
}

.progress-fill.warning {
  background: linear-gradient(90deg, #ff9800, #f44336);
}
</style>
