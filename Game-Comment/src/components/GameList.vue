<template>
  <div class="game-list">
    <div class="grid">
      <div v-for="game in games" :key="game.id" class="card" role="button" @click="goDetail(game)">
        <div class="thumb">
          <img :src="game.imageUrl" :alt="game.imageAlt || game.title" />
        </div>
        <div class="meta">
          <h3 class="title">{{ game.title }}</h3>
          <p v-if="game.publishDate" class="date">{{ formatDate(game.publishDate) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 通用游戏列表组件（可移植）
// 中文提示：如需跨项目自定义列数、卡片信息或点击行为，可在此组件扩展 props 与样式

import { useRouter } from 'vue-router'
import { games } from '@/data/games.js'

const router = useRouter()

function goDetail(game) {
  if (!game || !game.addressBar) return
  router.push(`/games/${game.addressBar}`)
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch (e) {
    return dateString
  }
}
</script>

<style scoped>
/* 中性样式（易于跨项目复用） */
.game-list {
  width: 100%;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  border-color: #d1d5db;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.thumb {
  aspect-ratio: 1.6 / 1;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.meta {
  padding: 12px 12px 14px;
}

.title {
  font-size: 16px;
  line-height: 1.4;
  color: #111827;
  margin: 0 0 6px 0;
  font-weight: 600;
}

.date {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

@media (prefers-color-scheme: dark) {
  .card {
    background: #111215;
    border-color: #2a2b31;
  }
  .card:hover {
    border-color: #3a3b42;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
  }
  .thumb {
    background: #16171b;
  }
  .title {
    color: #e5e7eb;
  }
  .date {
    color: #9ca3af;
  }
}
</style>


