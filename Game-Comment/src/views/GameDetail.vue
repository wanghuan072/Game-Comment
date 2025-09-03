<template>
  <div class="page">
    <GameDetail />
  </div>
</template>

<script setup>
// 演示容器：仅调用详情组件（可在其他项目任意页面复用 GameDetail）
import GameDetail from '@/components/GameDetail.vue'
</script>

<style scoped>
.page {
  padding: 40px 0;
  max-width: 1400px;
  margin: 0 auto;
}
</style>

