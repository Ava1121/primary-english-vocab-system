// API 基础路径
const API_BASE = '/api';

// Token 管理
const TokenManager = {
  get() {
    return localStorage.getItem('token');
  },
  set(token) {
    localStorage.setItem('token', token);
  },
  remove() {
    localStorage.removeItem('token');
  }
};

// 用户信息管理
const UserManager = {
  get() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },
  set(userInfo) {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  },
  remove() {
    localStorage.removeItem('userInfo');
  }
};

// HTTP 请求封装
const http = {
  async request(url, options = {}) {
    const token = TokenManager.get();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });

    const data = await response.json();

    // 处理未登录
    if (data.code === 401) {
      TokenManager.remove();
      UserManager.remove();
      window.location.href = '/';
      return;
    }

    return data;
  },

  get(url) {
    return this.request(url, { method: 'GET' });
  },

  post(url, body) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(url, body) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
};

// 提示消息
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

// 年级映射
const gradeMap = {
  1: '一年级',
  2: '二年级',
  3: '三年级',
  4: '四年级',
  5: '五年级',
  6: '六年级'
};

// 退出登录
function logout() {
  TokenManager.remove();
  UserManager.remove();
  window.location.href = '/';
}

// 检查登录状态
function checkAuth(requiredRole) {
  const userInfo = UserManager.get();
  if (!userInfo) {
    window.location.href = '/';
    return false;
  }

  if (requiredRole && userInfo.role !== requiredRole) {
    showToast('无权限访问', 'error');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
    return false;
  }

  return true;
}

// 渲染分页（改进版：显示总数、页数信息）
function renderPagination(container, currentPage, totalPages, onPageChange, totalItems = 0, pageSize = 10) {
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  let html = '<div class="pagination-wrapper">';
  
  // 左侧：统计信息
  html += `<div class="pagination-info">`;
  html += `共 <span class="highlight">${totalItems}</span> 条，`;
  html += `每页 <span class="highlight">${pageSize}</span> 条，`;
  html += `第 <span class="highlight">${startItem}-${endItem}</span> 条`;
  html += `</div>`;
  
  // 右侧：分页按钮
  html += '<div class="pagination">';
  
  // 上一页
  html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">上一页</button>`;
  
  // 页码
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  if (startPage > 1) {
    html += `<button class="page-btn" onclick="changePage(1)">1</button>`;
    if (startPage > 2) {
      html += `<span class="page-ellipsis">...</span>`;
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<span class="page-ellipsis">...</span>`;
    }
    html += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
  }
  
  // 下一页
  html += `<button class="page-btn" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">下一页</button>`;
  
  html += '</div>';
  html += '</div>';
  
  container.innerHTML = html;
  
  // 绑定事件
  window.changePage = onPageChange;
}

// 发音功能（Web Speech API）
function playPronunciation(word) {
  if ('speechSynthesis' in window) {
    // 停止正在播放的发音
    window.speechSynthesis.cancel();
    
    // 创建发音实例
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US'; // 美式发音
    utterance.rate = 1; // 语速
    
    // 播放发音
    window.speechSynthesis.speak(utterance);
  } else {
    showToast('您的浏览器不支持语音功能', 'error');
  }
}
