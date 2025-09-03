<template>
  <div class="comment-rating-management">
    <h2>评论与评分管理</h2>
    
    <div v-if="loading" class="loading">正在加载数据...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-if="Object.keys(gameData).length === 0">
        <p>暂无游戏数据。</p>
      </div>
      
      <div v-for="(data, pageId) in gameData" :key="pageId" class="game-section">
        <div class="game-header">
          <h3>{{ getGameTitle(pageId) }}</h3>
          <div>
            <button @click="openEditRatingsModal(pageId, data.ratings)" class="action-btn edit-ratings-btn">
              编辑评分
            </button>
            <button @click="openAddCommentModal(pageId)" class="action-btn add-comment-btn">
              添加评论
            </button>
          </div>
        </div>
        
        <!-- 评分显示 -->
        <div class="ratings-display">
          <div class="rating-summary">
            <span class="average">平均: {{ calculateAverage(data.ratings) }}</span>
            <span class="total">总计: {{ calculateTotal(data.ratings) }} 票</span>
          </div>
          <div class="rating-breakdown">
            <div v-for="(count, rating) in data.ratings" :key="rating" class="rating-item">
              <span>{{ rating }}星:</span>
              <span>{{ count }}</span>
            </div>
          </div>
        </div>
        
        <!-- 评论列表 -->
        <div class="comments-display">
          <h4>评论列表 ({{ data.comments.length }} 条)</h4>
          <div v-if="data.comments.length === 0" class="no-comments">
            暂无评论
          </div>
          <div v-else>
            <div v-for="comment in data.comments" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <strong>{{ comment.name }}</strong>
                <span class="comment-time">{{ formatTime(comment.timestamp) }}</span>
                <button @click="deleteComment(pageId, comment.id)" class="delete-btn">
                  删除
                </button>
              </div>
              <div class="comment-content">{{ comment.text }}</div>
              <div v-if="comment.email" class="comment-email">{{ comment.email }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加评论模态框 -->
    <div v-if="isModalVisible" class="modal-overlay" @click.self="closeAddCommentModal">
      <div class="modal-content">
        <h3>添加评论</h3>
        <form @submit.prevent="handleAddComment">
          <div class="form-group">
            <label>姓名:</label>
            <input v-model="modalComment.name" required />
          </div>
          <div class="form-group">
            <label>邮箱:</label>
            <input v-model="modalComment.email" type="email" />
          </div>
          <div class="form-group">
            <label>评论内容:</label>
            <textarea v-model="modalComment.text" required></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeAddCommentModal">取消</button>
            <button type="submit" :disabled="submitting">
              {{ submitting ? '添加中...' : '添加评论' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 编辑评分模态框 -->
    <div v-if="isEditRatingsModalVisible" class="modal-overlay" @click.self="closeEditRatingsModal">
      <div class="modal-content">
        <h3>编辑评分</h3>
        <form @submit.prevent="handleEditRatings">
          <div v-for="rating in 5" :key="rating" class="form-group">
            <label>{{ rating }}星数量:</label>
            <input 
              v-model.number="editRatings[rating]" 
              type="number" 
              min="0" 
              required 
            />
          </div>
          <div class="form-actions">
            <button type="button" @click="closeEditRatingsModal">取消</button>
            <button type="submit" :disabled="submitting">
              {{ submitting ? '更新中...' : '更新评分' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminAPI } from '@/services/api.js'
import { games } from '@/data/games.js'

const router = useRouter()

// 响应式数据
const gameData = ref({})
const loading = ref(false)
const error = ref('')
const submitting = ref(false)

// 模态框状态
const isModalVisible = ref(false)
const isEditRatingsModalVisible = ref(false)
const currentPageId = ref('')

// 模态框数据
const modalComment = ref({
  name: '',
  email: '',
  text: ''
})

const editRatings = ref({
  1: 0, 2: 0, 3: 0, 4: 0, 5: 0
})

// 获取管理员 token
const getAdminToken = () => {
  return localStorage.getItem('adminToken')
}

// 获取游戏标题
const getGameTitle = (pageId) => {
  const game = games.find(g => g.addressBar === pageId)
  return game ? game.title : pageId
}

// 加载游戏数据
const fetchGameData = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const token = getAdminToken()
    if (!token) {
      router.push('/admin/login')
      return
    }
    
    const data = await adminAPI.getAllGameData(token)
    gameData.value = data
  } catch (err) {
    error.value = err.message || '加载数据失败'
    if (err.message.includes('认证')) {
      router.push('/admin/login')
    }
  } finally {
    loading.value = false
  }
}

// 删除评论
const deleteComment = async (pageId, commentId) => {
  if (!confirm('确定要删除这条评论吗？')) return
  
  try {
    const token = getAdminToken()
    await adminAPI.deleteComment(pageId, commentId, token)
    
    // 重新加载数据
    await fetchGameData()
    alert('评论删除成功')
  } catch (err) {
    alert('删除失败: ' + err.message)
  }
}

// 打开添加评论模态框
const openAddCommentModal = (pageId) => {
  currentPageId.value = pageId
  modalComment.value = { name: '', email: '', text: '' }
  isModalVisible.value = true
}

// 关闭添加评论模态框
const closeAddCommentModal = () => {
  isModalVisible.value = false
  currentPageId.value = ''
}

// 处理添加评论
const handleAddComment = async () => {
  if (submitting.value) return
  
  submitting.value = true
  try {
    const token = getAdminToken()
    const commentData = {
      pageId: currentPageId.value,
      name: modalComment.value.name,
      email: modalComment.value.email || undefined,
      text: modalComment.value.text
    }
    
    await adminAPI.addManualComment(commentData, token)
    
    // 重新加载数据
    await fetchGameData()
    closeAddCommentModal()
    alert('评论添加成功')
  } catch (err) {
    alert('添加失败: ' + err.message)
  } finally {
    submitting.value = false
  }
}

// 打开编辑评分模态框
const openEditRatingsModal = (pageId, ratings) => {
  currentPageId.value = pageId
  editRatings.value = { ...ratings }
  isEditRatingsModalVisible.value = true
}

// 关闭编辑评分模态框
const closeEditRatingsModal = () => {
  isEditRatingsModalVisible.value = false
  currentPageId.value = ''
}

// 处理编辑评分
const handleEditRatings = async () => {
  if (submitting.value) return
  
  submitting.value = true
  try {
    const token = getAdminToken()
    await adminAPI.updateRatings(currentPageId.value, editRatings.value, token)
    
    // 重新加载数据
    await fetchGameData()
    closeEditRatingsModal()
    alert('评分更新成功')
  } catch (err) {
    alert('更新失败: ' + err.message)
  } finally {
    submitting.value = false
  }
}

// 计算平均分
const calculateAverage = (ratings) => {
  const total = Object.values(ratings).reduce((sum, count) => sum + count, 0)
  if (total === 0) return '0.0'
  
  const weightedSum = Object.entries(ratings).reduce((sum, [rating, count]) => {
    return sum + (parseInt(rating) * count)
  }, 0)
  
  return (weightedSum / total).toFixed(1)
}

// 计算总票数
const calculateTotal = (ratings) => {
  return Object.values(ratings).reduce((sum, count) => sum + count, 0)
}

// 格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 组件挂载时加载数据
onMounted(() => {
  fetchGameData()
})
</script>

<style scoped>
.comment-rating-management {
  padding: 20px;
}

.game-section {
  margin-bottom: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.action-btn {
  margin-left: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-ratings-btn {
  background: #28a745;
  color: white;
}

.add-comment-btn {
  background: #007bff;
  color: white;
}

.ratings-display {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.rating-summary {
  margin-bottom: 10px;
  font-weight: bold;
}

.average {
  color: #ff6b35;
  margin-right: 20px;
}

.rating-breakdown {
  display: flex;
  gap: 20px;
}

.rating-item {
  display: flex;
  gap: 5px;
}

.comments-display h4 {
  margin-bottom: 15px;
}

.comment-item {
  margin-bottom: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-time {
  color: #666;
  font-size: 14px;
}

.delete-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.comment-content {
  margin-bottom: 5px;
}

.comment-email {
  color: #666;
  font-size: 14px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-group textarea {
  height: 80px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button[type="button"] {
  background: #6c757d;
  color: white;
}

.form-actions button[type="submit"] {
  background: #007bff;
  color: white;
}

.form-actions button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading, .error {
  text-align: center;
  padding: 20px;
}

.error {
  color: #dc3545;
}
</style>