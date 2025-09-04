// API 基础配置
// 自动检测环境：如果是localhost则使用本地API，否则使用生产API
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (isLocalhost ? 'http://localhost:3000' : 'https://game-comment-api.vercel.app');

console.log(`[API配置] 当前环境: ${isLocalhost ? '本地开发' : '生产环境'}`);
console.log(`[API配置] API地址: ${API_BASE_URL}`);



// 通用请求函数
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }

    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

// 评论相关API
export const commentAPI = {
  // 获取评论
  getComments: (pageId) => request(`/comments?pageId=${pageId}`),
  
  // 提交评论
  submitComment: (commentData) => request('/comments', {
    method: 'POST',
    body: JSON.stringify(commentData),
  }),
};

// 评分相关API
export const ratingAPI = {
  // 获取评分统计
  getRatings: (pageId) => request(`/ratings?pageId=${pageId}`),
  
  // 提交评分
  submitRating: (ratingData) => request('/ratings', {
    method: 'POST',
    body: JSON.stringify(ratingData),
  }),
};

// 管理员API
export const adminAPI = {
  // 管理员登录
  login: (credentials) => request('/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  // 获取所有反馈数据
  getAllGameData: (token) => request('/admin/feedback', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }),
  
  // 删除反馈
  deleteFeedback: (pageId, feedbackId, token) => request(`/admin/feedback/${pageId}/${feedbackId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }),
  
  // 手动添加反馈
  addManualFeedback: (feedbackData, token) => request('/admin/feedback/manual', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedbackData),
  }),
  
  // 更新反馈
  updateFeedback: (pageId, feedbackId, feedbackData, token) => request(`/admin/feedback/${pageId}/${feedbackId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedbackData),
  }),
  
  // 更新评分
  updateRatings: (pageId, ratings, token) => request(`/admin/ratings/${pageId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(ratings),
  }),
};

// 健康检查
export const healthCheck = () => request('/health');
