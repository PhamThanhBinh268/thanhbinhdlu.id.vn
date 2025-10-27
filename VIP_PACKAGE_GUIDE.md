# Tính Năng VIP Package - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Tính năng VIP Package cho phép người dùng nâng cấp tài khoản để nhận nhiều ưu đãi hơn khi đăng tin.

## 🎯 Các Gói VIP

### 1. **BASIC** - 470.000đ/tháng
- ✅ 20 tin đăng mỗi tháng
- ✅ Hiển thị 30 ngày
- ✅ Tối đa 8 ảnh/tin
- ✅ Badge Basic đặc biệt
- ✅ Hỗ trợ qua email

### 2. **PROFESSIONAL** - 790.000đ/tháng (Phổ biến nhất)
- ✅ 50 tin đăng mỗi tháng
- ✅ Hiển thị 45 ngày
- ✅ Tối đa 12 ảnh/tin
- ✅ Badge Professional đặc biệt
- ✅ Ưu tiên hiển thị
- ✅ Hỗ trợ ưu tiên 12h
- ✅ Phân tích thống kê chi tiết
- ✅ Duyệt tin trong 12h

### 3. **VIP** - 2.200.000đ/tháng
- ✅ 60 tin đăng mỗi tháng
- ✅ Hiển thị 60 ngày
- ✅ Tối đa 15 ảnh/tin
- ✅ Badge VIP vàng đặc biệt
- ✅ Ưu tiên hiển thị cao nhất
- ✅ Hỗ trợ ưu tiên 24/7
- ✅ Phân tích chuyên sâu
- ✅ Duyệt tin ngay lập tức
- ✅ Tư vấn chiến lược bán hàng
- ✅ Không giới hạn tính năng

## 🏗️ Kiến Trúc & Design Patterns

### 1. **Singleton Pattern** - VipPackageManager
```javascript
// Đảm bảo chỉ có 1 instance quản lý cấu hình VIP
const packageManager = VipPackageManager.getInstance();
```

**Lợi ích:**
- Tiết kiệm bộ nhớ
- Đảm bảo tính nhất quán của cấu hình
- Dễ dàng truy cập toàn cục

### 2. **Strategy Pattern** - VipStrategy
```javascript
// Các chiến lược khác nhau cho từng cấp độ VIP
class UserStrategy { ... }
class BasicStrategy { ... }
class ProfessionalStrategy { ... }
class VipStrategy { ... }

const context = new VipStrategyContext(subscription);
const features = context.getFeaturesList();
```

**Lợi ích:**
- Dễ dàng thêm gói VIP mới
- Logic rõ ràng cho từng cấp độ
- Tránh if-else phức tạp

### 3. **Decorator Pattern** - VipDecorator
```javascript
// Thêm tính năng cho user mà không thay đổi User model
const decoratedUser = VipDecoratorFactory.decorate(user, subscription);
const userInfo = decoratedUser.getUserInfo();
```

**Lợi ích:**
- Không cần thay đổi User model
- Tính năng được thêm động
- Dễ dàng mở rộng

## 📁 Cấu Trúc File

### Backend
```
server/
├── src/
│   ├── models/
│   │   ├── VipPackage.js          # Model gói VIP
│   │   ├── VipSubscription.js     # Model đăng ký VIP
│   │   └── User.js                # Cập nhật: vipStatus, vipExpiry
│   ├── routes/
│   │   └── vip-packages.js        # API routes VIP
│   └── utils/
│       ├── VipPackageManager.js   # SINGLETON
│       ├── VipStrategy.js         # STRATEGY
│       └── VipDecorator.js        # DECORATOR
└── init_vip_packages.js           # Script khởi tạo data
```

### Frontend
```
client/
├── vip-packages.html              # Trang VIP packages
└── js/
    ├── vip-packages.js            # Logic xử lý VIP
    └── api.js                     # API service (cập nhật)
```

## 🔌 API Endpoints

### 1. GET /api/vip-packages
Lấy danh sách tất cả gói VIP

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "basic",
      "displayName": "BASIC",
      "price": 470000,
      "postLimit": 20,
      ...
    }
  ]
}
```

### 2. GET /api/vip-packages/:name
Lấy chi tiết một gói VIP

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "professional",
    "displayName": "PROFESSIONAL",
    "features": [...],
    ...
  }
}
```

### 3. POST /api/vip-packages/subscribe
Đăng ký gói VIP (Requires authentication)

**Request:**
```json
{
  "packageName": "professional",
  "paymentMethod": "momo"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký gói VIP thành công",
  "data": {
    "user": "...",
    "packageName": "professional",
    "startDate": "2025-10-26",
    "endDate": "2025-11-25",
    ...
  }
}
```

### 4. GET /api/vip-packages/my-subscription
Lấy thông tin gói VIP hiện tại (Requires authentication)

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "packageName": "professional",
      "postsUsed": 5,
      "postsRemaining": 45,
      ...
    },
    "userInfo": {
      "badge": "PROFESSIONAL",
      "permissions": [...],
      ...
    },
    "features": {
      "postLimit": 50,
      "hasBadge": true,
      ...
    }
  }
}
```

### 5. POST /api/vip-packages/init
Khởi tạo dữ liệu gói VIP (Admin only - chỉ chạy 1 lần)

## 🚀 Hướng Dẫn Setup

### 1. Khởi tạo dữ liệu VIP packages
```bash
cd server
node init_vip_packages.js
```

### 2. Khởi động server
```bash
cd server
npm start
```

### 3. Truy cập trang VIP
Mở browser: `http://localhost:8080/vip-packages.html`

## 💡 Cách Sử Dụng

### Đăng Ký Gói VIP

1. **Đăng nhập** vào tài khoản
2. Truy cập **Gói VIP** từ menu hoặc icon 👑
3. Xem thông tin các gói và so sánh tính năng
4. Click **"Đăng Ký Ngay"** trên gói muốn chọn
5. Chọn **phương thức thanh toán**:
   - Momo
   - ZaloPay
   - Chuyển khoản ngân hàng
   - Tiền mặt
6. Xác nhận đăng ký
7. Gói VIP được kích hoạt ngay lập tức

### Xem Thông Tin Gói VIP Hiện Tại

- Truy cập trang **Gói VIP**
- Phần **"Gói VIP Của Bạn"** hiển thị:
  - Tên gói đang sử dụng
  - Ngày bắt đầu và hết hạn
  - Số tin đã đăng / còn lại
  - Tiến độ sử dụng

### Quản Lý Tin Đăng VIP

- Khi đăng tin mới, hệ thống tự động:
  - Trừ số lượng tin còn lại
  - Áp dụng các tính năng VIP (ưu tiên hiển thị, duyệt nhanh...)
  - Thêm badge VIP vào tin đăng

## 🎨 Tính Năng UI/UX

### ✨ Hiệu Ứng
- Hover animation trên card VIP
- Badge "Phổ biến nhất" cho gói PROFESSIONAL
- Gradient màu đẹp cho từng gói
- Progress bar hiển thị tiến độ sử dụng

### 📊 Bảng So Sánh
- So sánh chi tiết tính năng giữa các gói
- Dễ dàng đưa ra quyết định

### 🔔 Thông Báo
- SweetAlert2 cho các thông báo đẹp
- Loading spinner khi xử lý
- Confirm dialog trước khi đăng ký

## 🔐 Bảo Mật

- ✅ Requires authentication cho subscribe và my-subscription
- ✅ Validate packageName trên server
- ✅ Kiểm tra user đã có gói VIP active chưa
- ✅ JWT token protection

## 📈 Tối Ưu Hóa

### Performance
- ✅ Singleton giảm số lần khởi tạo
- ✅ Caching configuration
- ✅ Minimize database queries

### Code Quality
- ✅ Design Patterns rõ ràng
- ✅ Comments đầy đủ
- ✅ Error handling tốt
- ✅ Responsive design

### Scalability
- ✅ Dễ dàng thêm gói VIP mới
- ✅ Có thể customize features cho từng gói
- ✅ Tách biệt logic business

## 🐛 Xử Lý Lỗi

### User đã có VIP active
```json
{
  "success": false,
  "message": "Bạn đang có gói VIP đang hoạt động"
}
```

### Package không tồn tại
```json
{
  "success": false,
  "message": "Gói VIP không tồn tại"
}
```

### Chưa đăng nhập
```json
{
  "message": "Access token không được cung cấp",
  "code": "NO_TOKEN"
}
```

## 📝 TODO - Tính Năng Mở Rộng

- [ ] Tích hợp thanh toán online thực tế
- [ ] Email thông báo khi gói VIP sắp hết hạn
- [ ] Lịch sử đăng ký VIP
- [ ] Gia hạn tự động
- [ ] Thống kê hiệu quả gói VIP
- [ ] Admin dashboard quản lý VIP
- [ ] Voucher/Coupon giảm giá
- [ ] Trial package miễn phí 7 ngày

## 🎯 Kết Luận

Tính năng VIP Package đã được implement hoàn chỉnh với:
- ✅ 3 Design Patterns (Singleton, Strategy, Decorator)
- ✅ Backend API đầy đủ
- ✅ Frontend UI/UX đẹp mắt
- ✅ Code tối ưu và dễ bảo trì
- ✅ Tài liệu chi tiết

Hệ thống sẵn sàng sử dụng và có thể mở rộng dễ dàng!
