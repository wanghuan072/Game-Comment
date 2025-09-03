/**
 * 游戏评论评分API - 统一表方案主入口
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import unifiedFeedbackRouter from './unified-feedback.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 获取项目前缀
const PROJECT_PREFIX = process.env.PROJECT_PREFIX || 'my_project';
console.log(`[API] 启动评论评分系统API - 项目前缀: ${PROJECT_PREFIX}`);

// 中间件配置
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS配置
const allowedOrigins = [
  'http://localhost:5173',  // 本地开发前端
  'http://localhost:3000',  // 本地开发后端（如果需要）
  process.env.FRONTEND_URL  // 生产环境前端地址
].filter(Boolean); // 过滤掉undefined值

// 开发环境允许所有来源，生产环境使用限制的域名
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// 添加请求日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: '游戏评论评分API运行正常',
    project: PROJECT_PREFIX,
    timestamp: new Date().toISOString()
  });
});

// 公开API路由
app.post('/comments', async (req, res) => {
  try {
    const { pageId, name, email, text, rating } = req.body;
    
    if (!pageId || !name || !text) {
      return res.status(400).json({ message: '缺少必要字段' });
    }
    
    const sql = (await import('@neondatabase/serverless')).neon(process.env.DATABASE_URL);
    const PROJECT_PREFIX = process.env.PROJECT_PREFIX || 'game_comment';
    
    // 验证评分（如果提供）
    let validRating = null;
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseInt(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        validRating = ratingNum;
      }
    }
    
    const newComment = await sql(`
      INSERT INTO ${PROJECT_PREFIX}_feedback (game_address_bar, name, email, text, rating, added_by_admin)
      VALUES ('${pageId}', '${name.trim()}', ${email?.trim() ? `'${email.trim()}'` : 'NULL'}, '${text.trim()}', ${validRating || 'NULL'}, FALSE)
      RETURNING id, name, email, text, rating, created_at as timestamp
    `);
    
    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error('提交评论失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.get('/comments', async (req, res) => {
  try {
    const { pageId } = req.query;
    
    if (!pageId) {
      return res.status(400).json({ message: '缺少pageId参数' });
    }
    
    const sql = (await import('@neondatabase/serverless')).neon(process.env.DATABASE_URL);
    const PROJECT_PREFIX = process.env.PROJECT_PREFIX || 'game_comment';
    
    const comments = await sql(`
      SELECT id, name, email, text, rating, created_at as timestamp
      FROM ${PROJECT_PREFIX}_feedback
      WHERE game_address_bar = '${pageId}' AND text IS NOT NULL
      ORDER BY created_at DESC
    `);
    
    res.json(comments);
  } catch (error) {
    console.error('获取评论失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.post('/ratings', async (req, res) => {
  try {
    const { pageId, rating } = req.body;
    
    if (!pageId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: '无效的评分数据' });
    }
    
    const sql = (await import('@neondatabase/serverless')).neon(process.env.DATABASE_URL);
    const PROJECT_PREFIX = process.env.PROJECT_PREFIX || 'game_comment';
    
    await sql(`
      INSERT INTO ${PROJECT_PREFIX}_feedback (game_address_bar, name, rating, added_by_admin)
      VALUES ('${pageId}', '用户评分', ${rating}, FALSE)
    `);
    
    // 获取更新后的评分统计
    const stats = await sql(`
      SELECT 
        COUNT(rating) as count,
        ROUND(AVG(rating), 1) as average,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5
      FROM ${PROJECT_PREFIX}_feedback 
      WHERE game_address_bar = '${pageId}' AND rating IS NOT NULL
    `);
    
    const result = stats[0] || { count: 0, average: 0, rating_1: 0, rating_2: 0, rating_3: 0, rating_4: 0, rating_5: 0 };
    
    res.json({
      message: '评分提交成功',
      count: result.count,
      average: result.average,
      ratings: {
        '1': result.rating_1,
        '2': result.rating_2,
        '3': result.rating_3,
        '4': result.rating_4,
        '5': result.rating_5
      }
    });
  } catch (error) {
    console.error('提交评分失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.get('/ratings', async (req, res) => {
  try {
    const { pageId } = req.query;
    
    if (!pageId) {
      return res.status(400).json({ message: '缺少pageId参数' });
    }
    
    const sql = (await import('@neondatabase/serverless')).neon(process.env.DATABASE_URL);
    const PROJECT_PREFIX = process.env.PROJECT_PREFIX || 'game_comment';
    
    const stats = await sql(`
      SELECT 
        COUNT(rating) as count,
        ROUND(AVG(rating), 1) as average,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5
      FROM ${PROJECT_PREFIX}_feedback 
      WHERE game_address_bar = '${pageId}' AND rating IS NOT NULL AND text IS NOT NULL
    `);
    
    const result = stats[0] || { count: 0, average: 0, rating_1: 0, rating_2: 0, rating_3: 0, rating_4: 0, rating_5: 0 };
    
    res.json({
      count: result.count,
      average: result.average,
      ratings: {
        '1': result.rating_1,
        '2': result.rating_2,
        '3': result.rating_3,
        '4': result.rating_4,
        '5': result.rating_5
      }
    });
  } catch (error) {
    console.error('获取评分失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 管理员API路由
app.use('/admin', unifiedFeedbackRouter);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'API端点不存在',
    availableEndpoints: [
      'GET /health - 健康检查',
      'GET /comments?pageId=xxx - 获取评论',
      'POST /comments - 提交评论',
      'GET /ratings?pageId=xxx - 获取评分统计',
      'POST /ratings - 提交评分',
      'POST /admin/login - 管理员登录',
      'GET /admin/feedback - 获取所有反馈数据',
      'DELETE /admin/feedback/:pageId/:feedbackId - 删除反馈',
      'POST /admin/feedback/manual - 手动添加反馈',
      'PUT /admin/ratings/:pageId - 更新评分'
    ]
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('[API] 服务器错误:', error);
  res.status(500).json({ 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
  });
});

// 启动服务器
    app.listen(PORT, () => {
  console.log(`🚀 游戏评论评分API已启动`);
  console.log(`📡 端口: ${PORT}`);
  console.log(`🌐 项目前缀: ${PROJECT_PREFIX}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
  console.log(`👤 管理员登录: http://localhost:${PORT}/admin/login`);
  console.log(`📊 反馈管理: http://localhost:${PORT}/admin/feedback`);
});

export default app;
