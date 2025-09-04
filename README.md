# 🎮 游戏评论评分系统模板

一个基于 Vue 3 + Node.js + Neon PostgreSQL 的现代化游戏评论评分系统模板。支持多项目数据隔离，一键部署到 Vercel。

## ✨ 特性

- 🚀 **一键设置** - 只需修改4个配置即可使用
- 🔒 **数据隔离** - 多项目共享数据库但数据完全隔离
- 📱 **响应式设计** - 完美支持手机、平板、桌面端
- ⚡ **现代技术栈** - Vue 3 + Vite + Express + PostgreSQL
- 🌐 **一键部署** - 自动生成 Vercel 部署配置
- 👨‍💼 **管理后台** - 完整的评论管理功能

## 🎯 快速开始

### 1. 复制模板
```bash
# 复制前后端模板
cp -r Game-Comment MyProject-Frontend
cp -r Game-Comment-Api MyProject-Backend
```

### 2. 后端设置
```bash
cd MyProject-Backend
npm install

# 创建配置文件
cp config.template.js config.js

# 编辑 config.js (只需要改4行)
# PROJECT_PREFIX: 'mycompany_myproject'
# API_DOMAIN: 'https://my-api.vercel.app'  
# FRONTEND_DOMAIN: 'https://my-frontend.vercel.app'
# PROJECT_NAME: '我的游戏评论网站'

# 设置数据库连接
echo "DATABASE_URL=your_neon_database_url" > .env.local

# 一键完成所有设置
npm run setup
```

### 3. 前端设置
```bash
cd ../MyProject-Frontend
npm install

# 配置游戏数据 (编辑 src/data/games.js)
# 启动开发服务器
npm run dev
```

### 4. 部署
- 后端：部署 `MyProject-Backend` 到 Vercel
- 前端：部署 `MyProject-Frontend` 到 Vercel

## 📚 详细文档

- 📖 [后端设置指南](./docs/backend-setup.md) - 完整的后端配置和部署说明
- 📖 [前端设置指南](./docs/frontend-setup.md) - 完整的前端配置和自定义说明

## 🔑 默认管理员

- **用户名**: `admin`
- **密码**: `admin123`
- **建议**: 部署后立即修改密码

## 🛠️ 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 现代化构建工具
- **Vue Router** - 官方路由管理器
- **CSS3** - 现代化样式设计

### 后端
- **Node.js** - JavaScript 运行时
- **Express** - Web 应用框架
- **Neon PostgreSQL** - 现代化 PostgreSQL 数据库
- **JWT** - 身份验证
- **bcrypt** - 密码加密

### 部署
- **Vercel** - 现代化部署平台
- **GitHub** - 代码托管

## 🔒 数据隔离机制

每个项目都有：
- **独立的数据表** - `{PROJECT_PREFIX}_feedback`
- **隔离的管理员权限** - 通过 `project_id` 字段
- **外键约束保护** - 防止数据混乱
- **自动查询过滤** - API只返回当前项目数据

## 📁 项目结构

```
├── Game-Comment/              # 前端模板
│   ├── src/
│   │   ├── components/        # Vue 组件
│   │   ├── views/            # 页面视图
│   │   ├── services/         # API 服务
│   │   └── data/             # 游戏配置
│   └── public/               # 静态资源
├── Game-Comment-Api/         # 后端模板
│   ├── api/                  # API 路由
│   ├── scripts/              # 数据库脚本
│   ├── config.template.js    # 配置模板
│   └── quick-setup.js        # 快速设置脚本
└── docs/                     # 文档目录
    ├── backend-setup.md      # 后端设置指南
    └── frontend-setup.md     # 前端设置指南
```

## 🎮 使用场景

- **游戏开发商** - 为自己的游戏创建评论系统
- **游戏媒体** - 建立游戏评测平台
- **独立开发者** - 快速搭建作品展示网站
- **学习项目** - 全栈开发学习模板

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个模板！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**开始构建你的游戏评论网站吧！** 🚀