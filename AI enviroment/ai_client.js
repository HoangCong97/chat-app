/**
 * 🤖 AI Client Helper - Web02_Messenger
 * 
 * Module giúp AI/Agent gọi API backend dễ dàng.
 * Hỗ trợ cả CommonJS và ES Module.
 * 
 * Cách dùng:
 *   const aiClient = require('./AI enviroment/ai_client');
 *   const users = await aiClient.getUsers();
 * 
 * Yêu cầu: axios (có thể dùng fetch nếu muốn)
 */

const API_BASE = process.env.VITE_API_URL || process.env.API_URL || "http://localhost:5000";

// Sử dụng fetch built-in (không cần cài thêm)
async function request(method, path, options = {}) {
  const { body, headers = {}, params } = options;

  let url = `${API_BASE}${path}`;
  
  // Append query params
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const fetchOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ========== Public API ==========

/**
 * Lấy danh sách tất cả users
 * @returns {Promise<Array>}
 */
async function getUsers() {
  return request("GET", "/users");
}

/**
 * Đăng ký user mới
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{token: string, user: object}>}
 */
async function register(username, password) {
  return request("POST", "/register", {
    body: { username, password },
  });
}

/**
 * Đăng nhập
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{token: string, user: object}>}
 */
async function login(username, password) {
  return request("POST", "/login", {
    body: { username, password },
  });
}

/**
 * Đổi mật khẩu
 * @param {string} username
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns {Promise<object>}
 */
async function changePassword(username, oldPassword, newPassword) {
  return request("PUT", "/changePassword", {
    body: { username, oldPassword, newPassword },
  });
}

/**
 * Lấy profile (cần token)
 * @param {string} token - JWT token
 * @returns {Promise<object>}
 */
async function getProfile(token) {
  return request("GET", "/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Lấy tin nhắn của conversation
 * @param {number} conversationId
 * @param {string} username
 * @returns {Promise<Array>}
 */
async function getMessages(conversationId, username) {
  return request("GET", "/conversation/messages", {
    params: {
      conversation_id: conversationId,
      username,
    },
  });
}

/**
 * Upload ảnh lên server (cần token)
 * @param {string} token - JWT token
 * @param {File|Blob} imageFile - File ảnh từ input type="file"
 * @returns {Promise<{image_url: string}>}
 */
async function uploadImage(token, imageFile) {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Gửi tin nhắn mới (hỗ trợ text và ảnh)
 * @param {number} conversationId
 * @param {string} token - JWT token
 * @param {object} options - { content, type, image_url }
 * @param {string} [options.content] - Nội dung text (optional nếu type=image)
 * @param {string} [options.type] - "text" hoặc "image", mặc định "text"
 * @param {string} [options.image_url] - URL ảnh (required nếu type=image)
 * @returns {Promise<object>} Message object
 */
async function postMessage(conversationId, token, options = {}) {
  const { content, type = "text", image_url } = options;
  const body = { type };
  if (content !== undefined) body.content = content;
  if (image_url !== undefined) body.image_url = image_url;

  return request("POST", `/conversation/${conversationId}/postMessage`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });
}

/**
 * Kiểm tra kết nối database
 * @returns {Promise<Array>}
 */
async function healthCheck() {
  return request("GET", "/");
}

// ========== Export ==========

module.exports = {
  getUsers,
  register,
  login,
  changePassword,
  getProfile,
  getMessages,
  uploadImage,
  postMessage,
  healthCheck,
  request, // raw request method
};