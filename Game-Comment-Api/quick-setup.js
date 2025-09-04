/**
 * 快速项目设置 - 使用配置文件
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import { readFileSync, writeFileSync, existsSync } from 'fs';

async function quickSetup() {
  try {
    console.log('🚀 快速项目设置...');
    
    // 1. 检查配置文件
    if (!existsSync('./config.js')) {
      console.log('❌ 未找到配置文件 config.js');
      console.log('📝 请按以下步骤操作:');
      console.log('1. 复制 config.template.js 为 config.js');
      console.log('2. 修改 config.js 中的配置');
      console.log('3. 重新运行 npm run quick-setup');
      return;
    }
    
    // 2. 加载配置
    const { CONFIG } = await import('./config.js');
    
    console.log(`📊 项目前缀: ${CONFIG.PROJECT_PREFIX}`);
    console.log(`🌐 API域名: ${CONFIG.API_DOMAIN}`);
    console.log(`🖥️ 前端域名: ${CONFIG.FRONTEND_DOMAIN}`);
    
    // 3. 验证必要配置
    if (!CONFIG.PROJECT_PREFIX || CONFIG.PROJECT_PREFIX === 'mycompany_mygame') {
      console.log('❌ 请在 config.js 中设置唯一的 PROJECT_PREFIX');
      return;
    }
    
    if (!CONFIG.API_DOMAIN || CONFIG.API_DOMAIN.includes('my-game-api')) {
      console.log('❌ 请在 config.js 中设置正确的 API_DOMAIN');
      return;
    }
    
    // 4. 检查数据库连接
    console.log('\n1️⃣ 测试数据库连接...');
    const sql = neon(CONFIG.DATABASE_URL || process.env.DATABASE_URL);
    
    try {
      await sql`SELECT NOW() as current_time`;
      console.log('✅ 数据库连接成功');
    } catch (error) {
      console.error('❌ 数据库连接失败:', error.message);
      return;
    }
    
    // 5. 创建环境配置文件
    console.log('\n2️⃣ 创建环境配置...');
    
    // 后端配置
    const backendEnv = `# 项目配置 - 自动生成
PROJECT_PREFIX=${CONFIG.PROJECT_PREFIX}
PROJECT_NAME=${CONFIG.PROJECT_NAME}

# 数据库连接
DATABASE_URL=${CONFIG.DATABASE_URL || process.env.DATABASE_URL}

# JWT密钥
JWT_SECRET=${CONFIG.JWT_SECRET}

# API配置
API_BASE_URL=${CONFIG.API_DOMAIN}
PORT=${CONFIG.LOCAL_API_PORT}

# CORS配置
FRONTEND_URL=${CONFIG.FRONTEND_DOMAIN}

# 本地开发
NODE_ENV=development
`;
    
    writeFileSync('.env.local', backendEnv);
    console.log('✅ 后端环境配置完成');
    
    // 前端配置
    const frontendEnv = `# 前端配置 - 自动生成
VITE_API_BASE_URL=${CONFIG.API_DOMAIN}
VITE_SITE_NAME=${CONFIG.PROJECT_NAME}
VITE_SITE_DESCRIPTION=${CONFIG.PROJECT_DESCRIPTION}
VITE_LOCAL_API_URL=http://localhost:${CONFIG.LOCAL_API_PORT}
`;
    
    try {
      writeFileSync('../Game-Comment/.env', frontendEnv);
      console.log('✅ 前端环境配置完成');
    } catch (error) {
      console.log('⚠️ 请手动创建前端 .env 文件');
    }
    
    // 6. 初始化数据库
    console.log('\n3️⃣ 初始化数据库...');
    
    // 更新环境变量
    process.env.PROJECT_PREFIX = CONFIG.PROJECT_PREFIX;
    
    // 创建必要的表
    await sql`
      CREATE TABLE IF NOT EXISTS game_projects (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR(50) NOT NULL UNIQUE,
        project_name VARCHAR(100) NOT NULL,
        project_type VARCHAR(50) DEFAULT 'game_review',
        feedback_table_name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS game_admins_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        project_id VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP,
        last_login_at TIMESTAMP
      )
    `;
    
    // 注册项目
    await sql`
      INSERT INTO game_projects (project_id, project_name, project_type, feedback_table_name, description)
      VALUES (
        ${CONFIG.PROJECT_PREFIX}, 
        ${CONFIG.PROJECT_NAME}, 
        'game_review', 
        ${CONFIG.PROJECT_PREFIX + '_feedback'},
        ${CONFIG.PROJECT_DESCRIPTION}
      )
      ON CONFLICT (project_id) DO UPDATE SET
        project_name = EXCLUDED.project_name,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP,
        is_active = true
    `;
    
    // 创建反馈表
    const feedbackTableName = `${CONFIG.PROJECT_PREFIX}_feedback`;
    await sql(`
      CREATE TABLE IF NOT EXISTS ${feedbackTableName} (
        id SERIAL PRIMARY KEY,
        project_id VARCHAR(50) NOT NULL DEFAULT '${CONFIG.PROJECT_PREFIX}',
        game_address_bar VARCHAR(100) NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        text TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        added_by_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ 数据库初始化完成');
    
    // 7. 创建管理员
    console.log('\n4️⃣ 创建管理员...');
    const existingAdmin = await sql`
      SELECT id FROM game_admins_users 
      WHERE username = 'admin' AND project_id = ${CONFIG.PROJECT_PREFIX}
    `;
    
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash(CONFIG.DEFAULT_ADMIN_PASSWORD, 10);
      
      await sql`
        INSERT INTO game_admins_users (username, password, role, project_id)
        VALUES ('admin', ${hashedPassword}, 'admin', ${CONFIG.PROJECT_PREFIX})
      `;
      
      console.log('✅ 管理员创建完成');
      console.log(`   用户名: admin`);
      console.log(`   密码: ${CONFIG.DEFAULT_ADMIN_PASSWORD}`);
    } else {
      console.log('✅ 管理员已存在');
    }
    
    // 8. 生成部署配置
    console.log('\n5️⃣ 生成部署配置...');
    
    const vercelConfig = {
      "name": CONFIG.PROJECT_PREFIX + "-api",
      "version": 2,
      "builds": [{ "src": "api/index.js", "use": "@vercel/node" }],
      "routes": [{ "src": "/(.*)", "dest": "/api/index.js" }],
      "env": {
        "PROJECT_PREFIX": CONFIG.PROJECT_PREFIX,
        "DATABASE_URL": "@database_url",
        "JWT_SECRET": "@jwt_secret"
      }
    };
    
    writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    console.log('✅ Vercel配置生成完成');
    
    // 9. 完成提示
    console.log('\n🎉 快速设置完成！');
    console.log('='.repeat(50));
    console.log(`🆔 项目: ${CONFIG.PROJECT_NAME}`);
    console.log(`🔧 前缀: ${CONFIG.PROJECT_PREFIX}`);
    console.log(`🌐 API: ${CONFIG.API_DOMAIN}`);
    console.log(`🖥️ 前端: ${CONFIG.FRONTEND_DOMAIN}`);
    
    console.log('\n📝 下一步:');
    console.log('1. 修改 Game-Comment/src/data/games.js 配置你的游戏');
    console.log('2. 本地测试: npm run dev');
    console.log('3. 部署到 Vercel');
    
    console.log('\n🔑 管理员登录:');
    console.log('   用户名: admin');
    console.log(`   密码: ${CONFIG.DEFAULT_ADMIN_PASSWORD}`);
    console.log('   (建议部署后立即修改密码)');
    
  } catch (error) {
    console.error('❌ 快速设置失败:', error);
  }
}

quickSetup();