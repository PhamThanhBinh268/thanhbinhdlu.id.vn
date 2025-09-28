# Website Trao Đổi & Mua Bán Đồ Cũ

## 📌 Thông tin dự án

- **Tên đề tài:** Website trao đổi và mua bán đồ cũ
- **Nhóm sinh viên:** CTK46-PM
- **Giáo viên hướng dẫn:** Trần Thị Phương Linh

## 🎯 Mục tiêu

Xây dựng nền tảng web cho phép người dùng:

- Đăng tin rao bán/trao đổi đồ cũ
- Tìm kiếm và lọc sản phẩm
- Nhắn tin trực tiếp với người bán/mua
- Đánh giá độ uy tín sau giao dịch

## 🛠️ Công nghệ sử dụng

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas
- **Realtime Chat:** Socket.IO
- **Upload ảnh:** Cloudinary
- **Triển khai:** Netlify (FE) + Render (BE)

## 📂 Cấu trúc dự án

```
website-trao-doi-do-cu/
├── client/          # Frontend
├── server/          # Backend API
├── docs/           # Tài liệu thiết kế
└── README.md
```

## 🚀 Tiến độ thực hiện

- [x] Phân tích yêu cầu và thiết kế
- [x] Xây dựng Backend API
- [x] Phát triển Frontend
- [x] Tích hợp và kiểm thử
- [ ] Triển khai và báo cáo

## 🎯 Tình trạng hiện tại

### ✅ Đã hoàn thành:

- **Backend**: Hoàn thành 100%

  - 7 MongoDB models với đầy đủ relationships
  - 6 API route files với CRUD operations
  - JWT authentication system
  - Real-time chat với Socket.IO
  - File upload với Cloudinary integration
  - Database seeding scripts

- **Frontend**: Hoàn thành 95%
  - ✅ `login.html` - Tích hợp API đăng nhập
  - ✅ `signup.html` - Tích hợp API đăng ký
  - ✅ `index.html` - Trang chủ với sản phẩm nổi bật
  - ✅ `shop.html` - Danh sách sản phẩm với search & filter
  - ✅ `detail.html` - Chi tiết sản phẩm
  - ✅ `messages.html` - Chat real-time đầy đủ
  - ⏳ `contact.html` - Cần tích hợp API
  - ⏳ Trang quản lý profile người dùng

### 🔧 JavaScript Modules:

- ✅ `js/api.js` - Complete API service layer
- ✅ `js/socket.js` - Real-time chat functionality
- ✅ `js/shop.js` - Shop page with filters & pagination
- ✅ `js/detail.js` - Product detail functionality
- ✅ `js/messages.js` - Chat interface management
- ✅ `js/index.js` - Homepage dynamic content

### 🎨 Features hoàn thành:

- ✅ User authentication (login/register/logout)
- ✅ Product search & filtering
- ✅ Product detail views
- ✅ Real-time messaging system
- ✅ File upload (images)
- ✅ Save/bookmark products
- ✅ Responsive design
- ✅ Vietnamese localization
- ✅ Toast notifications
- ✅ Loading states & error handling

## 🚀 Để chạy dự án:

### Backend:

```bash
cd server
npm install
# Cấu hình .env với MongoDB URI và Cloudinary credentials
npm start
```

### Frontend:

```bash
cd client
# Mở index.html trong browser hoặc dùng Live Server
# Hoặc setup HTTP server: python -m http.server 3000
```

### Database:

```bash
# Seed dữ liệu mẫu
cd server
node src/scripts/seedData.js
```
