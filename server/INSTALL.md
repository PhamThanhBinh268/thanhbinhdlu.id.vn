# 📋 Hướng dẫn cài đặt và chạy Backend

## 🛠️ Yêu cầu hệ thống

- **Node.js**: >= 18.0.0
- **MongoDB**: Cài đặt local hoặc dùng MongoDB Atlas (cloud)
- **Git**: Để clone project

## 📦 Cài đặt

### 1. Clone repository

```powershell
git clone https://github.com/your-repo/website-trao-doi-do-cu.git
cd website-trao-doi-do-cu/server
```

### 2. Cài đặt dependencies

```powershell
npm install
```

### 3. Cấu hình môi trường

```powershell
# Copy file .env mẫu
copy .env.example .env
```

Chỉnh sửa file `.env`:

```ini
# Server
PORT=8080
NODE_ENV=development

# Database MongoDB
MONGODB_URI=mongodb://localhost:27017/oldmarket

# JWT Secret (đổi thành chuỗi phức tạp)
JWT_SECRET=your-super-secret-jwt-key-2024-oldmarket
JWT_EXPIRES_IN=7d

# CORS Origins (Frontend URLs)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Cloudinary (Đăng ký tại https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Cài đặt MongoDB

#### Option A: MongoDB Local

1. Tải MongoDB từ https://www.mongodb.com/try/download/community
2. Cài đặt theo hướng dẫn
3. Chạy MongoDB service
4. Database sẽ tự động tạo khi chạy app

#### Option B: MongoDB Atlas (Cloud - Khuyên dùng)

1. Truy cập https://www.mongodb.com/atlas
2. Tạo account và cluster miễn phí
3. Lấy connection string
4. Cập nhật `MONGODB_URI` trong `.env`

### 5. Cài đặt Cloudinary (Upload ảnh)

1. Truy cập https://cloudinary.com
2. Tạo account miễn phí
3. Vào Dashboard → Settings → API Keys
4. Copy thông tin vào file `.env`

## 🚀 Chạy ứng dụng

### Development

```powershell
# Chạy với nodemon (tự reload khi có thay đổi)
npm run dev
```

### Production

```powershell
# Chạy ở chế độ production
npm start
```

### Khởi tạo dữ liệu mẫu

```powershell
# Tạo dữ liệu demo (users, categories, posts...)
node src/scripts/seedData.js
```

## 🔍 Kiểm tra hoạt động

1. Mở trình duyệt vào: http://localhost:8080
2. Kết quả mong đợi:

```json
{
  "message": "🏪 API Website Trao Đổi & Mua Bán Đồ Cũ",
  "version": "1.0.0",
  "status": "running"
}
```

3. Test API với Postman/Thunder Client:
   - Đăng ký: `POST /api/auth/register`
   - Đăng nhập: `POST /api/auth/login`
   - Lấy bài đăng: `GET /api/posts`

## 🎯 Tài khoản demo (sau khi chạy seedData.js)

```
📧 Admin: admin@demo.com / 123456
📧 User 1: user1@demo.com / 123456
📧 User 2: user2@demo.com / 123456
📧 User 3: user3@demo.com / 123456
📧 User 4: user4@demo.com / 123456
📧 User 5: user5@demo.com / 123456
```

## 📁 Cấu trúc thư mục Backend

```
server/
├── src/
│   ├── models/          # MongoDB Schemas
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Category.js
│   │   ├── Message.js
│   │   ├── Transaction.js
│   │   └── Rating.js
│   ├── routes/          # API Routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── posts.js
│   │   ├── categories.js
│   │   ├── messages.js
│   │   ├── transactions.js
│   │   └── ratings.js
│   ├── middleware/      # Middleware functions
│   │   ├── auth.js
│   │   └── validation.js
│   ├── socket/          # WebSocket handlers
│   │   └── chatHandler.js
│   ├── scripts/         # Utility scripts
│   │   └── seedData.js
│   └── index.js         # Server entry point
├── package.json
├── .env.example
└── README.md
```

## 🐛 Troubleshooting

### Lỗi kết nối MongoDB

```
❌ Lỗi kết nối MongoDB: MongoNetworkError
```

**Giải pháp:**

- Kiểm tra MongoDB service có chạy không
- Kiểm tra `MONGODB_URI` trong file `.env`
- Nếu dùng Atlas, kiểm tra IP whitelist và password

### Lỗi CORS

```
Access to fetch at 'http://localhost:8080/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Giải pháp:**

- Thêm URL frontend vào `CORS_ORIGINS` trong `.env`
- Khởi động lại server

### Lỗi upload ảnh

```
❌ Image upload failed
```

**Giải pháp:**

- Kiểm tra thông tin Cloudinary trong `.env`
- Kiểm tra kích thước file (max 5MB)
- Chỉ chấp nhận file ảnh (jpg, png, gif, webp)

### Port đã được sử dụng

```
Error: listen EADDRINUSE: address already in use :::8080
```

**Giải pháp:**

- Đổi `PORT` trong file `.env`
- Hoặc kill process đang dùng port 8080:

```powershell
# Tìm process ID
netstat -ano | findstr :8080

# Kill process (thay <PID> bằng process ID)
taskkill /PID <PID> /F
```

## 🔧 Cấu hình nâng cao

### Environment Variables

```ini
# Logging
LOG_LEVEL=info

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# File upload
MAX_FILE_SIZE=5242880
MAX_FILES_COUNT=5

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### MongoDB Indexes

Backend tự động tạo indexes cần thiết khi start. Để xem indexes:

```javascript
// Trong MongoDB shell hoặc Compass
db.posts.getIndexes();
```

## 📖 Tài liệu tham khảo

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)

## 🆘 Cần hỗ trợ?

- Đọc API Documentation: `/docs/API.md`
- Kiểm tra logs server trong console
- Test API bằng Postman/Thunder Client
- Xem GitHub Issues cho các vấn đề phổ biến
