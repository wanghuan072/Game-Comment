<template>
  <div class="admin-settings">
    <h2>系统设置</h2>
    
    <div class="settings-section">
      <h3>API 配置</h3>
      <div class="setting-item">
        <label>API 基础URL:</label>
        <input 
          v-model="apiConfig.baseUrl" 
          type="text" 
          placeholder="http://localhost:3000"
          class="setting-input"
        />
        <button @click="testApiConnection" class="test-btn" :disabled="testing">
          {{ testing ? '测试中...' : '测试连接' }}
        </button>
      </div>
    </div>
    
    <div class="settings-section">
      <h3>数据库状态</h3>
      <div class="status-item">
        <span class="status-label">连接状态:</span>
        <span :class="['status-value', dbStatus.connected ? 'connected' : 'disconnected']">
          {{ dbStatus.connected ? '已连接' : '未连接' }}
        </span>
      </div>
      <div class="status-item">
        <span class="status-label">项目前缀:</span>
        <span class="status-value">{{ dbStatus.projectPrefix || '未设置' }}</span>
      </div>
    </div>
    
    <div class="settings-section">
      <h3>操作</h3>
      <div class="action-buttons">
        <button @click="refreshData" class="action-btn refresh-btn" :disabled="refreshing">
          {{ refreshing ? '刷新中...' : '刷新数据' }}
        </button>
        <button @click="clearCache" class="action-btn clear-btn">
          清除缓存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminAPI, healthCheck } from '@/services/api.js'

const apiConfig = ref({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
})

const dbStatus = ref({
  connected: false,
  projectPrefix: null
})

const testing = ref(false)
const refreshing = ref(false)

// 测试API连接
const testApiConnection = async () => {
  testing.value = true
  try {
    await healthCheck()
    alert('API连接正常！')
    dbStatus.value.connected = true
  } catch (error) {
    alert('API连接失败: ' + error.message)
    dbStatus.value.connected = false
  } finally {
    testing.value = false
  }
}

// 刷新数据
const refreshData = async () => {
  refreshing.value = true
  try {
    // 这里可以添加刷新数据的逻辑
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟刷新
    alert('数据刷新完成！')
  } catch (error) {
    alert('数据刷新失败: ' + error.message)
  } finally {
    refreshing.value = false
  }
}

// 清除缓存
const clearCache = () => {
  if (confirm('确定要清除所有缓存吗？')) {
    localStorage.removeItem('adminToken')
    alert('缓存已清除，请重新登录')
    window.location.reload()
  }
}

onMounted(() => {
  // 初始化时测试连接
  testApiConnection()
})
</script>

<style scoped>
.admin-settings {
  padding: 20px;
}

.settings-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.settings-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.setting-item label {
  min-width: 120px;
  font-weight: bold;
}

.setting-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.test-btn {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.status-label {
  min-width: 120px;
  font-weight: bold;
}

.status-value {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.status-value.connected {
  background: #d4edda;
  color: #155724;
}

.status-value.disconnected {
  background: #f8d7da;
  color: #721c24;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.refresh-btn {
  background: #007bff;
  color: white;
}

.clear-btn {
  background: #dc3545;
  color: white;
}

.action-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>