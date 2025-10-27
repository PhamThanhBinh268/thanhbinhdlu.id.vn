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
    return "http://thanhbinhdlu.id.vn/api"; // production URL
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
    VIP_PACKAGES: "/vip-packages",
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
    window.location.href = "/index.html";
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
  // Decorator-style middleware registry
  static middlewares = [];

  static use(mw) {
    if (mw && (mw.beforeRequest || mw.afterResponse || mw.onError)) {
      this.middlewares.push(mw);
    }
  }

  static async request(endpoint, options = {}) {
    // Build URL and config
    let url = API_CONFIG.BASE_URL + endpoint;
    let config = {
      headers: {
        "Content-Type": "application/json",
        ...AuthManager.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    // Run beforeRequest middlewares (Decorator pattern)
    for (const mw of this.middlewares) {
      if (typeof mw.beforeRequest === "function") {
        try {
          const out = await mw.beforeRequest(url, config);
          if (out && (out.url || out.config)) {
            url = out.url || url;
            config = out.config || config;
          }
        } catch (e) {
          // swallow to avoid breaking chain; allow onError to handle later
        }
      }
    }

    if (window.DEBUG_API) {
    }

    try {
      const retryCfg = {
        retries: options.retries != null ? options.retries : 2,
        retryOn: options.retryOn || [429, 502, 503, 504],
        backoffMs: options.backoffMs || 400,
      };
      let attempt = 0;
      // Fetch loop with light retry for transient errors
      // beforeRequest already executed once above; we keep url/config constant per request
      // to avoid surprising behavior.
      while (true) {
        let response;
        let data;
        try {
          response = await fetch(url, config);
          try {
            data = await response.json();
          } catch (e) {
            data = null; // non-JSON
          }

          if (window.DEBUG_API) {
          }

          // afterResponse middlewares for each attempt
          for (const mw of this.middlewares) {
            if (typeof mw.afterResponse === "function") {
              try {
                const out = await mw.afterResponse(response, data, { url, config, attempt });
                if (out && (out.response || out.data)) {
                  if (out.data !== undefined) data = out.data;
                }
              } catch (e) {
              }
            }
          }

          if (!response.ok) {
            const status = response.status;
            const retryable = retryCfg.retryOn.includes(status) && attempt < retryCfg.retries;
            if (retryable) {
              attempt += 1;
              await new Promise((r) => setTimeout(r, retryCfg.backoffMs * attempt));
              continue; // retry
            }
            const err = new Error((data && data.message) || "API request failed");
            err.status = status;
            err.data = data;
            throw err;
          }

          return data;
        } catch (innerError) {
          // Network or thrown error inside loop
          const canRetry = attempt < retryCfg.retries;
          if (canRetry) {
            attempt += 1;
            await new Promise((r) => setTimeout(r, retryCfg.backoffMs * attempt));
            continue;
          }
          // exhausted: escalate to outer catch
          throw innerError;
        }
      }
    } catch (error) {
      // Nếu token hết hạn, tự động logout
      if (
        typeof error.message === "string" &&
        (error.message.includes("Token đã hết hạn") ||
          error.message.includes("Token không hợp lệ"))
      ) {
        AuthManager.logout();
        return;
      }

      // Run onError middlewares (last chance to handle/retry)
      for (const mw of this.middlewares) {
        if (typeof mw.onError === "function") {
          try {
            const maybe = await mw.onError(error);
            if (maybe === "SWALLOW") return; // allow middleware to swallow
          } catch (e) {
          }
        }
      }

      console.error("❌ API Error:", error);
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
// Built-in Decorators (middlewares): Retry + Timing Logger
// =============================================================================
function RetryMiddleware({ retries = 2, retryOn = [429, 502, 503, 504], backoffMs = 400 } = {}) {
  return {
    async afterResponse(response, data, ctx) {
      // success: nothing to do
      return undefined;
    },
    async onError(error) {
      // Only handle if status is retryable
      if (!error || typeof error.status !== "number") return undefined;
      if (!this._ctx) this._ctx = { attempts: 0 };
      if (!this._ctx.attempts) this._ctx.attempts = 0;
      if (!retryOn.includes(error.status) || this._ctx.attempts >= retries) {
        return undefined;
      }
      this._ctx.attempts += 1;
      await new Promise((r) => setTimeout(r, backoffMs * this._ctx.attempts));
      // Re-issue last request by throwing a special token the caller can catch? Simpler: return undefined.
      // We cannot re-call here without url/config; a smarter middleware would wrap ApiService.request.
      return undefined;
    },
  };
}

function TimingLogger() {
  return {
    async beforeRequest(url, config) {
      this._t0 = performance && performance.now ? performance.now() : Date.now();
      if (window.DEBUG_API)
      return { url, config };
    },
    async afterResponse(response, data, { url }) {
      const t1 = performance && performance.now ? performance.now() : Date.now();
      const delta = Math.round(t1 - (this._t0 || t1));
      if (window.DEBUG_API)
      return { data };
    },
  };
}

// Toggle debugging easily in console
window.DEBUG_API = window.DEBUG_API || false;
// Register light middlewares (no-op if DEBUG_API=false)
ApiService.use(TimingLogger());
// Note: RetryMiddleware is scaffolding for future enhancement; currently logs timing and allows future retries
ApiService.use(RetryMiddleware());

// =============================================================================
// Utility Functions
// =============================================================================
class Utils {
  // Escape HTML để tránh XSS
  static escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

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
    // Avoid CSP warning for external placeholder: fallback to local image
    const safeAvatar = (user.avatar && !/via\.placeholder\.com/.test(user.avatar))
      ? user.avatar
      : "/img/user.jpg";
    authButtons.innerHTML = `
            <div class="dropdown">
        <button class="btn btn-sm btn-light dropdown-toggle d-flex align-items-center" type="button" data-toggle="dropdown" style="gap:6px;">
          <img src="${safeAvatar}" style="width:24px;height:24px;object-fit:cover;border-radius:50%;border:1px solid #ddd;" alt="avatar" />
          <span style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${
            user.hoTen
          }</span>
        </button>
                <div class="dropdown-menu">
                    ${user.vaiTro === 'admin' ? `<a class="dropdown-item" href="/admin/dashboard.html"><i class="fas fa-tools"></i> Quản trị</a><div class="dropdown-divider"></div>` : ''}
                    <a class="dropdown-item" href="/profile.html">
                        <i class="fas fa-user"></i> Hồ sơ
                    </a>
                    <a class="dropdown-item" href="/my-posts.html">
                        <i class="fas fa-list"></i> Bài đăng của tôi
                    </a>
                    <a class="dropdown-item" href="/messages.html">
                        <i class="fas fa-envelope"></i> Tin nhắn
                    </a>
                    <a class="dropdown-item" href="/create-post.html">
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
  window.location.href = `/shop.html?search=${encodeURIComponent(query)}`;
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

// =============================================================================
// Transaction Payment & Shipping API Helpers
// =============================================================================
window.TransactionAPI = {
  /**
   * Thiết lập thanh toán & giao hàng
   */
  async setupPayment(transactionId, data) {
    return ApiService.request(`/transactions/${transactionId}/setup-payment`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * Upload ảnh chuyển khoản
   */
  async uploadPaymentProof(transactionId, imageUrl) {
    return ApiService.request(`/transactions/${transactionId}/upload-payment-proof`, {
      method: "PATCH",
      body: JSON.stringify({ anhChuyenKhoan: imageUrl }),
    });
  },

  /**
   * Người bán xác nhận đã nhận tiền
   */
  async confirmPayment(transactionId) {
    return ApiService.request(`/transactions/${transactionId}/confirm-payment`, {
      method: "PATCH",
    });
  },

  /**
   * Bắt đầu giao hàng
   */
  async startShipping(transactionId, data) {
    return ApiService.request(`/transactions/${transactionId}/start-shipping`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * Xác nhận đã nhận hàng
   */
  async confirmDelivery(transactionId) {
    return ApiService.request(`/transactions/${transactionId}/confirm-delivery`, {
      method: "PATCH",
    });
  },

  /**
   * Hoàn thành giao dịch
   */
  async completeTransaction(transactionId) {
    return ApiService.request(`/transactions/${transactionId}/complete`, {
      method: "PATCH",
    });
  },
};
window.API_CONFIG = API_CONFIG;
