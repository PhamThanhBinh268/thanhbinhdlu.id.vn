// =============================================================================
// API Configuration và Utilities
// =============================================================================

// API Configuration
const API_CONFIG = {
  BASE_URL: (function () {
    try {
      if (window.location && window.location.origin.startsWith("http")) {
        return window.location.origin + "/api";
      }
    } catch (e) {}
    return "http://localhost:8080/api"; // fallback
  })(),
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      ME: "/auth/me",
      REFRESH: "/auth/refresh",
    },
    USERS: "/users",
    CATEGORIES: "/categories",
    POSTS: "/posts",
    MESSAGES: "/messages",
    TRANSACTIONS: "/transactions",
    RATINGS: "/ratings",
  },
};

// =============================================================================
// Auth Management
// =============================================================================
class AuthManager {
  static TOKEN_KEY = "token";
  static USER_KEY = "user";

  static setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser() {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static isLoggedIn() {
    return !!this.getToken();
  }

  static logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = "index.html";
  }

  static getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// =============================================================================
// API Service
// =============================================================================
class ApiService {
  static async request(endpoint, options = {}) {
    const url = API_CONFIG.BASE_URL + endpoint;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...AuthManager.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);

      // Nếu token hết hạn, tự động logout
      if (
        error.message.includes("Token đã hết hạn") ||
        error.message.includes("Token không hợp lệ")
      ) {
        AuthManager.logout();
        return;
      }

      throw error;
    }
  }

  static async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams(params);
    const url = searchParams.toString()
      ? `${endpoint}?${searchParams}`
      : endpoint;

    return this.request(url, {
      method: "GET",
    });
  }

  static async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }

  // Upload file với FormData
  static async uploadFile(endpoint, formData) {
    const token = AuthManager.getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(API_CONFIG.BASE_URL + endpoint, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    return data;
  }
}

// =============================================================================
// Utility Functions
// =============================================================================
class Utils {
  // Format tiền tệ VNĐ
  static formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  // Format thời gian tương đối
  static formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return "Vừa xong";
  }

  // Format thời gian chuẩn
  static formatDateTime(date) {
    return new Date(date).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Tạo slug từ tiêu đề
  static createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
      .replace(/[èéẹẻẽêềếệểễ]/g, "e")
      .replace(/[ìíịỉĩ]/g, "i")
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
      .replace(/[ùúụủũưừứựửữ]/g, "u")
      .replace(/[ỳýỵỷỹ]/g, "y")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // Hiển thị toast notification
  static showToast(message, type = "info") {
    const toastContainer = this.getOrCreateToastContainer();
    const toast = document.createElement("div");
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.innerHTML = `
            ${message}
            <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
            </button>
        `;

    toastContainer.appendChild(toast);

    // Tự động ẩn sau 5 giây
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 5000);
  }

  static getOrCreateToastContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
      document.body.appendChild(container);
    }
    return container;
  }

  // Loading state management
  static showLoading(element) {
    if (element) {
      element.disabled = true;
      const originalText = element.innerHTML;
      element.setAttribute("data-original-text", originalText);
      element.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    }
  }

  static hideLoading(element) {
    if (element) {
      element.disabled = false;
      const originalText = element.getAttribute("data-original-text");
      if (originalText) {
        element.innerHTML = originalText;
        element.removeAttribute("data-original-text");
      }
    }
  }

  // Debounce function
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Validate email
  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Validate phone number (Vietnam)
  static isValidPhone(phone) {
    // Chấp nhận 0xxxxxxxxx hoặc +84xxxxxxxxx
    const re = /^(0|\+84)[0-9]{9,10}$/;
    return re.test(phone.trim());
  }

  // Truncate text
  static truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  }

  // Get query parameter
  static getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Set query parameter
  static setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, "", url);
  }

  // Scroll to top
  static scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}

// =============================================================================
// DOM Ready Event
// =============================================================================
document.addEventListener("DOMContentLoaded", function () {
  // Update navigation cho user đã login
  updateNavigationForUser();

  // Setup search functionality
  setupGlobalSearch();

  // Setup responsive handlers
  setupResponsiveHandlers();
});

function updateNavigationForUser() {
  const user = AuthManager.getUser();
  const authButtons = document.querySelector(".btn-group");

  if (user && authButtons) {
    authButtons.innerHTML = `
            <div class="dropdown">
        <button class="btn btn-sm btn-light dropdown-toggle d-flex align-items-center" type="button" data-toggle="dropdown" style="gap:6px;">
          <img src="${
            user.avatar || "img/user.jpg"
          }" style="width:24px;height:24px;object-fit:cover;border-radius:50%;border:1px solid #ddd;" alt="avatar" />
          <span style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${
            user.hoTen
          }</span>
        </button>
                <div class="dropdown-menu">
                    <a class="dropdown-item" href="profile.html">
                        <i class="fas fa-user"></i> Hồ sơ
                    </a>
                    <a class="dropdown-item" href="my-posts.html">
                        <i class="fas fa-list"></i> Bài đăng của tôi
                    </a>
                    <a class="dropdown-item" href="messages.html">
                        <i class="fas fa-envelope"></i> Tin nhắn
                    </a>
                    <a class="dropdown-item" href="create-post.html">
                        <i class="fas fa-plus"></i> Đăng bài mới
                    </a>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item" href="#" onclick="AuthManager.logout()">
                        <i class="fas fa-sign-out-alt"></i> Đăng xuất
                    </a>
                </div>
            </div>
        `;
  }
}

function setupGlobalSearch() {
  const searchForm = document.querySelector('form[action=""]');
  const searchInput = document.querySelector(
    'input[placeholder="Tìm kiếm sản phẩm"]'
  );

  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
      }
    });
  }
}

function setupResponsiveHandlers() {
  // Handle mobile menu
  const navbarToggler = document.querySelector(".navbar-toggler");
  if (navbarToggler) {
    navbarToggler.addEventListener("click", function () {
      const target = document.querySelector(this.getAttribute("data-target"));
      if (target) {
        target.classList.toggle("show");
      }
    });
  }
}

// =============================================================================
// Export for use in other files
// =============================================================================
window.ApiService = ApiService;
window.AuthManager = AuthManager;
window.Utils = Utils;
window.API_CONFIG = API_CONFIG;
