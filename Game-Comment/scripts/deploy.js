/**
 * 部署脚本 - 自动切换环境配置
 */

import fs from 'fs';
import path from 'path';

const envFiles = {
  development: '.env',
  production: '.env.production'
};

function switchEnvironment(env) {
  const targetFile = envFiles[env];
  const sourceFile = envFiles.development;
  
  if (!targetFile) {
    console.error(`❌ 不支持的环境: ${env}`);
    process.exit(1);
  }

  try {
    // 读取源文件
    const sourcePath = path.join(process.cwd(), sourceFile);
    const targetPath = path.join(process.cwd(), targetFile);
    
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ 源文件不存在: ${sourceFile}`);
      process.exit(1);
    }

    // 复制文件
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`✅ 已切换到 ${env} 环境配置`);
    console.log(`📁 配置文件: ${targetFile}`);
    
    // 显示当前配置
    const content = fs.readFileSync(targetPath, 'utf8');
    const apiUrl = content.match(/VITE_API_BASE_URL=(.+)/)?.[1];
    console.log(`🔗 API地址: ${apiUrl}`);
    
  } catch (error) {
    console.error(`❌ 切换环境失败:`, error.message);
    process.exit(1);
  }
}

// 获取命令行参数
const env = process.argv[2] || 'development';

console.log(`🚀 准备切换到 ${env} 环境...`);
switchEnvironment(env);
