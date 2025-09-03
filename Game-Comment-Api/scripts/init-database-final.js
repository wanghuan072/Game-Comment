/**
 * 最终版数据库初始化脚本
 * 使用字符串拼接创建表
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

const sql = neon(process.env.DATABASE_URL);

// 获取项目前缀，用于表名区分
const PROJECT_PREFIX = process.env.PROJECT_PREFIX || 'game_comment';
console.log(`[数据库初始化] 使用项目前缀: ${PROJECT_PREFIX}`);

async function initializeDatabase() {
  try {
    console.log('🚀 开始初始化数据库...');

    // 1. 创建统一管理员表（所有项目共享）
    console.log('📝 创建统一管理员表...');
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

    // 2. 创建项目特定游戏表（带前缀）
    console.log(`🎮 创建游戏表 ${PROJECT_PREFIX}_games...`);
    const gamesTableQuery = `CREATE TABLE IF NOT EXISTS ${PROJECT_PREFIX}_games (
      id SERIAL PRIMARY KEY,
      address_bar VARCHAR(100) UNIQUE NOT NULL,
      title VARCHAR(200) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    await sql(gamesTableQuery);

    // 3. 创建项目特定评论表（带前缀）
    console.log(`💬 创建评论表 ${PROJECT_PREFIX}_comments...`);
    const commentsTableQuery = `CREATE TABLE IF NOT EXISTS ${PROJECT_PREFIX}_comments (
      id SERIAL PRIMARY KEY,
      game_address_bar VARCHAR(100) NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(254),
      text TEXT NOT NULL,
      added_by_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    await sql(commentsTableQuery);

    // 4. 创建项目特定评分表（带前缀）
    console.log(`⭐ 创建评分表 ${PROJECT_PREFIX}_ratings...`);
    const ratingsTableQuery = `CREATE TABLE IF NOT EXISTS ${PROJECT_PREFIX}_ratings (
      id SERIAL PRIMARY KEY,
      game_address_bar VARCHAR(100) NOT NULL,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    await sql(ratingsTableQuery);

    // 5. 创建索引
    console.log('🔍 创建索引...');
    await sql(`CREATE INDEX IF NOT EXISTS idx_${PROJECT_PREFIX}_comments_game_address_bar ON ${PROJECT_PREFIX}_comments(game_address_bar)`);
    await sql(`CREATE INDEX IF NOT EXISTS idx_${PROJECT_PREFIX}_ratings_game_address_bar ON ${PROJECT_PREFIX}_ratings(game_address_bar)`);

    // 6. 创建默认管理员账户
    console.log(`👤 创建默认管理员账户 (项目: ${PROJECT_PREFIX})...`);
    const existingAdmin = await sql`
      SELECT id FROM game_admins_users WHERE username = 'admin' AND project_id = ${PROJECT_PREFIX}
    `;

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
      await sql`
        INSERT INTO game_admins_users (username, password, project_id, role)
        VALUES ('admin', ${hashedPassword}, ${PROJECT_PREFIX}, 'admin')
      `;
      console.log('✅ 默认管理员账户创建成功');
    } else {
      console.log('ℹ️ 管理员账户已存在，跳过创建');
    }

    // 7. 插入示例游戏数据
    console.log('🎮 插入示例游戏数据...');
    const sampleGames = [
      { address_bar: 'aaa', title: '示例游戏A' },
      { address_bar: 'bbb', title: '示例游戏B' },
      { address_bar: 'ccc', title: '示例游戏C' }
    ];

    for (const game of sampleGames) {
      const existingGame = await sql(`SELECT id FROM ${PROJECT_PREFIX}_games WHERE address_bar = '${game.address_bar}'`);
      
      if (existingGame.length === 0) {
        await sql(`INSERT INTO ${PROJECT_PREFIX}_games (address_bar, title) VALUES ('${game.address_bar}', '${game.title}')`);
        console.log(`✅ 插入游戏: ${game.title}`);
      }
    }

    console.log('🎉 数据库初始化完成！');
    console.log(`📊 项目前缀: ${PROJECT_PREFIX}`);
    console.log(`👤 管理员账户: admin / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('🔗 表结构:');
    console.log(`   - game_admins_users (统一管理员表)`);
    console.log(`   - ${PROJECT_PREFIX}_games (游戏表)`);
    console.log(`   - ${PROJECT_PREFIX}_comments (评论表)`);
    console.log(`   - ${PROJECT_PREFIX}_ratings (评分表)`);

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initializeDatabase();
