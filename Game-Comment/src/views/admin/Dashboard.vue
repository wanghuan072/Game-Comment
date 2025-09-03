<template>
  <div class="admin-dashboard">
    <header class="dashboard-header">
      <h1>管理面板</h1>
      <div class="header-actions">
        <span class="welcome">欢迎，{{ adminUser?.username }}</span>
        <button @click="handleLogout" class="logout-btn">退出登录</button>
      </div>
    </header>
    
    <nav class="dashboard-nav">
      <router-link to="/admin/dashboard/comments" class="nav-link" active-class="active">
        评论管理
      </router-link>
      <router-link to="/admin/dashboard/settings" class="nav-link" active-class="active">
        系统设置
      </router-link>
    </nav>
    
    <main class="dashboard-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const adminUser = ref(null)

// 检查登录状态
const checkAuth = () => {
  const token = localStorage.getItem('adminToken')
  if (!token) {
    router.push('/admin/login')
    return false
  }
  
  // 解析token获取用户信息（简单实现）
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    adminUser.value = {
      username: payload.username,
      role: payload.role,
      project_id: payload.project_id
    }
  } catch (error) {
    console.error('Token解析失败:', error)
    localStorage.removeItem('adminToken')
    router.push('/admin/login')
  }
  
  return true
}

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('adminToken')
  router.push('/admin/login')
}

onMounted(() => {
  checkAuth()
})
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: #f8f9fa;
}

.dashboard-header {
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header h1 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.welcome {
  color: #666;
  font-size: 14px;
}

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  background: #c82333;
}

.dashboard-nav {
  background: white;
  padding: 0 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 20px;
}

.nav-link {
  padding: 15px 0;
  text-decoration: none;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #333;
}

.nav-link.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.dashboard-content {
  padding: 20px;
}
</style>