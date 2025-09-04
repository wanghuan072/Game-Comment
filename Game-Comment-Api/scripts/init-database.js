/**
 * 数据库初始化脚本 - 模板项目
 * 为新的项目前缀创建必要的数据库表
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

const sql = neon(process.env.DATABASE_URL);
const PROJECT_PREFIX = process.env.PROJECT_PREFIX || 'my_project';

async function initializeDatabase() {
  try {
    console.log('🚀 开始初始化数据库...');
    console.log(`📊 项目前缀: ${PROJECT_PREFIX}`);
    
    // 1. 创建反馈表（如果不存在）
    console.log('\n1️⃣ 创建反馈表...');
    
    const createFeedbackTableSQL = `
      CREATE TABLE IF NOT EXISTS ${PROJECT_PREFIX}_feedback (
        id SERIAL PRIMARY KEY,
        game_address_bar VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        text TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        added_by_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await sql(createFeedbackTableSQL);
    console.log(`✅ 创建反馈表 ${PROJECT_PREFIX}_feedback`);
    
    // 2. 创建索引（如果不存在）
    console.log('\n2️⃣ 创建索引...');
    
    await sql(`CREATE INDEX IF NOT EXISTS idx_${PROJECT_PREFIX}_feedback_game_address_bar ON ${PROJECT_PREFIX}_feedback(game_address_bar)`);
    console.log(`✅ 创建游戏地址索引`);
    
    await sql(`CREATE INDEX IF NOT EXISTS idx_${PROJECT_PREFIX}_feedback_created_at ON ${PROJECT_PREFIX}_feedback(created_at)`);
    console.log(`✅ 创建时间索引`);
    
    // 3. 创建管理员表（全局共享，如果不存在）
    console.log('\n3️⃣ 创建管理员表...');
    
    const createAdminTableSQL = `
      CREATE TABLE IF NOT EXISTS game_admins_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        project_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await sql(createAdminTableSQL);
    console.log('✅ 创建管理员表 game_admins_users (全局共享)');
    
    // 4. 检查并创建默认管理员账户
    console.log('\n4️⃣ 检查管理员账户...');
    
    const existingAdmin = await sql`
      SELECT id FROM game_admins_users 
      WHERE username = 'admin' AND project_id = ${PROJECT_PREFIX}
    `;
    
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await sql`
        INSERT INTO game_admins_users (username, password, role, project_id)
        VALUES ('admin', ${hashedPassword}, 'admin', ${PROJECT_PREFIX})
      `;
      console.log(`✅ 创建默认管理员账户 (项目: ${PROJECT_PREFIX})`);
    } else {
      console.log(`ℹ️ 管理员账户已存在 (项目: ${PROJECT_PREFIX})`);
    }
    
    // 5. 验证表结构
    console.log('\n5️⃣ 验证表结构...');
    
    const feedbackTableExists = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = ${PROJECT_PREFIX + '_feedback'}
    `;
    
    const adminTableExists = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'game_admins_users'
    `;
    
    if (feedbackTableExists.length > 0 && adminTableExists.length > 0) {
      console.log('✅ 数据库初始化完成！');
      console.log(`📋 创建的表:`);
      console.log(`   - ${PROJECT_PREFIX}_feedback (反馈表)`);
      console.log(`   - game_admins_users (管理员表)`);
      console.log(`🔑 默认管理员账户:`);
      console.log(`   用户名: admin`);
      console.log(`   密码: admin123`);
      console.log(`   项目: ${PROJECT_PREFIX}`);
    } else {
      throw new Error('表创建验证失败');
    }
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initializeDatabase();
