# VIP Package Feature - Design Patterns Implementation

## 📚 Tổng Quan

Chức năng VIP Package được xây dựng sử dụng 3 Design Patterns chính:
1. **Singleton Pattern** - VipPackageManager
2. **Strategy Pattern** - VipStrategy
3. **Decorator Pattern** - VipDecorator

---

## 1. SINGLETON PATTERN

### 📝 Mục đích
Đảm bảo chỉ có **MỘT instance duy nhất** của VipPackageManager trong toàn bộ ứng dụng, quản lý cấu hình gói VIP tập trung.

### 🏗️ Cấu trúc
```
VipPackageManager (Singleton)
├── getInstance() - Lấy instance duy nhất
├── getPackage(name) - Lấy 1 gói VIP
├── getAllPackages() - Lấy tất cả gói
└── isValidPackage(name) - Validate gói
```

### 📍 File: `server/src/utils/VipPackageManager.js`

### 💡 Cách hoạt động
```javascript
// Chỉ có 1 instance
const packageManager = VipPackageManager.getInstance();

// Tất cả nơi gọi đều dùng chung 1 instance
const manager1 = VipPackageManager.getInstance();
const manager2 = VipPackageManager.getInstance();
console.log(manager1 === manager2); // true
```

### ✅ Ưu điểm
- Tiết kiệm bộ nhớ (chỉ 1 instance)
- Quản lý cấu hình tập trung
- Dễ dàng thay đổi cấu hình ở 1 nơi
- Thread-safe trong Node.js

### 📦 Dữ liệu quản lý
```javascript
{
  basic: {
    name: "basic",
    displayName: "Gói Cơ Bản",
    price: 470000,
    postLimit: 20,
    ...
  },
  professional: { ... },
  vip: { ... }
}
```

---

## 2. STRATEGY PATTERN

### 📝 Mục đích
Định nghĩa **các chiến lược khác nhau** cho từng loại user/VIP, cho phép thay đổi behavior động.

### 🏗️ Cấu trúc
```
VipStrategyContext
├── UserStrategy (Base) - User thường
├── BasicStrategy - Gói Basic
├── ProfessionalStrategy - Gói Professional
└── VipStrategy - Gói VIP
```

### 📍 File: `server/src/utils/VipStrategy.js`

### 💡 Cách hoạt động
```javascript
// Chọn strategy dựa trên subscription
const strategy = new VipStrategyContext(subscription);

// Mỗi strategy có behavior khác nhau
strategy.getPostLimit();        // Basic: 20, Pro: 50, VIP: 60
strategy.hasFastApproval();     // Basic: false, VIP: true
strategy.getApprovalTime();     // Basic: "24h", VIP: "5 phút"
```

### ✅ Ưu điểm
- Tách logic của từng gói VIP
- Dễ thêm gói mới (Open/Closed Principle)
- Code sạch, dễ maintain
- Tránh if-else phức tạp

### 📊 So sánh Strategies

| Feature | UserStrategy | BasicStrategy | ProfessionalStrategy | VipStrategy |
|---------|--------------|---------------|---------------------|-------------|
| Post Limit | 5 | 20 | 50 | 60 |
| Duration | 7 ngày | 15 ngày | 15 ngày | 15 ngày |
| Max Images | 5 | 10 | 20 | 30 |
| Highlight | ❌ | ❌ | ✅ | ✅ |
| Badge | ❌ | ❌ | ✅ | ✅ |
| Fast Approval | ❌ | ❌ | ❌ | ✅ |
| Approval Time | 24h | <24h | <12h | <5 phút |

---

## 3. DECORATOR PATTERN

### 📝 Mục đích
**Thêm tính năng động** cho user object mà không thay đổi cấu trúc gốc.

### 🏗️ Cấu trúc
```
VipDecoratorFactory
├── BaseUser (Component) - User gốc
├── VipDecorator (Base Decorator)
    ├── BasicVipDecorator
    ├── ProfessionalVipDecorator
    └── VipPackageDecorator
```

### 📍 File: `server/src/utils/VipDecorator.js`

### 💡 Cách hoạt động
```javascript
// User gốc
const user = { id: 1, name: "John" };

// Decorate với VIP
const decoratedUser = VipDecoratorFactory.decorate(user, subscription);

// User đã được thêm tính năng
decoratedUser.getUserInfo(); 
// {
//   ...user,
//   vipStatus: "professional",
//   vipBadge: { type: "professional", label: "Chuyên Nghiệp", ... },
//   permissions: { postLimit: 50, hasHighlight: true, ... }
// }
```

### ✅ Ưu điểm
- Không thay đổi User model gốc
- Thêm tính năng linh hoạt
- Có thể stack nhiều decorators
- Tuân thủ Single Responsibility Principle

### 🎨 Badge System
```javascript
// Basic Badge
{ type: "basic", label: "Cơ Bản", color: "#28a745", icon: "fa-star" }

// Professional Badge
{ type: "professional", label: "Chuyên Nghiệp", color: "#fd7e14", icon: "fa-crown" }

// VIP Badge
{ type: "vip", label: "VIP", color: "#ffc107", icon: "fa-gem" }
```

---

## 🔄 Luồng Hoạt Động

### 1. User đăng ký VIP
```
POST /api/vip-packages/subscribe
  ↓
[SINGLETON] VipPackageManager.getPackage(name)
  ↓
Validate & Create VipSubscription
  ↓
Update User.vipStatus
```

### 2. User truy cập trang
```
GET /api/vip-packages/my-subscription
  ↓
Find VipSubscription
  ↓
[STRATEGY] VipStrategyContext(subscription)
  ↓
[DECORATOR] VipDecoratorFactory.decorate(user)
  ↓
Return decorated user + features
```

### 3. User tạo post
```
Create Post
  ↓
[STRATEGY] strategy.getPostLimit()
  ↓
[STRATEGY] strategy.getMaxImages()
  ↓
[DECORATOR] decoratedUser.getPermissions()
  ↓
Apply VIP features
```

---

## 📊 So Sánh 3 Patterns

| Pattern | Mục đích | Sử dụng khi | File |
|---------|----------|-------------|------|
| **Singleton** | 1 instance duy nhất | Quản lý config tập trung | VipPackageManager.js |
| **Strategy** | Nhiều behaviors khác nhau | Từng gói có logic riêng | VipStrategy.js |
| **Decorator** | Thêm tính năng động | Không muốn sửa User model | VipDecorator.js |

---

## 🎯 Kết Luận

### Tại sao dùng 3 patterns này?

**Singleton:**
- ✅ Config gói VIP cần consistency
- ✅ Tránh duplicate data
- ✅ Performance tốt

**Strategy:**
- ✅ Mỗi gói VIP có quy tắc riêng
- ✅ Dễ thêm gói mới
- ✅ Code clean, tách biệt

**Decorator:**
- ✅ User model không phình to
- ✅ Linh hoạt thêm features
- ✅ Dễ test từng decorator

### Design Principles được áp dụng
- ✅ Single Responsibility
- ✅ Open/Closed Principle
- ✅ Dependency Inversion
- ✅ Composition over Inheritance

---

## 🚀 API Endpoints

### 1. Lấy danh sách gói VIP
```http
GET /api/vip-packages
```

### 2. Lấy chi tiết gói
```http
GET /api/vip-packages/:name
```

### 3. Đăng ký VIP
```http
POST /api/vip-packages/subscribe
{
  "packageName": "professional",
  "paymentMethod": "momo"
}
```

### 4. Xem gói hiện tại
```http
GET /api/vip-packages/my-subscription
```

### 5. Khởi tạo data (Admin)
```http
POST /api/vip-packages/init
```

---

## 📝 Models

### VipPackage
```javascript
{
  name: String,              // "basic", "professional", "vip"
  displayName: String,       // "Gói Cơ Bản"
  description: String,
  price: Number,
  postLimit: Number,
  postDuration: Number,
  isActive: Boolean,
  displayOrder: Number,
  isBestSeller: Boolean
}
```

### VipSubscription
```javascript
{
  user: ObjectId,
  packageName: String,
  startDate: Date,
  endDate: Date,
  status: String,           // "active", "expired", "cancelled"
  postLimit: Number,
  postsUsed: Number,
  postsRemaining: Number,
  price: Number,
  paymentMethod: String,
  paymentStatus: String
}
```

---

## 🔧 Cách mở rộng

### Thêm gói VIP mới:

1. **Singleton** - Thêm vào VipPackageManager:
```javascript
createPremiumPackage() {
  return {
    name: "premium",
    postLimit: 100,
    ...
  };
}
```

2. **Strategy** - Tạo PremiumStrategy:
```javascript
class PremiumStrategy extends UserStrategy {
  getPostLimit() { return 100; }
  ...
}
```

3. **Decorator** - Tạo PremiumVipDecorator:
```javascript
class PremiumVipDecorator extends VipDecorator {
  getDisplayBadge() {
    return { type: "premium", label: "Premium", ... };
  }
}
```

✅ **Không cần sửa code cũ!** (Open/Closed Principle)
