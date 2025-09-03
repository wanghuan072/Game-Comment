import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import adminRouter from './admin.js'; // 导入管理员路由

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化 Neon 数据库连接
const sql = neon(process.env.DATABASE_URL);

// 获取项目前缀，用于表名区分
const PROJECT_PREFIX = process.env.PROJECT_PREFIX || 'game_comment';
console.log(`[API] 使用项目前缀: ${PROJECT_PREFIX}`);

// --- 中间件配置 ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 配置 - 允许前端域名访问
const corsOptions = {
  origin: [
    'http://localhost:5173', // 本地开发服务器
    'http://localhost:3000', // 本地API服务器
    'https://game-comment.vercel.app', // 生产环境前端域名
    process.env.FRONTEND_URL || 'https://game-comment.vercel.app' // 环境变量配置的前端域名
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// --- 限流配置 ---
const keyGenerator = (req) => {
  const pageId = req.method === 'POST' ? req.body?.pageId : req.query?.pageId;
  const ip = req.ip || 'unknown_ip';
  const identifier = pageId ? `page-${pageId}` : 'global';
  return `${ip}-${identifier}`;
};

const createLimiter = (message, max = 1) => rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟窗口
  max: max,
  keyGenerator: keyGenerator,
  handler: (req, res, next, options) => {
    console.warn(`限流触发 - IP: ${req.ip}, 页面: ${req.body?.pageId || req.query?.pageId || 'N/A'}, 路径: ${req.path}`);
    res.status(options.statusCode).json({ message: options.message });
  },
  message: message,
  standardHeaders: true,
  legacyHeaders: false,
});

// 创建限流器
const commentLimiter = createLimiter('每分钟只能提交一条评论，请稍后再试。', 1);
const ratingLimiter = createLimiter('每分钟只能提交一次评分，请稍后再试。', 1);
const getLimiter = createLimiter('请求过于频繁，请稍后再试。', 60);

// --- 数据库初始化函数（使用前缀表名） ---
const initializeDatabase = async () => {
  try {
    console.log(`正在初始化数据库表结构 (项目前缀: ${PROJECT_PREFIX})...`);
    
    // 创建统一管理员表（所有项目共享）
    await sql`
      CREATE TABLE IF NOT EXISTS game_admins_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        project_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      )
    `;

    // 创建项目特定游戏表（带前缀）
    const gamesTableName = `${PROJECT_PREFIX}_games`;
    const createGamesTable = `CREATE TABLE IF NOT EXISTS ${gamesTableName} (
      id SERIAL PRIMARY KEY,
      address_bar VARCHAR(100) UNIQUE NOT NULL,
      title VARCHAR(200) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    await sql(createGamesTable);

    // 创建项目特定评论表（带前缀）
    const commentsTableName = `${PROJECT_PREFIX}_comments`;
    const createCommentsTable = `CREATE TABLE IF NOT EXISTS ${commentsTableName} (
      id SERIAL PRIMARY KEY,
      game_address_bar VARCHAR(100) NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(254),
      text TEXT NOT NULL,
      added_by_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    await sql(createCommentsTable);

    // 创建项目特定评分表（带前缀）
    const ratingsTableName = `${PROJECT_PREFIX}_ratings`;
    const createRatingsTable = `CREATE TABLE IF NOT EXISTS ${ratingsTableName} (
      id SERIAL PRIMARY KEY,
      game_address_bar VARCHAR(100) NOT NULL,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    await sql(createRatingsTable);

    // 创建项目特定评分统计视图（带前缀）
    const ratingStatsViewName = `${PROJECT_PREFIX}_rating_stats`;
    const createRatingStatsView = `CREATE OR REPLACE VIEW ${ratingStatsViewName} AS
      SELECT 
        game_address_bar,
        COUNT(*) as total_votes,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5
      FROM ${ratingsTableName}
      GROUP BY game_address_bar`;
    await sql(createRatingStatsView);

    console.log('数据库表结构初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
};

// --- 辅助函数 ---
const validateInput = (input, type, maxLength = Infinity) => {
  if (typeof input !== 'string' || input.trim() === '') {
    return `${type} 不能为空`;
  }
  if (input.trim().length > maxLength) {
    return `${type} 长度不能超过 ${maxLength} 个字符`;
  }
  return null;
};

// --- 挂载路由 ---
app.use('/admin', adminRouter);

// --- 公开API路由 ---

// GET /comments?pageId=xxx - 获取指定游戏的评论
app.get('/comments', getLimiter, async (req, res) => {
  const pageId = req.query.pageId;
  
  if (!pageId || typeof pageId !== 'string') {
    return res.status(400).json({ message: '需要有效的 pageId 查询参数' });
  }

  try {
    const comments = await sql`
      SELECT id, name, email, text, added_by_admin, created_at as timestamp
      FROM ${sql(PROJECT_PREFIX + '_comments')} 
      WHERE game_address_bar = ${pageId}
      ORDER BY created_at DESC
    `;

    res.status(200).json(comments);
  } catch (error) {
    console.error(`获取评论失败 - pageId: ${pageId}:`, error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// POST /comments - 提交新评论
app.post('/comments', commentLimiter, async (req, res) => {
  const { pageId, name, text, email } = req.body;

  // 输入验证
  const pageIdError = validateInput(pageId, '页面ID');
  if (pageIdError) return res.status(400).json({ message: pageIdError });
  
  const nameError = validateInput(name, '姓名', 100);
  if (nameError) return res.status(400).json({ message: nameError });
  
  const textError = validateInput(text, '评论内容', 500);
  if (textError) return res.status(400).json({ message: textError });

  if (email && typeof email === 'string' && (!email.includes('@') || email.trim().length > 254)) {
    return res.status(400).json({ message: '请提供有效的邮箱地址' });
  }

  try {
    // 确保游戏存在
    const gameExists = await sql`
      SELECT id FROM ${sql(PROJECT_PREFIX + '_games')} WHERE address_bar = ${pageId}
    `;

    if (gameExists.length === 0) {
      return res.status(404).json({ message: '游戏不存在' });
    }

    // 插入评论
    const newComment = await sql`
      INSERT INTO ${sql(PROJECT_PREFIX + '_comments')} (game_address_bar, name, email, text, added_by_admin)
      VALUES (${pageId}, ${name.trim()}, ${email?.trim() || null}, ${text.trim()}, FALSE)
      RETURNING id, name, email, text, added_by_admin, created_at as timestamp
    `;

    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error(`提交评论失败 - pageId: ${pageId}:`, error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// GET /ratings?pageId=xxx - 获取指定游戏的评分统计
app.get('/ratings', getLimiter, async (req, res) => {
  const pageId = req.query.pageId;
  
  if (!pageId || typeof pageId !== 'string') {
    return res.status(400).json({ message: '需要有效的 pageId 查询参数' });
  }

  try {
    const stats = await sql`
      SELECT 
        COALESCE(total_votes, 0) as count,
        COALESCE(ROUND(average_rating::numeric, 1), 0) as average
      FROM ${sql(PROJECT_PREFIX + '_rating_stats')} 
      WHERE game_address_bar = ${pageId}
    `;

    const result = stats[0] || { count: 0, average: 0 };
    res.status(200).json(result);
  } catch (error) {
    console.error(`获取评分统计失败 - pageId: ${pageId}:`, error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// POST /ratings - 提交新评分
app.post('/ratings', ratingLimiter, async (req, res) => {
  const { pageId, rating } = req.body;

  const pageIdError = validateInput(pageId, '页面ID');
  if (pageIdError) return res.status(400).json({ message: pageIdError });

  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: '评分必须是1-5之间的整数' });
  }

  try {
    // 确保游戏存在
    const gameExists = await sql`
      SELECT id FROM ${sql(PROJECT_PREFIX + '_games')} WHERE address_bar = ${pageId}
    `;

    if (gameExists.length === 0) {
      return res.status(404).json({ message: '游戏不存在' });
    }

    // 插入评分
    await sql`
      INSERT INTO ${sql(PROJECT_PREFIX + '_ratings')} (game_address_bar, rating)
      VALUES (${pageId}, ${rating})
    `;

    // 获取更新后的统计
    const stats = await sql`
      SELECT 
        COALESCE(total_votes, 0) as count,
        COALESCE(ROUND(average_rating::numeric, 1), 0) as average
      FROM ${sql(PROJECT_PREFIX + '_rating_stats')} 
      WHERE game_address_bar = ${pageId}
    `;

    const result = stats[0] || { count: 0, average: 0 };
    res.status(201).json(result);
  } catch (error) {
    console.error(`提交评分失败 - pageId: ${pageId}:`, error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// --- 健康检查端点 ---
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: '游戏评论API服务正常运行'
  });
});

// --- 导出给 Vercel ---
export default app;

if (!process.env.VERCEL) {
  // 初始化数据库并启动服务器
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`[API] 服务器运行在端口 ${PORT}`);
      console.log(`[API] 健康检查: http://localhost:${PORT}/health`);
    });
  }).catch(error => {
    console.error('启动服务器失败:', error);
    process.exit(1);
  });
}
