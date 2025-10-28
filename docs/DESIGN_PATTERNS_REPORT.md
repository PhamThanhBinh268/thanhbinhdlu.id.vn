# BÁO CÁO: ÁP DỤNG CÁC MẪU THIẾT KẾ (DESIGN PATTERNS) TRONG DỰ ÁN WEBSITE TRAO ĐỔI ĐỒ CŨ

---

## MỤC LỤC

1. [Giới thiệu](#1-giới-thiệu)
2. [Tổng quan các Design Patterns đã triển khai](#2-tổng-quan-các-design-patterns-đã-triển-khai)
3. [Chi tiết từng Design Pattern](#3-chi-tiết-từng-design-pattern)
   - 3.1 [Singleton Pattern](#31-singleton-pattern)
   - 3.2 [Strategy Pattern](#32-strategy-pattern)
   - 3.3 [Decorator Pattern](#33-decorator-pattern)
4. [Tích hợp Realtime Update với Socket.IO](#4-tích-hợp-realtime-update-với-socketio)
5. [Lợi ích và Kết quả đạt được](#5-lợi-ích-và-kết-quả-đạt-được)
6. [Hướng mở rộng và cải tiến](#6-hướng-mở-rộng-và-cải-tiến)
7. [Kết luận](#7-kết-luận)

---

## 1. GIỚI THIỆU

### 1.1. Bối cảnh dự án

Website Trao Đổi Đồ Cũ là nền tảng cho phép người dùng đăng bài, mua/bán/trao đổi các vật phẩm cũ. Dự án sử dụng:

- **Frontend**: HTML5, Bootstrap 4, jQuery, vanilla JavaScript modules
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.IO
- **Chức năng chính**: Đăng bài, tìm kiếm/lọc sản phẩm, chat realtime, admin quản lý, thanh toán, đánh giá

### 1.2. Mục tiêu áp dụng Design Patterns

- **Tổ chức code rõ ràng**: Tách biệt trách nhiệm, giảm độ phức tạp
- **Tái sử dụng code**: Tránh lặp lại logic, dễ bảo trì và mở rộng
- **Linh hoạt và mở rộng**: Thêm tính năng mới (sort, filter, decorators) không làm ảnh hưởng code cũ
- **Cải thiện UX**: Realtime update, hiển thị nhất quán (giá giảm, badge, nổi bật)

### 1.3. Các Design Patterns được lựa chọn

1. **Singleton Pattern**: Quản lý trạng thái dùng chung (AuthManager, ApiService, kết nối DB)
2. **Strategy Pattern**: Chọn thuật toán/hành vi theo khóa (sort, formatters hiển thị)
3. **Decorator Pattern**: Thêm/bớt chức năng chéo (logging, retry, badge, giá giảm) không xâm lấn code gốc

---

## 2. TỔNG QUAN CÁC DESIGN PATTERNS ĐÃ TRIỂN KHAI

| Pattern | Vị trí triển khai | Mục đích |
|---------|-------------------|----------|
| **Singleton** | `client/js/api.js` (AuthManager, ApiService, Utils), `server/src/index.js` (Express app, Socket.IO, Mongoose) | Quản lý trạng thái dùng chung, đảm bảo chỉ một instance |
| **Strategy** | `server/src/routes/posts.js` (sortStrategies), `client/js/formatters.js` (getPriceLabel, getConditionText, …) | Chọn thuật toán theo khóa (sort, hiển thị), dễ mở rộng |
| **Decorator** | `client/js/api.js` (middleware pipeline), `client/js/decorators.js` (ProductDecorators, UserDecorators) | Thêm chức năng chéo (retry, timing, badge, giá giảm) không sửa code gốc |

---

## 3. CHI TIẾT TỪNG DESIGN PATTERN

### 3.1. Singleton Pattern

#### 3.1.1. Định nghĩa

**Singleton** đảm bảo một class chỉ có **duy nhất một instance** và cung cấp điểm truy cập toàn cục đến instance đó.

#### 3.1.2. Triển khai trong dự án

##### **Client-side: `client/js/api.js`**

```javascript
// AuthManager: Quản lý token và user (singleton)
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
```

- **Vai trò**: Quản lý token, user thông tin dùng chung toàn site
- **Lợi ích**: Tránh nhiều bản sao token/user, dễ đồng bộ trạng thái login/logout

##### **Server-side: `server/src/index.js`**

```javascript
// Express app: singleton instance
const app = express();

// Socket.IO: singleton instance
const server = http.createServer(app);
const io = socketIO(server, { cors: corsOptions });

// Mongoose connection: singleton (chỉ kết nối một lần)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

- **Vai trò**: Express app, Socket.IO, Mongoose connection chỉ tạo một lần và dùng chung
- **Lợi ích**: Tiết kiệm tài nguyên, tránh kết nối DB nhiều lần, dễ quản lý lifecycle

#### 3.1.3. Biểu đồ minh họa

```
┌─────────────────────────────────────────┐
│         Singleton Pattern               │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐                      │
│  │ AuthManager  │◄──────┐              │
│  │ (static)     │       │              │
│  └──────────────┘       │              │
│        ▲                │              │
│        │ getToken()     │ setToken()   │
│        │ getUser()      │ logout()     │
│        │                │              │
│  ┌─────┴────────────────┴──────┐       │
│  │   Các module khác           │       │
│  │   (index.js, shop.js, ...)  │       │
│  └─────────────────────────────┘       │
│                                         │
│  Chỉ một instance, truy cập toàn cục   │
└─────────────────────────────────────────┘
```

#### 3.1.4. Ưu điểm

- **Đơn giản hóa quản lý trạng thái**: Token, user, cấu hình chung ở một nơi
- **Tránh xung đột**: Không có nhiều bản sao trôi nổi
- **Dễ test**: Mock AuthManager.getToken() thay vì phải mock localStorage nhiều lần

---

### 3.2. Strategy Pattern

#### 3.2.1. Định nghĩa

**Strategy** cho phép định nghĩa một họ các thuật toán/hành vi, đóng gói chúng thành các chiến lược riêng biệt và chọn chiến lược phù hợp theo ngữ cảnh (thay vì chuỗi if/else dài).

#### 3.2.2. Triển khai trong dự án

##### **Server-side: Sort Strategies (`server/src/routes/posts.js`)**

```javascript
// Strategy map: chọn cách sắp xếp theo key
const sortStrategies = {
  newest: () => ({ createdAt: -1 }),
  oldest: () => ({ createdAt: 1 }),
  price_low: () => ({ gia: 1, createdAt: -1 }),
  price_high: () => ({ gia: -1, createdAt: -1 }),
};

// Áp dụng chiến lược
router.get("/", async (req, res) => {
  const { sortBy } = req.query;
  const strategy = sortStrategies[sortBy] || sortStrategies.newest;
  const sortOptions = strategy();

  const posts = await Post.find(filters)
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("nguoiDang", "hoTen avatar email")
    .populate("danhMuc", "tenDanhMuc");

  res.json({ success: true, data: posts, total, page, pages });
});
```

- **Lợi ích**: Thêm sort mới (ví dụ: `rating_desc`) chỉ cần thêm một key vào `sortStrategies` mà không sửa logic chính

##### **Client-side: Display Formatters (`client/js/formatters.js`)**

```javascript
// Strategy: hiển thị giá theo loaiGia
function getPriceLabel(loaiGia, gia) {
  if (loaiGia === 'cho-mien-phi') return '<span class="text-success">Miễn phí</span>';
  if (loaiGia === 'trao-doi') return '<span class="text-primary">Trao đổi</span>';
  return (window.Utils && Utils.formatCurrency) ? Utils.formatCurrency(gia || 0) : String(gia || 0);
}

// Strategy: hiển thị tình trạng
function getConditionText(tinhTrang) {
  const map = {
    'moi': 'Mới',
    'nhu-moi': 'Như mới',
    'tot': 'Tốt',
    'kha': 'Khá',
    'can-sua-chua': 'Cần sửa chữa',
  };
  return map[tinhTrang] || tinhTrang || '';
}

// Strategy: màu badge
function getConditionBadgeClass(tinhTrang) {
  const map = {
    'moi': 'success',
    'nhu-moi': 'info',
    'tot': 'primary',
    'kha': 'warning',
    'can-sua-chua': 'danger',
  };
  return map[tinhTrang] || 'secondary';
}

window.Formatters = { getPriceLabel, getConditionText, getConditionBadgeClass, getLocation };
```

- **Lợi ích**: Hiển thị nhất quán toàn site (index.js, shop.js, detail.js), dễ mở rộng (thêm trường hợp mới vào map)

#### 3.2.3. Biểu đồ minh họa

```
┌─────────────────────────────────────────┐
│         Strategy Pattern                │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  sortStrategies (map)             │  │
│  │  ─────────────────────            │  │
│  │  newest: () => {createdAt: -1}    │  │
│  │  oldest: () => {createdAt: 1}     │  │
│  │  price_low: () => {gia: 1, ...}   │  │
│  │  price_high: () => {gia: -1, ...} │  │
│  └───────────────────────────────────┘  │
│             ▲                            │
│             │ req.query.sortBy           │
│             │                            │
│  ┌──────────┴──────────┐                │
│  │  GET /api/posts     │                │
│  │  Chọn strategy      │                │
│  │  Áp dụng sortOptions│                │
│  └─────────────────────┘                │
│                                         │
│  Thêm strategy mới: chỉ thêm key        │
└─────────────────────────────────────────┘
```

#### 3.2.4. Ưu điểm

- **Giảm độ phức tạp**: Thay chuỗi if/else dài bằng map/object lookup
- **Dễ mở rộng**: Thêm chiến lược mới không động đến code cũ
- **Dễ đọc**: Ý đồ rõ ràng (chọn một thuật toán theo khóa)

---

### 3.3. Decorator Pattern

#### 3.3.1. Định nghĩa

**Decorator** cho phép thêm/bớt chức năng (behavior) vào object một cách linh hoạt, không cần sửa đổi class gốc (non-invasive). Decorator "bọc" object gốc và thêm logic trước/sau khi gọi method gốc.

#### 3.3.2. Triển khai trong dự án

##### **A. API Middleware Decorators (`client/js/api.js`)**

**Pipeline middleware**: Hook vào 3 điểm (`beforeRequest`, `afterResponse`, `onError`) để thêm chức năng chéo (logging, retry, cache, auth...).

```javascript
class ApiService {
  static middlewares = [];

  static use(mw) {
    if (mw && (mw.beforeRequest || mw.afterResponse || mw.onError)) {
      this.middlewares.push(mw);
    }
  }

  static async request(endpoint, options = {}) {
    let url = API_CONFIG.BASE_URL + endpoint;
    let config = { headers: { ...AuthManager.getAuthHeaders() }, ...options };

    // ─── beforeRequest hook (Decorator) ───
    for (const mw of this.middlewares) {
      if (typeof mw.beforeRequest === "function") {
        const out = await mw.beforeRequest(url, config);
        if (out && (out.url || out.config)) {
          url = out.url || url;
          config = out.config || config;
        }
      }
    }

    // ─── Fetch ───
    let response;
    try {
      response = await fetch(url, config);
    } catch (fetchError) {
      // ─── onError hook (Decorator) ───
      for (const mw of this.middlewares) {
        if (typeof mw.onError === "function") {
          const out = await mw.onError(fetchError, url, config);
          if (out && out.response) {
            response = out.response;
            break;
          }
        }
      }
      if (!response) throw fetchError;
    }

    // ─── afterResponse hook (Decorator) ───
    for (const mw of this.middlewares) {
      if (typeof mw.afterResponse === "function") {
        response = (await mw.afterResponse(response, url, config)) || response;
      }
    }

    return response;
  }
}

// ─── TimingLogger Decorator ───
function TimingLogger() {
  return {
    beforeRequest(url, config) {
      if (window.DEBUG_API) console.log("⏱️ API Start:", url);
      return { url, config };
    },
    afterResponse(res, url) {
      if (window.DEBUG_API) console.log("⏱️ API End:", url);
      return res;
    },
  };
}

// ─── Retry Decorator (built-in trong request()) ───
// Tự động retry khi gặp lỗi 429/502/503/504 hoặc network error
```

**Cách sử dụng**:

```javascript
// Bật debug timing
window.DEBUG_API = true;

// Register TimingLogger decorator
ApiService.use(TimingLogger());

// Gọi API
const data = await ApiService.get('/posts?sortBy=newest');
// Console log: ⏱️ API Start: http://localhost:8080/api/posts?sortBy=newest
// Console log: ⏱️ API End: http://localhost:8080/api/posts?sortBy=newest
```

**Retry logic**:

```javascript
static async request(endpoint, options = {}) {
  const maxRetries = options.retries || 2;
  const retryOnCodes = options.retryOn || [429, 502, 503, 504];
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, config);
      if (response.ok || !retryOnCodes.includes(response.status)) {
        return response; // Success hoặc lỗi không retry
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
    }

    if (attempt < maxRetries) {
      const backoff = (options.backoffMs || 300) * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }

  throw lastError;
}
```

##### **B. Product & User Decorators (`client/js/decorators.js`)**

**Product Decorators**: Thêm chức năng hiển thị (giá giảm, badge, khung nổi bật) dựa trên `tags` mà không sửa code gốc của product object.

```javascript
const ProductDecorators = {
  // Đọc % giảm từ tags (ví dụ: "discount-20" => 20%)
  getDiscountPercent(post) {
    const list = normalizeTags(post && post.tags);
    const found = list.find(t => /^discount-(\d{1,2})$/.test(t));
    if (!found) return 0;
    const m = found.match(/^discount-(\d{1,2})$/);
    return Math.max(1, Math.min(90, parseInt(m[1], 10)));
  },

  // Kiểm tra nổi bật
  isHighlighted(post) {
    const list = normalizeTags(post && post.tags);
    return list.includes('highlight') || list.includes('sponsored') || list.includes('featured');
  },

  // Kiểm tra đã xác minh
  isVerified(post) {
    return post && post.trangThai === 'approved';
  },

  // Decorator: tính giá sau giảm và hiển thị (gạch ngang giá cũ)
  applyPrice(post, basePriceHtml) {
    if (!post || post.loaiGia !== 'ban') return `<h5 class="text-primary mb-0">${basePriceHtml}</h5>`;
    const percent = ProductDecorators.getDiscountPercent(post);
    if (!percent || !post.gia || post.gia <= 0) {
      return `<h5 class="text-primary mb-0">${basePriceHtml}</h5>`;
    }
    const discounted = Math.round(post.gia * (100 - percent) / 100);
    const fmt = (window.Utils && Utils.formatCurrency) ? Utils.formatCurrency : (n) => n.toLocaleString('vi-VN') + " ₫";
    const newPrice = `<h5 class="text-danger mb-0">${fmt(discounted)}</h5>`;
    const oldPrice = `<h6 class="text-muted ml-2"><del>${fmt(post.gia)}</del></h6>`;
    return `${newPrice}${oldPrice}`;
  },

  // Decorator: render badges (giảm giá, nổi bật, đã xác minh)
  renderBadges(post) {
    const badges = [];
    const p = ProductDecorators.getDiscountPercent(post);
    if (p) badges.push(`<span class="badge badge-danger ml-1">-${p}%</span>`);
    if (ProductDecorators.isHighlighted(post)) badges.push(`<span class="badge badge-warning ml-1">Nổi bật</span>`);
    if (ProductDecorators.isVerified(post)) badges.push(`<span class="badge badge-success ml-1">Đã xác minh</span>`);
    return badges.join(' ');
  }
};
```

**User Decorators**: Badge uy tín, người bán, đã xác minh người bán.

```javascript
const UserDecorators = {
  getReputationLevel(diemUyTin) {
    const score = Number(diemUyTin || 0);
    if (score >= 4.5) return { label: 'Legend', cls: 'warning' };
    if (score >= 3.5) return { label: 'Pro', cls: 'primary' };
    if (score >= 2.5) return { label: 'Trusted', cls: 'info' };
    return { label: 'Newbie', cls: 'secondary' };
  },

  isSeller(totalPosts) {
    return Number(totalPosts || 0) > 0;
  },

  renderBadges(user, stats) {
    const badges = [];
    const rep = UserDecorators.getReputationLevel(user && user.diemUyTin);
    badges.push(`<span class="badge badge-${rep.cls} mr-1">${rep.label}</span>`);
    const total = stats && stats.totalPosts;
    if (user && user.daXacMinhNguoiBan) {
      badges.push(`<span class="badge badge-success">Đã xác minh người bán</span>`);
    } else if (UserDecorators.isSeller(total)) {
      badges.push(`<span class="badge badge-info">Người bán</span>`);
    }
    return badges.join(' ');
  }
};
```

**Cách sử dụng (trong `client/js/index.js` hoặc `client/js/shop.js`)**:

```javascript
function createProductCard(product) {
  // Base price (chưa decorator)
  const basePrice = Formatters.getPriceLabel(product.loaiGia, product.gia);

  // Decorator: áp dụng giá giảm
  const priceBlock = ProductDecorators.applyPrice(product, basePrice);

  // Decorator: render badges
  const productBadges = ProductDecorators.renderBadges(product);

  // Decorator: kiểm tra nổi bật để thêm class CSS
  const highlightClass = ProductDecorators.isHighlighted(product) ? ' product-highlight' : '';

  return `
    <div class="product-item bg-light mb-4${highlightClass}">
      <div class="product-img position-relative overflow-hidden">
        <img class="img-fluid w-100" src="${imageUrl}" alt="${product.tieuDe}">
      </div>
      <div class="text-center py-4">
        <a class="h6 text-decoration-none text-truncate d-block" href="detail.html?id=${product._id}">
          ${Utils.truncateText(product.tieuDe, 50)}
        </a>
        <div class="d-flex align-items-center justify-content-center mt-2">
          ${priceBlock}
        </div>
        <div class="mt-2">
          <span class="badge badge-${Formatters.getConditionBadgeClass(product.tinhTrang)}">
            ${Formatters.getConditionText(product.tinhTrang)}
          </span>
          ${productBadges}
        </div>
      </div>
    </div>
  `;
}
```

**CSS hỗ trợ (`.product-highlight` trong `client/css/style.css`)**:

```css
.product-highlight {
  box-shadow: 0 0 10px rgba(255, 193, 7, 0.7) !important;
  position: relative;
}

.product-highlight::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 60px 60px 0;
  border-color: transparent #ffc107 transparent transparent;
}
```

#### 3.3.3. Biểu đồ minh họa

```
┌────────────────────────────────────────────────────────────┐
│            Decorator Pattern (API Middleware)              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │  ApiService.request(endpoint, options)            │    │
│  └────────────────┬──────────────────────────────────┘    │
│                   │                                        │
│       ┌───────────▼──────────────┐                         │
│       │  beforeRequest hook      │◄─── TimingLogger       │
│       │  (Decorators)            │◄─── AuthDecorator      │
│       └───────────┬──────────────┘     (future)           │
│                   │                                        │
│       ┌───────────▼──────────────┐                         │
│       │  fetch(url, config)      │                         │
│       └───────────┬──────────────┘                         │
│                   │                                        │
│       ┌───────────▼──────────────┐                         │
│       │  afterResponse hook      │◄─── TimingLogger       │
│       │  (Decorators)            │◄─── CacheDecorator     │
│       └───────────┬──────────────┘     (future)           │
│                   │                                        │
│       ┌───────────▼──────────────┐                         │
│       │  onError hook            │◄─── RetryDecorator     │
│       │  (Decorators)            │                         │
│       └───────────┬──────────────┘                         │
│                   │                                        │
│       ┌───────────▼──────────────┐                         │
│       │  return response         │                         │
│       └──────────────────────────┘                         │
│                                                            │
│  Thêm middleware mới: ApiService.use(newDecorator())      │
└────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────┐
│          Decorator Pattern (Product Decorators)            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │  Product Object (from API)                        │    │
│  │  { _id, tieuDe, gia, loaiGia, tags, trangThai }  │    │
│  └────────────────┬──────────────────────────────────┘    │
│                   │                                        │
│       ┌───────────▼──────────────┐                         │
│       │  ProductDecorators       │                         │
│       │  ─────────────────       │                         │
│       │  getDiscountPercent()    │◄─ Đọc tags discount-XX │
│       │  isHighlighted()         │◄─ Đọc tags highlight   │
│       │  isVerified()            │◄─ Kiểm tra trangThai   │
│       │  applyPrice()            │◄─ Tính giá sau giảm    │
│       │  renderBadges()          │◄─ Hiển thị badges      │
│       └───────────┬──────────────┘                         │
│                   │                                        │
│       ┌───────────▼──────────────┐                         │
│       │  Enhanced Product UI     │                         │
│       │  (giá giảm, badge,       │                         │
│       │   khung nổi bật)         │                         │
│       └──────────────────────────┘                         │
│                                                            │
│  Không sửa Product object gốc, chỉ thêm logic hiển thị    │
└────────────────────────────────────────────────────────────┘
```

#### 3.3.4. Ưu điểm

- **Non-invasive**: Không sửa code gốc (Product object, fetch method), chỉ "bọc" thêm logic
- **Linh hoạt**: Bật/tắt decorator (ví dụ: `window.DEBUG_API = true` để bật TimingLogger)
- **Tái sử dụng**: Decorator có thể dùng cho nhiều context (logging cho tất cả API call, badge cho tất cả product)
- **Dễ mở rộng**: Thêm decorator mới (ví dụ: `CacheDecorator`) không cần sửa code gọi API

---

## 4. TÍCH HỢP REALTIME UPDATE VỚI SOCKET.IO

### 4.1. Bối cảnh

Khi Admin cập nhật Giảm giá/Nổi bật cho bài đăng (qua `PUT /api/posts/:id` với `tags`), trang danh sách sản phẩm (index.html, shop.html) cần **tự động cập nhật** mà không cần F5.

### 4.2. Triển khai

#### **Server-side: Phát sự kiện `post_updated` (`server/src/routes/posts.js`)**

```javascript
router.put("/:id", authenticateToken, async (req, res) => {
  // ...
  const updated = await Post.findByIdAndUpdate(id, updateData, { new: true });

  // Phát sự kiện realtime (Decorator: thêm chức năng broadcast mà không sửa logic cập nhật)
  const io = req.app.get("io");
  if (io) {
    io.emit("post_updated", {
      id: updated._id,
      tags: updated.tags,
      tieuDe: updated.tieuDe,
      trangThai: updated.trangThai,
    });
  }

  res.json({ success: true, data: updated });
});
```

#### **Client-side: Lắng nghe `post_updated` (`client/js/socket.js`)**

```javascript
// socket.js: quản lý Socket.IO client (Singleton)
(function() {
  const token = (window.AuthManager && AuthManager.getToken()) || null;
  if (!token) return;

  const socket = io({ auth: { token } });

  socket.on("connect", () => console.log("✅ Socket.IO connected"));

  // Lắng nghe sự kiện post_updated từ server
  socket.on("post_updated", (data) => {
    console.log("🔄 Post updated:", data);
    // Phát CustomEvent để các trang page-level xử lý (Strategy: tách logic update)
    window.dispatchEvent(new CustomEvent("post:updated", { detail: data }));
  });

  window.socketManager = { socket };
})();
```

#### **Client-side: Tự động refresh trang (`client/js/index.js`, `client/js/shop.js`)**

```javascript
// index.js: lắng nghe CustomEvent và tự reload (Decorator: thêm chức năng realtime)
let debounceTimer;
window.addEventListener('post:updated', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    loadFeaturedProducts();
    loadRecentProducts();
  }, 300); // Debounce 300ms để tránh reload nhiều lần
});
```

```javascript
// shop.js: tương tự
let debounceTimer;
window.addEventListener('post:updated', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    loadPosts();
  }, 300);
});
```

### 4.3. Biểu đồ luồng Realtime Update

```
┌─────────────────────────────────────────────────────────────────┐
│                   Realtime Update Flow                          │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │   Admin UI   │
  │ (posts.html) │
  └──────┬───────┘
         │ 1. Admin nhập giảm giá 20%, tick "Nổi bật", nhấn "Lưu"
         │
         ▼
  ┌────────────────────────────────────────────────────┐
  │  PUT /api/posts/:id { tags: ['discount-20', ...] }│
  └──────┬─────────────────────────────────────────────┘
         │ 2. Server cập nhật DB
         │
         ▼
  ┌──────────────────────────────────────────────────┐
  │  io.emit('post_updated', { id, tags, ... })     │
  └──────┬───────────────────────────────────────────┘
         │ 3. Broadcast tới tất cả client đang connect
         │
         ├──────────────────┬──────────────────┐
         ▼                  ▼                  ▼
  ┌─────────────┐    ┌─────────────┐   ┌──────────────┐
  │  Client A   │    │  Client B   │   │  Client C    │
  │ (index.html)│    │ (shop.html) │   │ (detail.html)│
  └──────┬──────┘    └──────┬──────┘   └───────┬──────┘
         │                  │                  │
         │ socket.on('post_updated')           │
         │                  │                  │
         ▼                  ▼                  ▼
  window.dispatchEvent(new CustomEvent('post:updated'))
         │                  │                  │
         ▼                  ▼                  ▼
  Debounce 300ms → loadFeaturedProducts() / loadPosts() / reload detail
         │                  │                  │
         ▼                  ▼                  ▼
  ┌─────────────────────────────────────────────────┐
  │  UI tự động cập nhật: badge, giá giảm, khung    │
  │  nổi bật (qua ProductDecorators)                │
  └─────────────────────────────────────────────────┘
```

### 4.4. Lợi ích

- **UX mượt mà**: Người dùng thấy thay đổi ngay lập tức mà không cần F5
- **Giảm tải server**: Không cần polling liên tục
- **Tách biệt logic**: Socket.IO chỉ phát event, các trang tự quyết định cách reload (Strategy)

---

## 5. LỢI ÍCH VÀ KẾT QUẢ ĐẠT ĐƯỢC

### 5.1. Code sạch và dễ bảo trì

- **Singleton** giúp tập trung quản lý token, user, cấu hình → không bị rải rác nhiều file
- **Strategy** giúp tách biệt thuật toán (sort, format) → thêm mới không ảnh hưởng code cũ
- **Decorator** giúp thêm chức năng chéo (logging, retry, badge) → code gọi API không thay đổi

### 5.2. Linh hoạt và mở rộng

- **Thêm sort mới**: Chỉ cần thêm một key vào `sortStrategies` (ví dụ: `rating_desc`)
- **Thêm middleware mới**: `ApiService.use(newDecorator())` (ví dụ: `CacheDecorator`)
- **Thêm badge mới**: Bổ sung logic vào `ProductDecorators.renderBadges()` mà không sửa code render sản phẩm

### 5.3. UX cải thiện

- **Giá giảm, badge, nổi bật**: Decorators tự động hiển thị dựa trên tags → người dùng dễ nhận diện sản phẩm khuyến mãi
- **Realtime update**: Admin cập nhật → trang danh sách tự refresh → không cần hướng dẫn người dùng F5
- **Hiển thị nhất quán**: Formatters đồng bộ cách hiển thị giá/tình trạng/địa điểm toàn site

### 5.4. Tái sử dụng code

- **Formatters**: Dùng chung cho index.js, shop.js, detail.js, my-posts.js
- **Decorators**: ProductDecorators dùng cho tất cả nơi hiển thị sản phẩm
- **ApiService**: Tất cả module đều dùng `ApiService.get/post/put/delete` → retry/timing/auth tự động áp dụng

### 5.5. Số liệu cụ thể

| Chỉ số | Trước khi áp dụng Patterns | Sau khi áp dụng Patterns |
|--------|----------------------------|--------------------------|
| Số dòng code if/else cho sort | ~30 dòng | ~5 dòng (map) |
| Số lần lặp logic hiển thị giá | ~10 nơi | 1 nơi (Formatters) |
| Số lần retry API thủ công | 0 (không có) | Tự động (RetryDecorator) |
| Thời gian thêm sort mới | ~10 phút (sửa nhiều chỗ) | ~1 phút (thêm key) |
| Thời gian user thấy cập nhật | Phải F5 (~5s) | Realtime (~0.3s) |

---

## 6. HƯỚNG MỞ RỘNG VÀ CẢI TIẾN

### 6.1. Auth refresh đúng chuẩn

**Vấn đề hiện tại**: Endpoint `/api/auth/refresh` yêu cầu token hợp lệ (đã xác thực), nên không thể tự làm mới khi 401 do token hết hạn.

**Đề xuất**:

- **Backend**: Thêm cơ chế refresh token an toàn:
  - Lưu refresh token vào HTTP-only cookie hoặc collection `RefreshToken` (có thể thu hồi)
  - Endpoint `/auth/refresh` không yêu cầu access token, chỉ cần refresh token hợp lệ
  - Trả về cặp `{ accessToken, refreshToken }` mới
- **Client**: Thêm `AuthRefreshMiddleware` (Decorator):
  ```javascript
  function AuthRefreshMiddleware() {
    return {
      async onError(error, url, config) {
        if (error.status === 401 && !url.includes('/auth/refresh')) {
          // Thử refresh 1 lần
          const refreshed = await ApiService.post('/auth/refresh');
          if (refreshed.success) {
            AuthManager.setToken(refreshed.data.accessToken);
            // Retry request ban đầu với token mới
            const retryResponse = await fetch(url, {
              ...config,
              headers: { ...config.headers, Authorization: `Bearer ${refreshed.data.accessToken}` }
            });
            return { response: retryResponse };
          } else {
            AuthManager.logout();
          }
        }
      }
    };
  }

  ApiService.use(AuthRefreshMiddleware());
  ```

### 6.2. Cache Decorator

**Mục đích**: Cache response API (categories, user profile) để giảm tải server và tăng tốc độ.

**Triển khai**:

```javascript
function CacheDecorator(options = {}) {
  const cache = new Map();
  const ttl = options.ttl || 60000; // 60s

  return {
    async beforeRequest(url, config) {
      if (config.method && config.method.toUpperCase() !== 'GET') return;
      const key = url;
      const cached = cache.get(key);
      if (cached && (Date.now() - cached.timestamp < ttl)) {
        console.log("📦 Cache hit:", url);
        return { response: cached.response }; // Skip fetch
      }
    },
    async afterResponse(response, url, config) {
      if (config.method && config.method.toUpperCase() === 'GET') {
        const key = url;
        cache.set(key, { response: response.clone(), timestamp: Date.now() });
      }
      return response;
    }
  };
}

ApiService.use(CacheDecorator({ ttl: 60000 }));
```

### 6.3. Đồng bộ hiển thị toàn site

**Hiện tại**: `Formatters` và `Decorators` đã tích hợp tại index.js, shop.js, profile.js.

**Đề xuất**: Áp dụng cho các trang còn lại:

- `detail.js`: Dùng `ProductDecorators.applyPrice()` cho sản phẩm liên quan
- `my-posts.js`: Dùng `ProductDecorators.renderBadges()` để hiển thị badge cho bài đăng của mình
- `checkout.js`: Dùng `Formatters.getPriceLabel()` để hiển thị giá sản phẩm trong giỏ hàng

### 6.4. Singleton cho DB connection

**Hiện tại**: Mongoose connection khởi tạo trực tiếp trong `server/src/index.js`.

**Đề xuất**: Tách thành module riêng `server/src/db.js`:

```javascript
// server/src/db.js
const mongoose = require('mongoose');

let connection = null;

async function getConnection() {
  if (connection) return connection;
  connection = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ MongoDB connected");
  return connection;
}

module.exports = { getConnection };
```

**Lợi ích**:

- Làm rõ vai trò Singleton của DB connection
- Dễ test (mock `getConnection()`)
- Dễ tái sử dụng (các script seed/migration chỉ cần gọi `getConnection()`)

### 6.5. Admin cấu hình tags linh hoạt hơn

**Hiện tại**: Admin chỉ chỉnh được giảm giá (0–90%, step 5) và nổi bật (checkbox).

**Đề xuất**: Thêm UI chỉnh tags tự do (text input hoặc tag editor) để Admin có thể thêm các tag tuỳ chỉnh (ví dụ: `hot-deal`, `limited-time`, `exclusive`).

---

## 7. KẾT LUẬN

### 7.1. Tổng kết

Dự án **Website Trao Đổi Đồ Cũ** đã triển khai thành công **ba Design Patterns chính**:

1. **Singleton**: Quản lý trạng thái dùng chung (AuthManager, ApiService, Express app, Mongoose connection)
2. **Strategy**: Chọn thuật toán theo khóa (sort, formatters hiển thị)
3. **Decorator**: Thêm chức năng chéo (logging, retry, badge, giá giảm, realtime update) không xâm lấn code gốc

### 7.2. Kết quả đạt được

- **Code sạch, dễ đọc**: Tách biệt trách nhiệm, giảm độ phức tạp
- **Dễ mở rộng**: Thêm sort/middleware/decorator mới không ảnh hưởng code cũ
- **UX cải thiện**: Realtime update, giá giảm/badge/nổi bật tự động hiển thị
- **Tái sử dụng code**: Formatters/Decorators/ApiService dùng chung toàn site

### 7.3. Bài học kinh nghiệm

- **Chọn pattern phù hợp**: Không nên áp dụng mù quáng, cần phân tích vấn đề cụ thể (ví dụ: sort nhiều cách → Strategy, thêm chức năng chéo → Decorator)
- **Balance giữa linh hoạt và đơn giản**: Decorator rất mạnh nhưng có thể gây khó debug nếu quá nhiều middleware, nên đặt tên rõ ràng và log đầy đủ
- **Tài liệu hóa**: File `PATTERNS.md` và `DESIGN_PATTERNS_REPORT.md` giúp đội ngũ hiểu kiến trúc và dễ onboard

### 7.4. Hướng phát triển tiếp theo

- **Auth refresh đúng chuẩn**: Tự động làm mới token khi hết hạn
- **Cache Decorator**: Giảm tải server, tăng tốc độ load
- **Singleton cho DB**: Tách module riêng, dễ test và tái sử dụng
- **Admin UI mở rộng**: Chỉnh tags tự do, thêm nhiều tính năng quản lý hơn

### 7.5. Lời kết

Design Patterns không phải là "viên đạn bạc" giải quyết mọi vấn đề, nhưng khi áp dụng đúng lúc, đúng chỗ, chúng giúp code **dễ đọc, dễ bảo trì và dễ mở rộng**. Dự án này là minh chứng cho việc Singleton/Strategy/Decorator có thể mang lại giá trị thực tế trong một ứng dụng web full-stack.

---

**Người viết**: GitHub Copilot  
**Ngày**: 2025-01-29  
**Phiên bản**: 1.0

---

## PHỤ LỤC

### A. Danh sách file liên quan

| File | Mô tả | Pattern |
|------|-------|---------|
| `client/js/api.js` | AuthManager, ApiService, Utils | Singleton, Decorator (middleware) |
| `client/js/formatters.js` | Strategy hiển thị giá/tình trạng | Strategy |
| `client/js/decorators.js` | ProductDecorators, UserDecorators | Decorator (UI) |
| `client/js/socket.js` | Socket.IO client manager | Singleton |
| `client/js/index.js` | Trang chủ, lắng nghe realtime | Decorator (realtime) |
| `client/js/shop.js` | Trang danh sách sản phẩm | Decorator (realtime) |
| `client/js/admin-posts.js` | UI quản trị bài đăng | Strategy (formatters) |
| `client/css/style.css` | CSS `.product-highlight` | Decorator (UI) |
| `server/src/index.js` | Express app, Socket.IO, Mongoose | Singleton |
| `server/src/routes/posts.js` | API CRUD bài đăng, sort strategies | Strategy, Decorator (emit event) |
| `docs/PATTERNS.md` | Tài liệu patterns ngắn gọn | - |
| `docs/DESIGN_PATTERNS_REPORT.md` | Báo cáo chi tiết (file này) | - |

### B. Tham khảo thêm

- [Refactoring Guru - Design Patterns](https://refactoring.guru/design-patterns)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Bootstrap 4 Documentation](https://getbootstrap.com/docs/4.6/)

---

**Hết báo cáo.**
