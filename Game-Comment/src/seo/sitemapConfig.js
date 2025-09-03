// 站点地图路由生成（可移植）
// 从数据源自动生成所有需要的静态与动态路由

// 这里不要使用别名 @ ，因为该文件会在 vite.config.js 中被 Node 直接加载，
// Vite 的别名解析尚未生效，需改为相对路径以避免解析错误。
import { games } from '../data/games.js'

/**
 * 获取所有需要写入 sitemap 的路由
 * 静态：仅首页 '/'
 * 动态：基于 games.addressBar 的详情页 '/games/:addressBar'
 */
export function getAllRoutes() {
  const staticRoutes = ['/']
  const gameRoutes = Array.isArray(games)
    ? games.filter(g => g && g.addressBar).map(g => `/games/${g.addressBar}`)
    : []
  return [...staticRoutes, ...gameRoutes]
}


