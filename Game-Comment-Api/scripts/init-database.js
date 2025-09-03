/**
 * 数据库初始化脚本
 * 用于在Neon数据库中创建必要的表结构和初始数据
 * 支持多项目共享数据库，通过表名前缀区分不同项目
 * 
 * 使用方法:
 * 1. 配置 .env 文件中的 DATABASE_URL 和 PROJECT_PREFIX
 * 2. 运行: node scripts/init-database.js
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
    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(PROJECT_PREFIX + '_games')} (
        id SERIAL PRIMARY KEY,
        address_bar VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 3. 创建项目特定评论表（带前缀）
    console.log(`💬 创建评论表 ${PROJECT_PREFIX}_comments...`);
    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(PROJECT_PREFIX + '_comments')} (
        id SERIAL PRIMARY KEY,
        game_address_bar VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(254),
        text TEXT NOT NULL,
        added_by_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_address_bar) REFERENCES ${sql(PROJECT_PREFIX + '_games')}(address_bar) ON DELETE CASCADE
      )
    `;

    // 4. 创建项目特定评分表（带前缀）
    console.log(`⭐ 创建评分表 ${PROJECT_PREFIX}_ratings...`);
    await sql`
      CREATE TABLE IF NOT EXISTS ${sql(PROJECT_PREFIX + '_ratings')} (
        id SERIAL PRIMARY KEY,
        game_address_bar VARCHAR(100) NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_address_bar) REFERENCES ${sql(PROJECT_PREFIX + '_games')}(address_bar) ON DELETE CASCADE
      )
    `;

    // 5. 创建项目特定评分统计视图（带前缀）
    console.log(`📊 创建评分统计视图 ${PROJECT_PREFIX}_rating_stats...`);
    await sql`
      CREATE OR REPLACE VIEW ${sql(PROJECT_PREFIX + '_rating_stats')} AS
      SELECT 
        game_address_bar,
        COUNT(*) as total_votes,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5
      FROM ${sql(PROJECT_PREFIX + '_ratings')}
      GROUP BY game_address_bar
    `;

    // 6. 创建索引以提高查询性能（带前缀）
    console.log('🔍 创建索引...');
    await sql`CREATE INDEX IF NOT EXISTS ${sql('idx_' + PROJECT_PREFIX + '_comments_game_address_bar')} ON ${sql(PROJECT_PREFIX + '_comments')}(game_address_bar)`;
    await sql`CREATE INDEX IF NOT EXISTS ${sql('idx_' + PROJECT_PREFIX + '_comments_created_at')} ON ${sql(PROJECT_PREFIX + '_comments')}(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS ${sql('idx_' + PROJECT_PREFIX + '_ratings_game_address_bar')} ON ${sql(PROJECT_PREFIX + '_ratings')}(game_address_bar)`;
    await sql`CREATE INDEX IF NOT EXISTS ${sql('idx_' + PROJECT_PREFIX + '_ratings_created_at')} ON ${sql(PROJECT_PREFIX + '_ratings')}(created_at)`;

    // 7. 创建默认管理员账户（带项目ID）
    console.log(`👤 创建默认管理员账户 (项目: ${PROJECT_PREFIX})...`);
    const existingAdmin = await sql`
      SELECT id FROM game_admins_users WHERE username = 'admin' AND project_id = ${PROJECT_PREFIX}
    `;
    
    if (existingAdmin.length === 0) {
      const initialPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(initialPassword, 10);
      
      await sql`
        INSERT INTO game_admins_users (username, password, role, project_id)
        VALUES ('admin', ${hashedPassword}, 'admin', ${PROJECT_PREFIX})
      `;
      
      console.log('✅ 默认管理员账户创建成功');
      console.log(`   用户名: admin`);
      console.log(`   项目ID: ${PROJECT_PREFIX}`);
      console.log(`   密码: ${initialPassword}`);
      console.log('   ⚠️  请在生产环境中立即修改默认密码！');
    } else {
      console.log('ℹ️  管理员账户已存在，跳过创建');
    }

    // 8. 插入示例游戏数据（可选，使用前缀表）
    console.log(`🎯 插入示例游戏数据到 ${PROJECT_PREFIX}_games...`);
    const existingGames = await sql`
      SELECT address_bar FROM ${sql(PROJECT_PREFIX + '_games')} LIMIT 1
    `;
    
    if (existingGames.length === 0) {
      // 从 games.js 数据中插入示例游戏
      const sampleGames = [
        { address_bar: 'aaa', title: '示例游戏 A' },
        { address_bar: 'bbb', title: '示例游戏 B' },
        { address_bar: 'ccc', title: '示例游戏 C' }
      ];
      
      for (const game of sampleGames) {
        await sql`
          INSERT INTO ${sql(PROJECT_PREFIX + '_games')} (address_bar, title)
          VALUES (${game.address_bar}, ${game.title})
          ON CONFLICT (address_bar) DO NOTHING
        `;
      }
      
      console.log('✅ 示例游戏数据插入成功');
    } else {
      console.log('ℹ️  游戏数据已存在，跳过插入');
    }

    console.log('🎉 数据库初始化完成！');
    console.log('');
    console.log('📋 下一步操作:');
    console.log('1. 启动API服务器: npm start');
    console.log('2. 访问管理面板: /admin/login');
    console.log(`3. 使用默认账户登录 (项目: ${PROJECT_PREFIX}) 并修改密码`);
    console.log('4. 根据需要添加更多游戏数据');
    console.log('');
    console.log('📊 创建的表结构:');
    console.log(`   - game_admins_users (统一用户表)`);
    console.log(`   - ${PROJECT_PREFIX}_games (游戏表)`);
    console.log(`   - ${PROJECT_PREFIX}_comments (评论表)`);
    console.log(`   - ${PROJECT_PREFIX}_ratings (评分表)`);
    console.log(`   - ${PROJECT_PREFIX}_rating_stats (评分统计视图)`);

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initializeDatabase();
