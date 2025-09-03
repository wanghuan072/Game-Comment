<template>
  <div class="page">
    <GameList />
  </div>
</template>

<script setup>
// 演示容器：仅调用列表组件（可在其他项目任意页面复用 GameList）
import GameList from '@/components/GameList.vue'
</script>

<style scoped>
.page {
  padding: 40px 0;
  max-width: 1400px;
  margin: 0 auto;
}
</style>

