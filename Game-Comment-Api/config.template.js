/**
 * 项目配置模板
 * 复制此文件为 config.js 并修改配置
 */

export const CONFIG = {
  // 🔧 必须修改的配置
  
  // 项目前缀 (必须全局唯一，建议格式: 公司名_项目名)
  PROJECT_PREFIX: 'mycompany_mygame',
  
  // 生产环境域名
  API_DOMAIN: 'https://my-game-api.vercel.app',
  FRONTEND_DOMAIN: 'https://my-game-reviews.vercel.app',
  
  // 项目信息
  PROJECT_NAME: '我的游戏评论网站',
  PROJECT_DESCRIPTION: '专业的游戏评论评分平台',
  
  // 🔧 可选配置 (通常不需要修改)
  
  // 本地开发端口
  LOCAL_API_PORT: 3000,
  LOCAL_FRONTEND_PORT: 5173,
  
  // 管理员默认密码 (建议部署后立即修改)
  DEFAULT_ADMIN_PASSWORD: 'admin123',
  
  // 数据库配置 (从环境变量读取)
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret-key'
};

// 🎮 游戏配置示例
export const GAMES_EXAMPLE = [
  {
    id: 1,
    title: "我的第一个游戏",
    addressBar: "my-first-game",  // 重要：这个ID会存储到数据库
    description: "一个很棒的游戏",
    image: "/images/game1.jpg",
    category: "动作",
    releaseDate: "2024-01-01"
  },
  {
    id: 2,
    title: "我的第二个游戏", 
    addressBar: "my-second-game",
    description: "另一个很棒的游戏",
    image: "/images/game2.jpg",
    category: "冒险",
    releaseDate: "2024-02-01"
  }
];

// 📝 使用说明:
// 1. 复制此文件为 config.js
// 2. 修改上面的配置
// 3. 运行: npm run quick-setup
// 4. 将 GAMES_EXAMPLE 的内容复制到 Game-Comment/src/data/games.js