<template>
  <div class="game-detail-wrapper">
    <!-- 加载态 -->
    <div v-if="loading" class="loading">Loading game...</div>

    <!-- 未找到 -->
    <div v-else-if="!game" class="not-found">
      <h2>Game Not Found</h2>
      <router-link to="/">Back to Home</router-link>
    </div>

    <!-- 详情主体 -->
    <div v-else class="layout">
      <!-- 左列：主内容 -->
      <section class="main" :class="{ 'page-fullscreen': isPageFullscreen }">
        <div class="player">
          <!-- 预览蒙版（点击后显示 iframe） -->
          <div v-if="!showGameplay" class="preview" @click="toggleGameplay">
            <div class="preview-bg" :style="{ backgroundImage: `url(${game.imageUrl})` }">
              <div class="preview-overlay">
                <div class="icon">
                  <img :src="game.imageUrl" :alt="game.imageAlt || game.title" />
                </div>
                <button class="play">PLAY</button>
              </div>
            </div>
          </div>

          <!-- 游戏 iframe -->
          <div v-else class="iframe-wrap">
            <iframe
              ref="gameIframe"
              :src="game.iframeUrl"
              title="game"
              frameborder="0"
              allowfullscreen
            ></iframe>
          </div>
        </div>

        <!-- 操作栏：左标题，右侧全屏/网页全屏按钮 -->
        <div class="controls">
          <div class="title">{{ game.title }}</div>
          <div class="actions">
            <button
              class="btn"
              :disabled="!showGameplay"
              @click="toggleFullscreen"
              title="Fullscreen"
              aria-label="Fullscreen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
              </svg>
            </button>
            <button
              class="btn"
              :disabled="!showGameplay"
              @click="togglePageFullscreen"
              title="Page Fullscreen"
              aria-label="Page Fullscreen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- About 内容（v-html 渲染） -->
        <article class="about" v-html="game.detailsHtml"></article>
      </section>

      <!-- 右列：评分/评论（静态数据版，可作为模板替换为真实逻辑） -->
      <aside class="sidebar" v-if="!isPageFullscreen">
        <!-- 评分概览 -->
        <div class="panel">
          <h3 class="panel-title">Rate & Comment</h3>
          <div v-if="loadingData" class="loading-text">加载中...</div>
          <div v-else class="summary-row">
            <div class="summary-score">{{ averageRating.toFixed(1) }}</div>
            <div class="summary-stars" aria-label="average rating">
              <span
                v-for="n in 5"
                :key="n"
                class="star"
                :class="{ filled: n <= Math.round(averageRating) }"
                >★</span
              >
            </div>
            <div class="summary-count">{{ ratingStats.count }} 人评分</div>
          </div>
          
          <!-- 快速评分按钮 -->
          <div v-if="!loadingData" class="quick-rating">
            <div class="quick-rating-label">快速评分：</div>
            <div class="quick-rating-stars">
              <button
                v-for="n in 5"
                :key="n"
                class="star-btn"
                :class="{ active: userRating >= n }"
                @click="submitRating(n)"
                :disabled="submitting"
              >
                ⭐
              </button>
            </div>
          </div>
        </div>

        <!-- 写评论（静态表单占位） -->
        <div class="panel">
          <h3 class="panel-title">Write Your Review</h3>
          <div class="field">
            <label class="label">Nickname <span class="req">*</span></label>
            <input
              class="input"
              type="text"
              v-model="form.nickname"
              placeholder="Enter your nickname"
            />
          </div>
          <div class="field">
            <label class="label">Rating <span class="req">*</span></label>
            <div class="stars-input" role="img" aria-label="select rating">
              <span
                v-for="n in 5"
                :key="n"
                class="star"
                :class="{ filled: n <= form.rating }"
                @click="selectRating(n)"
                >★</span
              >
            </div>
          </div>
          <div class="field">
            <label class="label">Comment <span class="req">*</span></label>
            <textarea
              class="textarea"
              rows="4"
              v-model="form.comment"
              maxlength="1000"
              placeholder="Share your thoughts about this content..."
            ></textarea>
            <div class="hint">{{ form.comment.length }}/1000</div>
          </div>
          <button class="btn wide" @click="submitReview" :disabled="submitting">
            {{ submitting ? '提交中...' : 'Submit Review' }}
          </button>
          <p class="muted small">已接入真实API系统，数据将保存到数据库。</p>
        </div>

        <!-- 评论列表 -->
        <div class="panel">
          <h3 class="panel-title">All Reviews ({{ reviews.length }})</h3>
          <div v-if="loadingData" class="loading-text">加载中...</div>
          <div v-else-if="reviews.length === 0" class="no-reviews">
            暂无评论，成为第一个评论者吧！
          </div>
          <ul v-else class="reviews">
            <li v-for="r in reviews" :key="r.id" class="review-item">
              <div class="review-head">
                <span class="review-name">{{ r.name }}</span>
                <span class="review-date">{{ formatDate(r.timestamp) }}</span>
              </div>
              <p class="review-text">{{ r.text }}</p>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
// 详情组件（可移植）
// 中文提示：
// - iframeUrl 必须可信来源，跨项目仅需替换数据源 data/games.js
// - 右侧评分/评论已接入真实API系统

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { games } from '@/data/games.js'
import { commentAPI, ratingAPI } from '@/services/api.js'

const route = useRoute()
const loading = ref(true)
const showGameplay = ref(false)
const isPageFullscreen = ref(false)
const gameIframe = ref(null)

// 根据 addressBar 查找游戏
const game = computed(() => games.find((g) => g.addressBar === route.params.addressBar))

// 动态评分与评论数据
const reviews = ref([])
const ratingStats = ref({ average: 0, count: 0 })
const userRating = ref(0)
const submitting = ref(false)
const loadingData = ref(false)

// 表单状态
const form = ref({ nickname: '', rating: 3, comment: '' })

// 计算平均评分
const averageRating = computed(() => {
  return ratingStats.value.average || 0
})

// 加载评论和评分数据
const loadData = async () => {
  if (!game.value) return
  
  loadingData.value = true
  try {
    // 并行加载评论和评分数据
    const [commentsData, ratingsData] = await Promise.all([
      commentAPI.getComments(game.value.addressBar),
      ratingAPI.getRatings(game.value.addressBar)
    ])
    
    reviews.value = commentsData || []
    ratingStats.value = ratingsData || { average: 0, count: 0 }
  } catch (error) {
    console.error('加载数据失败:', error)
    // 如果API不可用，使用空数据
    reviews.value = []
    ratingStats.value = { average: 0, count: 0 }
  } finally {
    loadingData.value = false
  }
}

// 选择评分
function selectRating(n) {
  form.value.rating = n
}

// 提交评论
async function submitReview() {
  if (!form.value.nickname || !form.value.comment || submitting.value) return
  
  submitting.value = true
  try {
    const commentData = {
      pageId: game.value.addressBar,
      name: form.value.nickname,
      email: undefined, // 前端表单没有邮箱字段
      text: form.value.comment
    }
    
    const newComment = await commentAPI.submitComment(commentData)
    reviews.value.unshift(newComment)
    
    // 清空表单
    form.value = { nickname: '', rating: 3, comment: '' }
    
    alert('评论提交成功！')
  } catch (error) {
    alert('评论提交失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

// 提交评分
async function submitRating(rating) {
  try {
    const ratingData = {
      pageId: game.value.addressBar,
      rating: rating
    }
    
    const updatedStats = await ratingAPI.submitRating(ratingData)
    ratingStats.value = updatedStats
    userRating.value = rating
    
    alert('评分提交成功！')
  } catch (error) {
    alert('评分提交失败: ' + error.message)
  }
}

// 日期格式化（用于评论时间显示）
function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (e) {
    return dateString
  }
}

function toggleGameplay() {
  showGameplay.value = !showGameplay.value
  if (!showGameplay.value && isPageFullscreen.value) {
    exitPageFullscreen()
  }
}

// 浏览器全屏（iframe 元素）
function toggleFullscreen() {
  if (!gameIframe.value) return
  if (!document.fullscreenElement) {
    gameIframe.value.requestFullscreen?.().catch(() => {})
  } else {
    document.exitFullscreen?.()
  }
}

// 网页全屏（铺满视口）
function togglePageFullscreen() {
  if (isPageFullscreen.value) {
    exitPageFullscreen()
  } else {
    enterPageFullscreen()
  }
}

async function enterPageFullscreen() {
  isPageFullscreen.value = true
  document.body.style.overflow = 'hidden'
  await nextTick()
  // 调整 iframe 样式以适应视口
  setTimeout(() => {
    if (gameIframe.value) {
      gameIframe.value.style.width = '100%'
      gameIframe.value.style.height = '100%'
      gameIframe.value.style.objectFit = 'contain'
    }
  }, 50)
}

async function exitPageFullscreen() {
  isPageFullscreen.value = false
  document.body.style.overflow = 'auto'
  await nextTick()
  setTimeout(() => {
    if (gameIframe.value) {
      gameIframe.value.style.width = '100%'
      gameIframe.value.style.height = '100%'
      gameIframe.value.style.objectFit = 'cover'
    }
  }, 50)
}

onMounted(async () => {
  // 模拟轻量加载
  setTimeout(() => (loading.value = false), 200)
  
  // 加载评论和评分数据
  await loadData()
})

onUnmounted(() => {
  if (isPageFullscreen.value) exitPageFullscreen()
})
</script>

<style scoped>
/* 中性风格，易于跨项目复用 */
.game-detail-wrapper {
  width: 100%;
}

.loading,
.not-found {
  padding: 24px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
}

/* 左列 */
.main {
  background: #f3f4f6; /* 全局淡灰色背景 */
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
}

.player {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #f3f4f6; /* 与整体一致的淡灰底 */
}

.preview {
  aspect-ratio: 16 / 9;
}

.preview-bg {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  backdrop-filter: blur(6px);
}

.icon img {
  width: 96px;
  height: 96px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.play {
  background: #e5e7eb; /* 淡灰背景 */
  color: #333; /* 深灰文字 */
  border: 1px solid #d1d5db;
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.iframe-wrap {
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6; /* 淡灰背景 */
}

.iframe-wrap iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  object-fit: contain;
}

.controls {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #f3f4f6; /* 浅灰色背景 */
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.controls .title {
  font-weight: 600;
  color: #333; /* 字体深灰 */
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  height: 36px;
  min-width: 36px;
  padding: 0 10px;
  border: 1px solid #e5e7eb;
  background: #f9fafb; /* 更接近淡灰 */
  color: #333;
  border-radius: 8px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.about {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb; /* 内容区浅灰 */
  color: #333; /* 文字颜色 */
  line-height: 1.7;
}

/* 网页全屏 */
.main.page-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  border-radius: 0;
  border: none;
  padding: 8px;
}

.main.page-fullscreen .player,
.main.page-fullscreen .iframe-wrap {
  height: calc(100vh - 82px);
}

/* 右列 */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel {
  background: #f3f4f6; /* 侧栏统一浅灰 */
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  color: #333;
}

.panel-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-score {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.summary-stars .star,
.review-stars .star {
  color: #d1d5db; /* 未填充星 */
}
.summary-stars .star.filled,
.review-stars .star.filled {
  color: #f59e0b; /* 填充星（琥珀色） */
}

.field {
  margin-bottom: 10px;
}
.label {
  display: block;
  font-size: 12px;
  color: #333;
  margin-bottom: 6px;
}
.req {
  color: #ef4444;
}
.input,
.textarea {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  background: #f9fafb;
  color: #333;
}
.hint {
  text-align: right;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
.stars-input .star {
  color: #f59e0b;
  margin-right: 4px;
}

.review-item {
  border-top: 1px solid #e5e7eb;
  padding-top: 10px;
  margin-top: 10px;
}
.review-head {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.review-name {
  color: #333;
  font-weight: 600;
}
.review-date {
  color: #666;
}
.review-text {
  color: #333;
  line-height: 1.6;
}

.rating {
  font-size: 18px;
  color: #333;
}

.muted {
  color: #666; /* 次要文字 */
}

.small {
  font-size: 12px;
}

.reviews {
  display: grid;
  gap: 8px;
  padding-left: 18px;
}

.review-skeleton {
  color: #333;
}

.btn.wide {
  width: 100%;
  margin-top: 8px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-text {
  text-align: center;
  color: #666;
  padding: 10px;
  font-size: 14px;
}

.no-reviews {
  text-align: center;
  color: #666;
  padding: 20px;
  font-style: italic;
}

.quick-rating {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.quick-rating-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.quick-rating-stars {
  display: flex;
  gap: 4px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.2s;
  padding: 2px;
}

.star-btn:hover {
  opacity: 0.7;
}

.star-btn.active {
  opacity: 1;
}

.star-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 自适应 */
@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

/* 深色模式下也保持浅灰背景与 #333 文本，确保风格一致 */
@media (prefers-color-scheme: dark) {
  .main,
  .panel,
  .btn,
  .controls,
  .iframe-wrap,
  .player {
    background: #f3f4f6;
    border-color: #2a2b31;
  }
  .controls .title,
  .panel-title,
  .rating,
  .review-skeleton,
  .about {
    color: #333;
  }
  .muted {
    color: #666;
  }
}
</style>


