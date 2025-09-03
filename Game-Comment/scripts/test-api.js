/**
 * API连接测试脚本
 * 用于验证前端与后端API的连接是否正常
 * 
 * 使用方法:
 * 1. 确保后端API服务正在运行
 * 2. 运行: node scripts/test-api.js
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function testApiConnection() {
  console.log('🔍 测试API连接...');
  console.log(`API地址: ${API_BASE_URL}`);
  
  try {
    // 测试健康检查接口
    console.log('\n1. 测试健康检查接口...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ 健康检查通过:', healthData);
    } else {
      console.log('❌ 健康检查失败:', healthData);
      return;
    }
    
    // 测试评论接口（使用示例游戏ID）
    console.log('\n2. 测试评论接口...');
    const commentsResponse = await fetch(`${API_BASE_URL}/comments?pageId=aaa`);
    const commentsData = await commentsResponse.json();
    
    if (commentsResponse.ok) {
      console.log('✅ 评论接口正常:', commentsData);
    } else {
      console.log('❌ 评论接口失败:', commentsData);
    }
    
    // 测试评分接口
    console.log('\n3. 测试评分接口...');
    const ratingsResponse = await fetch(`${API_BASE_URL}/ratings?pageId=aaa`);
    const ratingsData = await ratingsResponse.json();
    
    if (ratingsResponse.ok) {
      console.log('✅ 评分接口正常:', ratingsData);
    } else {
      console.log('❌ 评分接口失败:', ratingsData);
    }
    
    console.log('\n🎉 API连接测试完成！');
    console.log('\n📋 下一步操作:');
    console.log('1. 启动前端项目: npm run dev');
    console.log('2. 访问游戏详情页测试功能');
    console.log('3. 访问 /admin/login 测试管理员面板');
    
  } catch (error) {
    console.error('❌ API连接测试失败:', error.message);
    console.log('\n🔧 故障排除:');
    console.log('1. 确认后端API服务正在运行');
    console.log('2. 检查API地址是否正确');
    console.log('3. 确认数据库已初始化');
    console.log('4. 检查CORS设置');
  }
}

// 运行测试
testApiConnection();
