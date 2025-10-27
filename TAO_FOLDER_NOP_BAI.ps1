# =========================================================
# SCRIPT TỰ ĐỘNG TẠO CẤU TRÚC FOLDER NỘP BÀI ĐỒ ÁN
# =========================================================
# Chạy script này trong PowerShell với quyền Administrator
# Cách chạy: Right-click > "Run with PowerShell"
# =========================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TẠO FOLDER NỘP BÀI ĐỒ ÁN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────────────────
# BƯỚC 1: Thiết lập đường dẫn
# ─────────────────────────────────────────────────────────
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$submissionFolder = Join-Path (Split-Path -Parent $projectRoot) "MSSV_HoTen_WebsiteTraoDoiDoCu_NopBai"

Write-Host "📂 Thư mục dự án gốc: $projectRoot" -ForegroundColor Green
Write-Host "📂 Thư mục nộp bài sẽ tạo tại: $submissionFolder" -ForegroundColor Green
Write-Host ""

# Xác nhận trước khi tạo
$confirm = Read-Host "Tiếp tục tạo folder nộp bài? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "❌ Hủy bỏ!" -ForegroundColor Red
    exit
}

# ─────────────────────────────────────────────────────────
# BƯỚC 2: Tạo cấu trúc folder chính
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 2: Tạo cấu trúc folder..." -ForegroundColor Yellow

$folders = @(
    "$submissionFolder\1. Source",
    "$submissionFolder\2. Database",
    "$submissionFolder\2. Database\scripts",
    "$submissionFolder\3. Executable",
    "$submissionFolder\4. GitHub",
    "$submissionFolder\5. Doc"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  ✅ Đã tạo: $folder" -ForegroundColor Green
    }
}

# ─────────────────────────────────────────────────────────
# BƯỚC 3: Copy Source Code
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 3: Copy source code..." -ForegroundColor Yellow

# Copy client
Write-Host "  📋 Đang copy thư mục client..." -ForegroundColor Cyan
Copy-Item -Path "$projectRoot\client" -Destination "$submissionFolder\1. Source\client" -Recurse -Force
Write-Host "  ✅ Đã copy client" -ForegroundColor Green

# Copy server (loại trừ node_modules)
Write-Host "  📋 Đang copy thư mục server (loại trừ node_modules)..." -ForegroundColor Cyan
$serverDest = "$submissionFolder\1. Source\server"
New-Item -ItemType Directory -Path $serverDest -Force | Out-Null

Get-ChildItem -Path "$projectRoot\server" -Exclude "node_modules" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $serverDest -Recurse -Force
}
Write-Host "  ✅ Đã copy server" -ForegroundColor Green

# Copy docs
Write-Host "  📋 Đang copy thư mục docs..." -ForegroundColor Cyan
Copy-Item -Path "$projectRoot\docs" -Destination "$submissionFolder\1. Source\docs" -Recurse -Force
Write-Host "  ✅ Đã copy docs" -ForegroundColor Green

# Copy các file gốc (README, LICENSE, etc.)
Write-Host "  📋 Đang copy các file gốc..." -ForegroundColor Cyan
$rootFiles = @("README.md", "LICENSE", ".gitignore")
foreach ($file in $rootFiles) {
    $filePath = Join-Path $projectRoot $file
    if (Test-Path $filePath) {
        Copy-Item -Path $filePath -Destination "$submissionFolder\1. Source\" -Force
        Write-Host "  ✅ Đã copy $file" -ForegroundColor Green
    }
}

# Xóa file .env nếu có (bảo mật)
$envFile = "$submissionFolder\1. Source\server\.env"
if (Test-Path $envFile) {
    Remove-Item $envFile -Force
    Write-Host "  🔒 Đã xóa file .env (bảo mật)" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────────────────
# BƯỚC 4: Tạo file .env.example
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 4: Tạo file .env.example..." -ForegroundColor Yellow

$envExample = @"
# =====================================================
# CẤU HÌNH MÔI TRƯỜNG - WEBSITE TRAO ĐỔI ĐỒ CŨ
# =====================================================
# Hướng dẫn: Copy file này thành .env và điền thông tin thực tế

# ─── MongoDB ───
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/website-trao-doi-do-cu?retryWrites=true&w=majority

# ─── JWT Secret ───
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# ─── Server Port ───
PORT=8080

# ─── Cloudinary (Upload ảnh) ───
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ─── VNPay (Thanh toán) ───
VNPAY_TMN_CODE=your-tmn-code
VNPAY_HASH_SECRET=your-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:8080/api/vnpay/return

# ─── Email (SMTP) ───
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# ─── Client URL ───
CLIENT_URL=http://localhost:5500
"@

Set-Content -Path "$submissionFolder\1. Source\server\.env.example" -Value $envExample -Encoding UTF8
Write-Host "  ✅ Đã tạo .env.example" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# BƯỚC 5: Tạo Database folder
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 5: Tạo thư mục Database..." -ForegroundColor Yellow

# Tạo README.md cho Database
$dbReadme = @"
# DATABASE - WEBSITE TRAO ĐỔI ĐỒ CŨ

## 📋 Thông tin Database

- **Loại DB**: MongoDB (NoSQL)
- **Cloud Provider**: MongoDB Atlas
- **Tên Database**: website-trao-doi-do-cu

## 📦 Collections

1. **users** - Người dùng (admin, user)
2. **posts** - Bài đăng sản phẩm
3. **categories** - Danh mục sản phẩm
4. **messages** - Tin nhắn chat
5. **transactions** - Giao dịch mua bán
6. **savedposts** - Bài đăng đã lưu
7. **ratings** - Đánh giá sản phẩm
8. **vippackages** - Gói VIP
9. **vipsubscriptions** - Đăng ký VIP

## 🔧 Cách chạy

### 1. Tạo MongoDB Atlas account (miễn phí)
- Truy cập: https://www.mongodb.com/cloud/atlas
- Đăng ký tài khoản miễn phí
- Tạo Cluster mới (chọn Free Tier)
- Tạo Database User
- Whitelist IP: 0.0.0.0/0 (cho phép mọi IP)

### 2. Lấy Connection String
- Vào Cluster > Connect > Connect your application
- Copy connection string
- Paste vào file `.env` (biến ``MONGO_URI``)
- Thay ``<username>`` và ``<password>`` thành thông tin thực tế

### 3. Seed dữ liệu mẫu (optional)
``````bash
cd server
node seed_data.js
``````

## 📊 Schema

Xem chi tiết schema trong file: ``database_schema.txt``

## 🛠️ Scripts hỗ trợ

- ``scripts/seed_data.js`` - Tạo dữ liệu mẫu
- ``scripts/clear_data.js`` - Xóa toàn bộ dữ liệu
- ``scripts/check_users.js`` - Kiểm tra users
- ``scripts/reset_admin_password.js`` - Reset mật khẩu admin
"@

Set-Content -Path "$submissionFolder\2. Database\README.md" -Value $dbReadme -Encoding UTF8
Write-Host "  ✅ Đã tạo Database README.md" -ForegroundColor Green

# Copy database scripts
Write-Host "  📋 Đang copy database scripts..." -ForegroundColor Cyan
$dbScripts = @("seed_data.js", "clear_data.js", "check_users.js", "reset_admin_password.js", "check_admins.js")
foreach ($script in $dbScripts) {
    $scriptPath = Join-Path "$projectRoot\server" $script
    if (Test-Path $scriptPath) {
        Copy-Item -Path $scriptPath -Destination "$submissionFolder\2. Database\scripts\" -Force
        Write-Host "  ✅ Đã copy $script" -ForegroundColor Green
    }
}

# Tạo database_schema.txt
$dbSchema = @"
# DATABASE SCHEMA - WEBSITE TRAO ĐỔI ĐỒ CŨ

## 1. users (Người dùng)
{
  _id: ObjectId,
  hoTen: String,
  email: String (unique, required),
  matKhau: String (hashed, required),
  soDienThoai: String,
  diaChi: String,
  avatar: String (URL),
  vaiTro: String (enum: ['user', 'admin'], default: 'user'),
  trangThai: String (enum: ['active', 'banned'], default: 'active'),
  diemUyTin: Number (default: 0),
  vipStatus: String (enum: ['none', 'basic', 'professional', 'vip'], default: 'none'),
  vipExpiry: Date,
  daXacMinhNguoiBan: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}

## 2. posts (Bài đăng)
{
  _id: ObjectId,
  tieuDe: String (required),
  moTa: String (required),
  gia: Number (required),
  loaiGia: String (enum: ['ban', 'cho-mien-phi', 'trao-doi'], default: 'ban'),
  tinhTrang: String (enum: ['moi', 'nhu-moi', 'tot', 'kha', 'can-sua-chua'], required),
  danhMuc: ObjectId (ref: 'Category', required),
  hinhAnh: [String] (URLs),
  diaChi: String,
  nguoiDang: ObjectId (ref: 'User', required),
  trangThai: String (enum: ['pending', 'approved', 'rejected', 'sold'], default: 'pending'),
  lyDoTuChoi: String,
  luotXem: Number (default: 0),
  tags: [String],
  tinhNangDichVu: {
    noiBat: Boolean (default: false),
    ghimLenDau: Boolean (default: false)
  },
  createdAt: Date,
  updatedAt: Date
}

## 3. categories (Danh mục)
{
  _id: ObjectId,
  tenDanhMuc: String (unique, required),
  moTa: String,
  icon: String,
  soLuongBai: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}

## 4. messages (Tin nhắn)
{
  _id: ObjectId,
  nguoiGui: ObjectId (ref: 'User', required),
  nguoiNhan: ObjectId (ref: 'User', required),
  noiDung: String (required),
  loai: String (enum: ['text', 'image', 'system'], default: 'text'),
  daDoc: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}

## 5. transactions (Giao dịch)
{
  _id: ObjectId,
  baiDang: ObjectId (ref: 'Post', required),
  nguoiMua: ObjectId (ref: 'User', required),
  nguoiBan: ObjectId (ref: 'User', required),
  soTien: Number (required),
  trangThai: String (enum: ['pending', 'completed', 'cancelled'], default: 'pending'),
  phuongThucThanhToan: String (enum: ['cod', 'vnpay', 'momo'], default: 'cod'),
  diaChiGiaoHang: String,
  ghiChu: String,
  createdAt: Date,
  updatedAt: Date
}

## 6. savedposts (Bài đăng đã lưu)
{
  _id: ObjectId,
  nguoiDung: ObjectId (ref: 'User', required),
  baiDang: ObjectId (ref: 'Post', required),
  createdAt: Date
}

## 7. ratings (Đánh giá)
{
  _id: ObjectId,
  baiDang: ObjectId (ref: 'Post', required),
  nguoiDanhGia: ObjectId (ref: 'User', required),
  soSao: Number (min: 1, max: 5, required),
  nhanXet: String,
  createdAt: Date,
  updatedAt: Date
}

## 8. vippackages (Gói VIP)
{
  _id: ObjectId,
  ten: String (required),
  moTa: String,
  gia: Number (required),
  thoiGian: Number (số ngày, required),
  tinhNang: {
    postLimit: Number,
    ghimBai: Boolean,
    noiBat: Boolean,
    xemTruoc: Boolean,
    hoTro24h: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}

## 9. vipsubscriptions (Đăng ký VIP)
{
  _id: ObjectId,
  nguoiDung: ObjectId (ref: 'User', required),
  goiVip: ObjectId (ref: 'VipPackage', required),
  ngayBatDau: Date (required),
  ngayKetThuc: Date (required),
  trangThai: String (enum: ['active', 'expired', 'cancelled'], default: 'active'),
  soTienThanhToan: Number (required),
  phuongThucThanhToan: String,
  createdAt: Date,
  updatedAt: Date
}

## Indexes (Tối ưu hiệu suất)
- users: email (unique)
- posts: nguoiDang, danhMuc, trangThai, createdAt
- messages: nguoiGui, nguoiNhan, createdAt
- transactions: baiDang, nguoiMua, nguoiBan
- savedposts: nguoiDung, baiDang (compound unique)
- ratings: baiDang, nguoiDanhGia
"@

Set-Content -Path "$submissionFolder\2. Database\database_schema.txt" -Value $dbSchema -Encoding UTF8
Write-Host "  ✅ Đã tạo database_schema.txt" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# BƯỚC 6: Tạo Executable folder
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 6: Tạo thư mục Executable..." -ForegroundColor Yellow

# Tạo file chạy nhanh cho Windows
$startBat = @"
@echo off
echo ========================================
echo   WEBSITE TRAO DOI DO CU
echo   Starting Server...
echo ========================================
echo.

cd ..\1. Source\server

echo [1/3] Installing dependencies...
call npm install

echo.
echo [2/3] Starting server...
echo Server will run on http://localhost:8080
echo Press Ctrl+C to stop
echo.

call npm start

pause
"@

Set-Content -Path "$submissionFolder\3. Executable\START_SERVER.bat" -Value $startBat -Encoding ASCII
Write-Host "  ✅ Đã tạo START_SERVER.bat" -ForegroundColor Green

# Tạo file chạy cho Mac/Linux
$startSh = @"
#!/bin/bash

echo "========================================"
echo "  WEBSITE TRAO DOI DO CU"
echo "  Starting Server..."
echo "========================================"
echo ""

cd "../1. Source/server"

echo "[1/3] Installing dependencies..."
npm install

echo ""
echo "[2/3] Starting server..."
echo "Server will run on http://localhost:8080"
echo "Press Ctrl+C to stop"
echo ""

npm start
"@

Set-Content -Path "$submissionFolder\3. Executable\START_SERVER.sh" -Value $startSh -Encoding UTF8
Write-Host "  ✅ Đã tạo START_SERVER.sh" -ForegroundColor Green

# Tạo README cho Executable
$execReadme = @"
# HƯỚNG DẪN CHẠY WEBSITE

## ⚙️ Yêu cầu hệ thống

- **Node.js**: >= 16.x (Download: https://nodejs.org/)
- **npm**: >= 8.x (đi kèm Node.js)
- **MongoDB Atlas**: Tài khoản miễn phí (https://www.mongodb.com/cloud/atlas)
- **Browser**: Chrome, Firefox, Edge (khuyên dùng Chrome)

## 🚀 Cách chạy (Windows)

### Bước 1: Cài đặt Node.js
- Download Node.js từ: https://nodejs.org/
- Chọn phiên bản LTS (khuyến nghị)
- Chạy file cài đặt và làm theo hướng dẫn
- Kiểm tra cài đặt thành công:
  ``````
  node --version
  npm --version
  ``````

### Bước 2: Cấu hình MongoDB
- Mở file: ``../1. Source/server/.env.example``
- Copy thành ``.env``
- Điền thông tin MongoDB URI (xem hướng dẫn trong ``../2. Database/README.md``)

### Bước 3: Chạy server
- **Cách 1**: Double-click file ``START_SERVER.bat``
- **Cách 2**: Mở CMD tại thư mục này và chạy:
  ``````
  START_SERVER.bat
  ``````

### Bước 4: Mở website
- Đợi server khởi động (hiển thị "Server running on port 8080")
- Mở file: ``../1. Source/client/index.html`` bằng Live Server (VS Code)
- Hoặc mở trực tiếp trong browser

## 🐧 Cách chạy (Mac/Linux)

### Bước 1-2: Giống Windows

### Bước 3: Chạy server
``````bash
chmod +x START_SERVER.sh
./START_SERVER.sh
``````

## 🔑 Tài khoản test

### Admin
- Email: ``admin@example.com``
- Password: ``admin123``

### User
- Email: ``user@example.com``
- Password: ``user123``

## ❗ Lỗi thường gặp

### Lỗi 1: "node is not recognized"
- **Nguyên nhân**: Chưa cài Node.js hoặc chưa restart CMD/terminal
- **Giải pháp**: Cài Node.js và restart máy

### Lỗi 2: "Cannot connect to MongoDB"
- **Nguyên nhân**: File .env chưa cấu hình đúng
- **Giải pháp**: Kiểm tra lại MONGO_URI trong file .env

### Lỗi 3: "Port 8080 already in use"
- **Nguyên nhân**: Đã có ứng dụng khác chạy trên port 8080
- **Giải pháp**: 
  - Tắt ứng dụng đó
  - Hoặc đổi PORT trong file .env

### Lỗi 4: "npm ERR! code ENOENT"
- **Nguyên nhân**: Chưa có file package.json hoặc đường dẫn sai
- **Giải pháp**: Đảm bảo đang ở đúng thư mục ``server``

## 📞 Hỗ trợ

Nếu gặp lỗi khác, vui lòng:
1. Kiểm tra file log trong terminal
2. Google lỗi cụ thể
3. Liên hệ người phát triển
"@

Set-Content -Path "$submissionFolder\3. Executable\README.md" -Value $execReadme -Encoding UTF8
Write-Host "  ✅ Đã tạo Executable README.md" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# BƯỚC 7: Tạo GitHub folder
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 7: Tạo thư mục GitHub..." -ForegroundColor Yellow

$githubInfo = @"
# THÔNG TIN GITHUB DỰ ÁN

## 📦 Repository

- **Tên Repository**: cvinh-doanchuyennganh
- **Owner**: Ji-Eung
- **Branch**: master
- **URL**: https://github.com/Ji-Eung/cvinh-doanchuyennganh

## 📊 Thống kê

- **Tổng số commits**: [Cập nhật sau]
- **Contributors**: 1
- **Languages**: 
  - JavaScript: 60%
  - HTML: 25%
  - CSS: 10%
  - Other: 5%

## 🌿 Branches

- ``master`` - Branch chính (production)

## 📝 Commit History (Mẫu)

### Giai đoạn 1: Khởi tạo dự án
- ``[Init]`` Initial commit - Setup project structure
- ``[Backend]`` Setup Express server and MongoDB connection
- ``[Frontend]`` Create basic HTML templates

### Giai đoạn 2: Phát triển tính năng
- ``[Feature]`` Implement user authentication (login/register)
- ``[Feature]`` Add post CRUD operations
- ``[Feature]`` Implement chat realtime with Socket.IO
- ``[Feature]`` Add VIP package system

### Giai đoạn 3: Áp dụng Design Patterns
- ``[Pattern]`` Implement Singleton pattern for AuthManager
- ``[Pattern]`` Add Strategy pattern for sorting
- ``[Pattern]`` Implement Decorator pattern for API middleware
- ``[Pattern]`` Add ProductDecorators for UI enhancements

### Giai đoạn 4: Hoàn thiện
- ``[UI]`` Improve responsive design
- ``[Fix]`` Fix bugs and optimize performance
- ``[Docs]`` Add comprehensive documentation
- ``[Test]`` Add test cases

## 🔗 Clone & Setup

``````bash
# Clone repository
git clone https://github.com/Ji-Eung/cvinh-doanchuyennganh.git

# Install dependencies
cd cvinh-doanchuyennganh/server
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run server
npm start
``````

## 📄 License

[Ghi rõ loại license nếu có]

## 👤 Author

- **Họ tên**: [Điền tên sinh viên]
- **MSSV**: [Điền MSSV]
- **Email**: [Điền email]
- **GitHub**: https://github.com/Ji-Eung

## 📅 Timeline

- **Bắt đầu**: [Ngày bắt đầu dự án]
- **Hoàn thành**: [Ngày hoàn thành]
- **Thời gian phát triển**: [X tháng]

---

**Lưu ý**: File này chứa thông tin GitHub để nộp bài. 
Giáo viên có thể truy cập repository để kiểm tra commit history.
"@

Set-Content -Path "$submissionFolder\4. GitHub\github_info.txt" -Value $githubInfo -Encoding UTF8
Write-Host "  ✅ Đã tạo github_info.txt" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# BƯỚC 8: Copy báo cáo vào Doc folder
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 8: Copy báo cáo vào thư mục Doc..." -ForegroundColor Yellow

# Copy Design Patterns report
Copy-Item -Path "$projectRoot\docs\DESIGN_PATTERNS_REPORT.md" -Destination "$submissionFolder\5. Doc\" -Force
Write-Host "  ✅ Đã copy DESIGN_PATTERNS_REPORT.md" -ForegroundColor Green

# Tạo hướng dẫn viết báo cáo Word
$docGuide = @"
# HƯỚNG DẪN VIẾT BÁO CÁO WORD

## 📋 Nội dung báo cáo (dựa trên DESIGN_PATTERNS_REPORT.md)

### 1. Trang bìa
- Tên trường, khoa
- Tên đồ án: "WEBSITE TRAO ĐỔI ĐỒ CŨ - ÁP DỤNG DESIGN PATTERNS"
- Họ tên sinh viên, MSSV, lớp
- Giảng viên hướng dẫn
- Năm học

### 2. Mục lục (tự động)

### 3. Phần I: GIỚI THIỆU
- Bối cảnh dự án
- Mục tiêu áp dụng Design Patterns
- Các patterns được lựa chọn

### 4. Phần II: TỔNG QUAN CÁC DESIGN PATTERNS
- Bảng tổng hợp patterns (copy từ file .md)

### 5. Phần III: CHI TIẾT TỪNG DESIGN PATTERN

#### 3.1. Singleton Pattern
- Định nghĩa
- Triển khai (client-side + server-side)
- Biểu đồ minh họa
- Ưu điểm

#### 3.2. Strategy Pattern
- Định nghĩa
- Triển khai (sortStrategies + formatters)
- Biểu đồ minh họa
- Ưu điểm

#### 3.3. Decorator Pattern
- Định nghĩa
- Triển khai (API middleware + Product decorators)
- Biểu đồ minh họa
- Ưu điểm

### 6. Phần IV: TÍCH HỢP REALTIME UPDATE VỚI SOCKET.IO
- Bối cảnh
- Triển khai (server + client)
- Biểu đồ luồng
- Lợi ích

### 7. Phần V: LỢI ÍCH VÀ KẾT QUẢ ĐẠT ĐƯỢC
- Code sạch và dễ bảo trì
- Linh hoạt và mở rộng
- UX cải thiện
- Tái sử dụng code
- Số liệu cụ thể (bảng so sánh)

### 8. Phần VI: HƯỚNG MỞ RỘNG VÀ CẢI TIẾN
- Auth refresh
- Cache Decorator
- Đồng bộ hiển thị toàn site
- Singleton cho DB
- Admin cấu hình tags

### 9. Phần VII: KẾT LUẬN
- Tổng kết
- Kết quả đạt được
- Bài học kinh nghiệm
- Hướng phát triển

### 10. PHỤ LỤC
- Danh sách file liên quan
- Tham khảo thêm
- Screenshots chức năng
- Diagrams/UML

## 📸 Screenshots cần thêm

1. Trang chủ (hiển thị sản phẩm nổi bật, giá giảm)
2. Trang shop (filter, sort)
3. Trang chi tiết sản phẩm (badges, giá giảm)
4. Trang admin (quản lý posts, cập nhật nổi bật)
5. Chat realtime
6. Database schema (MongoDB Compass)
7. Code snippets quan trọng

## 💡 Lưu ý khi viết

- **Font chữ**: Times New Roman, 13pt (tiêu đề 14-16pt)
- **Dãn dòng**: 1.5
- **Lề**: Trái 3cm, Phải 2cm, Trên/Dưới 2.5cm
- **Đánh số trang**: Từ trang Mục lục
- **Code**: Dùng font Courier New, 11pt, background xám nhạt
- **Biểu đồ**: Sử dụng biểu đồ ASCII từ file .md hoặc vẽ lại bằng Draw.io
- **Tham khảo**: Ghi rõ nguồn (APA format)

## ✅ Checklist trước khi nộp

- [ ] Trang bìa đầy đủ thông tin
- [ ] Mục lục tự động (Insert > Table of Contents)
- [ ] Đánh số trang chính xác
- [ ] Code snippets clear và dễ đọc
- [ ] Screenshots chất lượng cao (1920x1080)
- [ ] Tất cả biểu đồ có caption
- [ ] Kiểm tra chính tả (F7)
- [ ] Export PDF (nếu yêu cầu)
- [ ] File size < 20MB

## 📁 File báo cáo

- **Tên file**: ``MSSV_HoTen_BaoCao_WebsiteTraoDoiDoCu.docx``
- **Định dạng**: Word (.docx) hoặc PDF
- **Lưu vào**: Thư mục ``5. Doc``
"@

Set-Content -Path "$submissionFolder\5. Doc\HUONG_DAN_VIET_BAO_CAO.txt" -Value $docGuide -Encoding UTF8
Write-Host "  ✅ Đã tạo HUONG_DAN_VIET_BAO_CAO.txt" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# BƯỚC 9: Tạo checklist tổng thể
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 9: Tạo checklist tổng thể..." -ForegroundColor Yellow

$checklist = @"
# ✅ CHECKLIST NỘP BÀI ĐỒ ÁN

## 📂 1. Source (Mã nguồn chương trình)
- [ ] Thư mục ``client`` đầy đủ (html, css, js)
- [ ] Thư mục ``server`` đầy đủ (src, models, routes, middleware)
- [ ] Thư mục ``docs`` (documentation)
- [ ] File ``README.md`` mô tả tổng quan
- [ ] File ``.env.example`` (KHÔNG có ``.env`` thật)
- [ ] File ``package.json`` (server)
- [ ] KHÔNG có thư mục ``node_modules``

## 📊 2. Database (Các file data và script)
- [ ] File ``README.md`` hướng dẫn setup MongoDB
- [ ] File ``database_schema.txt`` mô tả cấu trúc DB
- [ ] Thư mục ``scripts`` chứa:
  - [ ] ``seed_data.js``
  - [ ] ``clear_data.js``
  - [ ] ``check_users.js``
  - [ ] ``reset_admin_password.js``

## 🚀 3. Executable (File tự chạy)
- [ ] File ``START_SERVER.bat`` (Windows)
- [ ] File ``START_SERVER.sh`` (Mac/Linux)
- [ ] File ``README.md`` hướng dẫn chi tiết
- [ ] Test chạy thành công trên máy khác

## 🔗 4. GitHub (File txt thông tin GitHub)
- [ ] File ``github_info.txt`` chứa:
  - [ ] URL repository
  - [ ] Thông tin author
  - [ ] Commit history (tóm tắt)
  - [ ] Timeline phát triển

## 📄 5. Doc (Báo cáo đồ án Word)
- [ ] File báo cáo Word (``MSSV_HoTen_BaoCao.docx``)
- [ ] File ``DESIGN_PATTERNS_REPORT.md`` (reference)
- [ ] File ``HUONG_DAN_VIET_BAO_CAO.txt``
- [ ] Báo cáo có đầy đủ:
  - [ ] Trang bìa
  - [ ] Mục lục
  - [ ] 7 phần chính
  - [ ] Screenshots
  - [ ] Code snippets
  - [ ] Biểu đồ
  - [ ] Phụ lục

## 🔍 Kiểm tra cuối cùng

### A. Tên folder
- [ ] Đổi tên folder thành: ``MSSV_HoTen_WebsiteTraoDoiDoCu_MTK``
  - Ví dụ: ``2021604123_NguyenVanA_WebsiteTraoDoiDoCu_MTK``

### B. Cấu trúc folder
``````
MSSV_HoTen_WebsiteTraoDoiDoCu_MTK/
├── 1. Source/
│   ├── client/
│   ├── server/
│   ├── docs/
│   └── README.md
├── 2. Database/
│   ├── scripts/
│   ├── README.md
│   └── database_schema.txt
├── 3. Executable/
│   ├── START_SERVER.bat
│   ├── START_SERVER.sh
│   └── README.md
├── 4. GitHub/
│   └── github_info.txt
└── 5. Doc/
    ├── MSSV_HoTen_BaoCao.docx
    ├── DESIGN_PATTERNS_REPORT.md
    └── HUONG_DAN_VIET_BAO_CAO.txt
``````

### C. Kích thước
- [ ] Tổng kích thước folder < 100MB
- [ ] Nếu > 100MB: nén thành file ZIP

### D. Test chạy
- [ ] Test trên máy khác (bạn bè/gia đình)
- [ ] Test với Node.js version khác
- [ ] Test ``START_SERVER.bat`` chạy thành công
- [ ] Test mở ``index.html`` hiển thị đúng

### E. Bảo mật
- [ ] Đã xóa file ``.env``
- [ ] Đã xóa thư mục ``node_modules``
- [ ] Đã xóa các file log
- [ ] Đã xóa các thông tin nhạy cảm

### F. Documentation
- [ ] README.md dễ hiểu
- [ ] Hướng dẫn đầy đủ
- [ ] Screenshots chất lượng
- [ ] Code comments rõ ràng

## 📦 Nộp bài

- [ ] Nén thành file ZIP (nếu cần)
- [ ] Tên file ZIP: ``MSSV_HoTen_WebsiteTraoDoiDoCu_MTK.zip``
- [ ] Upload lên LMS/Google Drive theo yêu cầu
- [ ] Gửi email xác nhận (nếu cần)

## 🎉 Hoàn thành!

Nếu đã check hết tất cả, bạn đã sẵn sàng nộp bài!

**Chúc bạn bảo vệ thành công! 🎓**

---

**Ngày tạo checklist**: [Tự động]
**Người tạo**: GitHub Copilot
"@

Set-Content -Path "$submissionFolder\CHECKLIST.txt" -Value $checklist -Encoding UTF8
Write-Host "  ✅ Đã tạo CHECKLIST.txt" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# HOÀN TẤT
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎉 HOÀN TẤT TẠO FOLDER NỘP BÀI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📂 Folder đã tạo tại: $submissionFolder" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 BƯỚC TIẾP THEO:" -ForegroundColor Yellow
Write-Host "  1. Mở folder: $submissionFolder" -ForegroundColor White
Write-Host "  2. Kiểm tra file CHECKLIST.txt" -ForegroundColor White
Write-Host "  3. Viết/Copy báo cáo Word vào thư mục '5. Doc'" -ForegroundColor White
Write-Host "  4. Cập nhật thông tin GitHub trong '4. GitHub/github_info.txt'" -ForegroundColor White
Write-Host "  5. Đổi tên folder thành: MSSV_HoTen_WebsiteTraoDoiDoCu_MTK" -ForegroundColor White
Write-Host "  6. Test chạy START_SERVER.bat" -ForegroundColor White
Write-Host "  7. Kiểm tra lại checklist" -ForegroundColor White
Write-Host "  8. Nén và nộp bài!" -ForegroundColor White
Write-Host ""
Write-Host "💡 TIP: Đọc file HUONG_DAN_VIET_BAO_CAO.txt trong thư mục '5. Doc'" -ForegroundColor Cyan
Write-Host ""

# Mở folder trong Explorer
Start-Process explorer.exe $submissionFolder

Write-Host "Nhấn phím bất kỳ để đóng..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
