import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
import express from 'express';

const router = express.Router();
const sql = neon(process.env.DATABASE_URL);

// JWT 密钥配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 获取项目前缀，用于表名区分
const PROJECT_PREFIX = process.env.PROJECT_PREFIX || 'game_comment';
console.log(`[管理员路由] 使用项目前缀: ${PROJECT_PREFIX}`);

// --- 管理员账户初始化函数（使用统一用户表） ---
const initializeAdmin = async () => {
  try {
    // 检查是否已存在管理员账户（带项目ID）
    const existingAdmin = await sql`
      SELECT id FROM game_admins_users WHERE username = 'admin' AND project_id = ${PROJECT_PREFIX}
    `;
    
    // 如果管理员账户不存在，创建默认账户
    if (existingAdmin.length === 0) {
      const initialPassword = process.env.ADMIN_PASSWORD || 'admin123';
      console.log(`[管理员初始化] 使用环境变量或默认密码创建管理员账户 (项目: ${PROJECT_PREFIX})`);
      
      const hashedPassword = await bcrypt.hash(initialPassword, 10);
      
      await sql`
        INSERT INTO game_admins_users (username, password, role, project_id)
        VALUES ('admin', ${hashedPassword}, 'admin', ${PROJECT_PREFIX})
      `;
      
      console.log(`默认管理员账户创建成功 - 用户名: admin, 项目: ${PROJECT_PREFIX}`);
    }
  } catch (error) {
    console.error('初始化管理员账户时出错:', error);
  }
};

// 启动时初始化管理员账户
initializeAdmin().catch(console.error);

// --- 管理员登录处理函数 ---
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ message: '请输入用户名和密码' });
    }

    // 获取管理员信息（带项目ID验证）
    const admin = await sql`
      SELECT id, username, password, role, project_id, created_at, last_login_at
      FROM game_admins_users 
      WHERE username = ${username} AND project_id = ${PROJECT_PREFIX}
    `;

    // 用户不存在
    if (admin.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const adminData = admin[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, adminData.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 生成 JWT token，有效期24小时（包含项目ID）
    const token = jwt.sign(
      { 
        id: adminData.id,
        username: adminData.username,
        role: adminData.role,
        project_id: adminData.project_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 更新最后登录时间
    await sql`
      UPDATE game_admins_users 
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = ${adminData.id}
    `;

    // 返回登录成功信息
    res.status(200).json({
      token,
      message: '登录成功',
      user: {
        id: adminData.id,
        username: adminData.username,
        role: adminData.role
      }
    });
  } catch (error) {
    console.error('管理员登录出错:', error);
    res.status(500).json({ message: '服务器错误，请稍后重试' });
  }
};

// --- 修改管理员密码 ---
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.id;

    // 获取管理员信息
    const admin = await sql`
      SELECT password FROM game_admins_users WHERE id = ${adminId} AND project_id = ${PROJECT_PREFIX}
    `;

    if (admin.length === 0) {
      return res.status(404).json({ message: '管理员账户不存在' });
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, admin[0].password);
    if (!isValidPassword) {
      return res.status(401).json({ message: '当前密码错误' });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await sql`
      UPDATE game_admins_users 
      SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${adminId}
    `;

    res.status(200).json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码出错:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// --- JWT token 验证中间件 ---
export const verifyAdminToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 验证用户是否存在（带项目ID验证）
    const admin = await sql`
      SELECT id, username, role, project_id FROM game_admins_users WHERE id = ${decoded.id} AND project_id = ${PROJECT_PREFIX}
    `;
    
    if (admin.length === 0) {
      return res.status(401).json({ message: '管理员账户不存在或项目不匹配' });
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: admin[0].id,
      username: admin[0].username,
      role: admin[0].role,
      project_id: admin[0].project_id
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: '无效的认证令牌' });
  }
};

// --- 获取所有游戏数据（评论和评分） ---
export const getAllGameData = async (req, res) => {
  try {
    // 获取所有游戏及其评论和评分统计（使用前缀表）
    const gamesData = await sql`
      SELECT 
        g.address_bar,
        g.title,
        COALESCE(rs.total_votes, 0) as total_votes,
        COALESCE(ROUND(rs.average_rating::numeric, 1), 0) as average_rating,
        COALESCE(rs.rating_1, 0) as rating_1,
        COALESCE(rs.rating_2, 0) as rating_2,
        COALESCE(rs.rating_3, 0) as rating_3,
        COALESCE(rs.rating_4, 0) as rating_4,
        COALESCE(rs.rating_5, 0) as rating_5
      FROM ${sql(PROJECT_PREFIX + '_games')} g
      LEFT JOIN ${sql(PROJECT_PREFIX + '_rating_stats')} rs ON g.address_bar = rs.game_address_bar
      ORDER BY g.title
    `;

    // 获取所有评论（使用前缀表）
    const comments = await sql`
      SELECT 
        c.id,
        c.game_address_bar,
        c.name,
        c.email,
        c.text,
        c.added_by_admin,
        c.created_at as timestamp
      FROM ${sql(PROJECT_PREFIX + '_comments')} c
      ORDER BY c.created_at DESC
    `;

    // 按游戏组织数据
    const result = {};
    
    gamesData.forEach(game => {
      result[game.address_bar] = {
        title: game.title,
        ratings: {
          '1': game.rating_1,
          '2': game.rating_2,
          '3': game.rating_3,
          '4': game.rating_4,
          '5': game.rating_5
        },
        comments: comments.filter(comment => comment.game_address_bar === game.address_bar)
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('[管理员] 获取所有游戏数据出错:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// --- 更新指定游戏的评分计数 ---
export const updateRatingsByPageId = async (req, res) => {
  const { pageId } = req.params;
  const newCounts = req.body; // 期望格式: { "1": count1, "2": count2, ... "5": count5 }

  if (!pageId || typeof pageId !== 'string') {
    return res.status(400).json({ message: '需要有效的 pageId 路径参数' });
  }

  // 验证 newCounts 格式和值
  const validatedCounts = {};
  let validationError = null;
  
  for (let i = 1; i <= 5; i++) {
    const key = String(i);
    const count = newCounts[key];
    if (count === undefined || count === null || typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
      validationError = `评分数量 '${key}' 必须是非负整数。收到: ${count}`;
      break;
    }
    validatedCounts[key] = count;
  }

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    // 开始事务（使用前缀表）
    await sql.begin(async sql => {
      // 删除现有评分
      await sql`DELETE FROM ${sql(PROJECT_PREFIX + '_ratings')} WHERE game_address_bar = ${pageId}`;
      
      // 插入新的评分数据
      for (let rating = 1; rating <= 5; rating++) {
        const count = validatedCounts[String(rating)];
        if (count > 0) {
          // 批量插入相同评分的记录
          const values = Array(count).fill([pageId, rating]);
          for (const [gameAddressBar, ratingValue] of values) {
            await sql`
              INSERT INTO ${sql(PROJECT_PREFIX + '_ratings')} (game_address_bar, rating)
              VALUES (${gameAddressBar}, ${ratingValue})
            `;
          }
        }
      }
    });

    // 获取更新后的统计（使用前缀表）
    const stats = await sql`
      SELECT 
        COALESCE(total_votes, 0) as count,
        COALESCE(ROUND(average_rating::numeric, 1), 0) as average,
        COALESCE(rating_1, 0) as rating_1,
        COALESCE(rating_2, 0) as rating_2,
        COALESCE(rating_3, 0) as rating_3,
        COALESCE(rating_4, 0) as rating_4,
        COALESCE(rating_5, 0) as rating_5
      FROM ${sql(PROJECT_PREFIX + '_rating_stats')} 
      WHERE game_address_bar = ${pageId}
    `;

    const result = stats[0] || { count: 0, average: 0, rating_1: 0, rating_2: 0, rating_3: 0, rating_4: 0, rating_5: 0 };

    console.log(`[API] 管理员更新了游戏 ${pageId} 的评分 - 用户: ${req.user?.username || '未知管理员'}`);
    res.status(200).json({ 
      message: '评分更新成功', 
      ratings: {
        '1': result.rating_1,
        '2': result.rating_2,
        '3': result.rating_3,
        '4': result.rating_4,
        '5': result.rating_5
      }
    });

  } catch (error) {
    console.error(`[API] 更新游戏 ${pageId} 评分时出错:`, error);
    res.status(500).json({ message: '更新评分时发生内部服务器错误' });
  }
};

// --- 按 ID 删除评论 ---
export const deleteCommentById = async (req, res) => {
  try {
    const { pageId, commentId } = req.params;
    
    console.log(`[管理员] 收到删除评论请求 - pageId: ${pageId}, commentId: ${commentId}`);

    // 验证评论是否存在且属于指定游戏（使用前缀表）
    const comment = await sql`
      SELECT id FROM ${sql(PROJECT_PREFIX + '_comments')} 
      WHERE id = ${commentId} AND game_address_bar = ${pageId}
    `;

    if (comment.length === 0) {
      console.log(`[管理员] 未找到要删除的评论 - pageId: ${pageId}, commentId: ${commentId}`);
      return res.status(404).json({ message: '未找到指定 ID 的评论' });
    }

    // 删除评论（使用前缀表）
    await sql`
      DELETE FROM ${sql(PROJECT_PREFIX + '_comments')} 
      WHERE id = ${commentId} AND game_address_bar = ${pageId}
    `;

    console.log(`[管理员] 评论删除成功 - pageId: ${pageId}, commentId: ${commentId}`);
    res.status(200).json({ message: '评论删除成功' });

  } catch (error) {
    console.error('删除评论出错:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// --- 手动添加评论 ---
const addManualComment = async (req, res) => {
  const { pageId, name, text, email, timestamp } = req.body;

  // 输入验证
  const pageIdError = validateInput(pageId, '页面ID');
  if (pageIdError) return res.status(400).json({ message: `管理员错误: ${pageIdError}` });
  
  const nameError = validateInput(name, '姓名', 100);
  if (nameError) return res.status(400).json({ message: `管理员错误: ${nameError}` });
  
  const textError = validateInput(text, '评论内容', 500);
  if (textError) return res.status(400).json({ message: `管理员错误: ${textError}` });

  if (email && typeof email === 'string' && (!email.includes('@') || email.trim().length > 254)) {
    return res.status(400).json({ message: '管理员错误: 请提供有效的邮箱地址' });
  }

  // 时间戳处理
  let finalTimestamp = new Date().toISOString();
  if (timestamp) {
    if (typeof timestamp === 'string' && !isNaN(Date.parse(timestamp))) {
      try {
        finalTimestamp = new Date(timestamp).toISOString();
      } catch (dateError) {
        return res.status(400).json({ 
          message: '管理员错误: 时间戳格式无效。请使用 ISO 8601 格式 (例如: YYYY-MM-DDTHH:mm:ss.sssZ)' 
        });
      }
    } else {
      return res.status(400).json({ 
        message: '管理员错误: 时间戳格式无效。请使用 ISO 8601 格式 (例如: YYYY-MM-DDTHH:mm:ss.sssZ)' 
      });
    }
  }

  try {
    // 确保游戏存在（使用前缀表）
    const gameExists = await sql`
      SELECT id FROM ${sql(PROJECT_PREFIX + '_games')} WHERE address_bar = ${pageId}
    `;

    if (gameExists.length === 0) {
      return res.status(404).json({ message: '游戏不存在' });
    }

    // 插入评论（使用前缀表）
    const newComment = await sql`
      INSERT INTO ${sql(PROJECT_PREFIX + '_comments')} (game_address_bar, name, email, text, added_by_admin, created_at)
      VALUES (${pageId}, ${name.trim()}, ${email?.trim() || null}, ${text.trim()}, TRUE, ${finalTimestamp})
      RETURNING id, name, email, text, added_by_admin, created_at as timestamp
    `;

    console.log(`[API][管理员路由] 管理员手动添加评论 - pageId: ${pageId} (时间戳: ${finalTimestamp}) - 用户: ${req.user?.username || '未知管理员'}`);
    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error(`[API][管理员路由] 手动保存评论时出错 - pageId: ${pageId}:`, error);
    res.status(500).json({ message: '手动保存评论时发生内部服务器错误' });
  }
};

// --- 获取受保护的数据 ---
const getProtectedData = (req, res) => {
  res.json({ 
    message: '已验证的管理员路由', 
    user: req.user 
  });
};

// --- 输入验证辅助函数 ---
const validateInput = (input, type, maxLength = Infinity) => {
  if (typeof input !== 'string' || input.trim() === '') {
    return `${type} 不能为空`;
  }
  if (input.trim().length > maxLength) {
    return `${type} 长度不能超过 ${maxLength} 个字符`;
  }
  return null;
};

// --- 定义路由 ---
// 注意: 路径相对于在 index.js 中添加的 '/admin' 前缀

// 公开路由
router.post('/login', adminLogin);

// 应用 verifyAdminToken 中间件到所有后续路由
router.use(verifyAdminToken);

// 受保护的路由
router.post('/change-password', changeAdminPassword);
router.get('/comments', getAllGameData); // 获取所有游戏数据（评论和评分）
router.delete('/comments/:pageId/:commentId', deleteCommentById);
router.post('/comments/manual', addManualComment);
router.put('/ratings/:pageId', updateRatingsByPageId);
router.get('/protected', getProtectedData);

// 导出管理员路由器
export default router;
