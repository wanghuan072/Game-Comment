// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
  
  // 获取所有游戏数据
  getAllGameData: (token) => request('/admin/comments', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }),
  
  // 删除评论
  deleteComment: (pageId, commentId, token) => request(`/admin/comments/${pageId}/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }),
  
  // 手动添加评论
  addManualComment: (commentData, token) => request('/admin/comments/manual', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(commentData),
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
