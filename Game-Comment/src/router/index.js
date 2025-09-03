import { createRouter, createWebHistory } from 'vue-router'
import { setPageSEO, resetToDefaultSEO, setCanonicalUrl } from '@/seo/seo.js'
import {
  insertMultipleStructuredData,
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateBreadcrumbSchema,
  generateGameSchema,
} from '@/seo/structuredData.js'
import { games } from '@/data/games.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: {
        // 静态页面 TDK（可跨项目替换）
        seo: {
          title: 'Example Games | Play Free Online Games',
          description: 'Browse and play free online games with a clean and friendly experience.',
          keywords: 'online games, free games, web games'
        }
      }
    },
    {
      path: '/games/:addressBar',
      name: 'game-detail',
      component: () => import('@/views/GameDetail.vue')
    },
    // 管理员路由
    {
      path: '/admin/login',
      name: 'AdminLogin',
      component: () => import('@/views/admin/Login.vue'),
      meta: {
        // 管理员登录页面不需要SEO优化
        hideFromSEO: true
      }
    },
    {
      path: '/admin/dashboard',
      name: 'AdminDashboard',
      component: () => import('@/views/admin/Dashboard.vue'),
      meta: { 
        requiresAuth: true,
        hideFromSEO: true
      },
      redirect: '/admin/dashboard/comments',
      children: [
        {
          path: 'comments',
          name: 'AdminComments',
          component: () => import('@/views/admin/CommentRatingManagement.vue'),
          meta: { 
            requiresAuth: true,
            hideFromSEO: true
          }
        },
        {
          path: 'settings',
          name: 'AdminSettings',
          component: () => import('@/views/admin/Settings.vue'),
          meta: { 
            requiresAuth: true,
            hideFromSEO: true
          }
        }
      ]
    }
  ],
})

// 规范路径：去掉末尾斜杠但保留根路径
function normalizePath(path) {
  if (!path) return '/'
  if (path !== '/' && path.endsWith('/')) return path.slice(0, -1)
  return path
}

// 管理员认证检查函数
const checkAdminAuth = (to, from, next) => {
  const token = localStorage.getItem('adminToken')
  
  if (!token) {
    // 没有token，重定向到登录页
    next('/admin/login')
    return
  }

  // 简单验证token是否过期（实际验证在服务端）
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    
    if (payload.exp && payload.exp < currentTime) {
      // token过期，清除并重定向到登录页
      localStorage.removeItem('adminToken')
      next('/admin/login')
      return
    }
    
    // token有效，继续访问
    next()
  } catch (error) {
    // token格式错误，清除并重定向到登录页
    localStorage.removeItem('adminToken')
    next('/admin/login')
  }
}

// 全局路由守卫：统一处理 Canonical、TDK 与 JSON-LD，以及管理员认证
router.beforeEach((to, from, next) => {
  // 管理员认证检查
  if (to.meta?.requiresAuth) {
    checkAdminAuth(to, from, next)
    return
  }

  // 如果已登录的管理员访问登录页，重定向到管理面板
  if (to.name === 'AdminLogin') {
    const token = localStorage.getItem('adminToken')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Date.now() / 1000
        
        if (payload.exp && payload.exp > currentTime) {
          // token有效，重定向到管理面板
          next('/admin/dashboard')
          return
        }
      } catch (error) {
        // token无效，继续到登录页
      }
    }
  }

  // SEO处理（仅对非管理员页面）
  if (to.meta?.hideFromSEO) {
    next()
    return
  }

  const path = normalizePath(to.path)
  const canonicalUrl = `https://example.com${path}` // 【需替换】生产域名

  let seoToApply = null
  const schemas = [generateOrganizationSchema(), generateWebsiteSchema()]

  // 详情页：根据 addressBar 定位游戏，插入面包屑与 Game Schema，并应用游戏 SEO
  if (to.name === 'game-detail' && to.params?.addressBar) {
    const game = games.find(g => g.addressBar === to.params.addressBar)
    if (game) {
      schemas.push(
        generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: game.title, url: path },
        ]),
        generateGameSchema(game)
      )
      if (game.seo) seoToApply = game.seo
    }
  }

  // 静态页：使用路由 meta.seo
  if (!seoToApply && to.meta?.seo) {
    seoToApply = to.meta.seo
  }

  if (seoToApply) {
    setPageSEO(seoToApply, canonicalUrl)
  } else {
    resetToDefaultSEO()
    setCanonicalUrl(canonicalUrl)
  }

  insertMultipleStructuredData(schemas)
  next()
})

export default router
