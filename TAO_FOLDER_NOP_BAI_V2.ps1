# =========================================================
# SCRIPT TỰ ĐỘNG TẠO CẤU TRÚC FOLDER NỘP BÀI ĐỒ ÁN
# =========================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TẠO FOLDER NỘP BÀI ĐỒ ÁN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Thiết lập đường dẫn
$projectRoot = "c:\Users\Asus\Downloads\Đồ án\Đồ án\website-trao-doi-do-cu"
$submissionFolder = "c:\Users\Asus\Downloads\Đồ án\Đồ án\MSSV_HoTen_WebsiteTraoDoiDoCu_NopBai"

Write-Host "📂 Thư mục dự án gốc: $projectRoot" -ForegroundColor Green
Write-Host "📂 Thư mục nộp bài: $submissionFolder" -ForegroundColor Green
Write-Host ""

# Xác nhận
Write-Host "Bạn có muốn tiếp tục? (Y/N): " -NoNewline -ForegroundColor Yellow
$confirm = Read-Host
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "❌ Hủy bỏ!" -ForegroundColor Red
    exit
}

# ─────────────────────────────────────────────────────────
# BƯỚC 1: Tạo cấu trúc folder
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 1: Tạo cấu trúc folder..." -ForegroundColor Yellow

$folders = @(
    "$submissionFolder\1. Source",
    "$submissionFolder\2. Database\scripts",
    "$submissionFolder\3. Executable",
    "$submissionFolder\4. GitHub",
    "$submissionFolder\5. Doc"
)

foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  ✅ $folder" -ForegroundColor Green
    }
}

# ─────────────────────────────────────────────────────────
# BƯỚC 2: Copy Source Code
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 2: Copy source code..." -ForegroundColor Yellow

# Copy client
Write-Host "  📋 client..." -ForegroundColor Cyan
Copy-Item -Path "$projectRoot\client" -Destination "$submissionFolder\1. Source\client" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  ✅ client" -ForegroundColor Green

# Copy server (loại trừ node_modules)
Write-Host "  📋 server..." -ForegroundColor Cyan
$serverDest = "$submissionFolder\1. Source\server"
New-Item -ItemType Directory -Path $serverDest -Force | Out-Null

Get-ChildItem -Path "$projectRoot\server" -Exclude "node_modules" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $serverDest -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "  ✅ server" -ForegroundColor Green

# Xóa .env nếu có
$envFile = "$serverDest\.env"
if (Test-Path $envFile) {
    Remove-Item $envFile -Force
    Write-Host "  🔒 Đã xóa .env (bảo mật)" -ForegroundColor Yellow
}

# Copy docs
Write-Host "  📋 docs..." -ForegroundColor Cyan
Copy-Item -Path "$projectRoot\docs" -Destination "$submissionFolder\1. Source\docs" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  ✅ docs" -ForegroundColor Green

# Copy README
if (Test-Path "$projectRoot\README.md") {
    Copy-Item -Path "$projectRoot\README.md" -Destination "$submissionFolder\1. Source\" -Force
    Write-Host "  ✅ README.md" -ForegroundColor Green
}

# ─────────────────────────────────────────────────────────
# BƯỚC 3: Tạo file .env.example
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 3: Tạo .env.example..." -ForegroundColor Yellow

$envContent = "# CẤU HÌNH MÔI TRƯỜNG
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key
PORT=8080
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLIENT_URL=http://localhost:5500"

$envContent | Out-File -FilePath "$submissionFolder\1. Source\server\.env.example" -Encoding UTF8
Write-Host "  ✅ .env.example" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# BƯỚC 4: Copy database scripts
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 4: Copy database scripts..." -ForegroundColor Yellow

$dbScripts = @("seed_data.js", "clear_data.js", "check_users.js", "reset_admin_password.js")
foreach ($script in $dbScripts) {
    $scriptPath = Join-Path "$projectRoot\server" $script
    if (Test-Path $scriptPath) {
        Copy-Item -Path $scriptPath -Destination "$submissionFolder\2. Database\scripts\" -Force
        Write-Host "  ✅ $script" -ForegroundColor Green
    }
}

# Tạo Database README
$dbReadme = "# DATABASE

## MongoDB Atlas
- Loại DB: MongoDB (NoSQL)
- Cloud: MongoDB Atlas
- Database: website-trao-doi-do-cu

## Collections
- users, posts, categories, messages, transactions
- savedposts, ratings, vippackages, vipsubscriptions

## Setup
1. Tạo MongoDB Atlas account (free)
2. Tạo cluster
3. Lấy connection string
4. Paste vào file .env

## Scripts
- seed_data.js: Tạo dữ liệu mẫu
- clear_data.js: Xóa dữ liệu
- check_users.js: Kiểm tra users"

$dbReadme | Out-File -FilePath "$submissionFolder\2. Database\README.md" -Encoding UTF8
Write-Host "  ✅ Database README.md" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# BƯỚC 5: Tạo file executable
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 5: Tạo file executable..." -ForegroundColor Yellow

# START_SERVER.bat
$batContent = "@echo off
echo ========================================
echo   WEBSITE TRAO DOI DO CU
echo   Starting Server...
echo ========================================
echo.

cd /d `"%~dp0..\1. Source\server`"

echo Installing dependencies...
call npm install

echo.
echo Starting server...
call npm start

pause"

$batContent | Out-File -FilePath "$submissionFolder\3. Executable\START_SERVER.bat" -Encoding ASCII
Write-Host "  ✅ START_SERVER.bat" -ForegroundColor Green

# README
$execReadme = "# HƯỚNG DẪN CHẠY

## Yêu cầu
- Node.js >= 16.x
- MongoDB Atlas account

## Bước 1: Cài Node.js
Download: https://nodejs.org/

## Bước 2: Cấu hình .env
- Mở: ../1. Source/server/.env.example
- Copy thành .env
- Điền MongoDB URI

## Bước 3: Chạy server
Double-click: START_SERVER.bat

## Bước 4: Mở website
- Đợi server khởi động
- Mở: ../1. Source/client/index.html

## Tài khoản test
Admin: admin@example.com / admin123
User: user@example.com / user123"

$execReadme | Out-File -FilePath "$submissionFolder\3. Executable\README.md" -Encoding UTF8
Write-Host "  ✅ Executable README.md" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# BƯỚC 6: Tạo GitHub info
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 6: Tạo GitHub info..." -ForegroundColor Yellow

$githubInfo = "# THÔNG TIN GITHUB DỰ ÁN

Repository: cvinh-doanchuyennganh
Owner: Ji-Eung
Branch: master
URL: https://github.com/Ji-Eung/cvinh-doanchuyennganh

## Thống kê
- Languages: JavaScript, HTML, CSS
- Patterns: Singleton, Strategy, Decorator

## Clone
git clone https://github.com/Ji-Eung/cvinh-doanchuyennganh.git

## Author
[Điền thông tin của bạn]
MSSV: [Điền MSSV]
Email: [Điền email]"

$githubInfo | Out-File -FilePath "$submissionFolder\4. GitHub\github_info.txt" -Encoding UTF8
Write-Host "  ✅ github_info.txt" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# BƯỚC 7: Copy báo cáo
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 7: Copy báo cáo..." -ForegroundColor Yellow

Copy-Item -Path "$projectRoot\docs\DESIGN_PATTERNS_REPORT.md" -Destination "$submissionFolder\5. Doc\" -Force -ErrorAction SilentlyContinue
Write-Host "  ✅ DESIGN_PATTERNS_REPORT.md" -ForegroundColor Green

$docGuide = "# LƯU Ý

1. Copy báo cáo Word của bạn vào đây
2. Tên file: MSSV_HoTen_BaoCao.docx
3. Dùng file DESIGN_PATTERNS_REPORT.md làm tham khảo"

$docGuide | Out-File -FilePath "$submissionFolder\5. Doc\LUU_Y.txt" -Encoding UTF8
Write-Host "  ✅ LUU_Y.txt" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# BƯỚC 8: Tạo CHECKLIST
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔨 BƯỚC 8: Tạo checklist..." -ForegroundColor Yellow

$checklist = "# CHECKLIST NỘP BÀI

## 1. Source
- [x] client/
- [x] server/
- [x] docs/
- [x] .env.example (KHÔNG có .env)
- [x] KHÔNG có node_modules

## 2. Database
- [x] README.md
- [x] scripts/

## 3. Executable
- [x] START_SERVER.bat
- [x] README.md

## 4. GitHub
- [ ] Cập nhật thông tin trong github_info.txt

## 5. Doc
- [ ] Copy báo cáo Word vào đây
- [x] DESIGN_PATTERNS_REPORT.md (reference)

## Bước tiếp theo
1. Cập nhật 4. GitHub/github_info.txt (MSSV, họ tên)
2. Copy báo cáo Word vào 5. Doc/
3. Đổi tên folder: MSSV_HoTen_WebsiteTraoDoiDoCu_MTK
4. Test chạy START_SERVER.bat
5. Nén và nộp bài!"

$checklist | Out-File -FilePath "$submissionFolder\CHECKLIST.txt" -Encoding UTF8
Write-Host "  ✅ CHECKLIST.txt" -ForegroundColor Green

# ─────────────────────────────────────────────────────────
# HOÀN TẤT
# ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🎉 HOÀN TẤT!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📂 Folder: $submissionFolder" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 BƯỚC TIẾP THEO:" -ForegroundColor Yellow
Write-Host "  1. Cập nhật 4. GitHub/github_info.txt" -ForegroundColor White
Write-Host "  2. Copy báo cáo Word vào 5. Doc/" -ForegroundColor White
Write-Host "  3. Đổi tên folder: MSSV_HoTen_WebsiteTraoDoiDoCu_MTK" -ForegroundColor White
Write-Host "  4. Đọc file CHECKLIST.txt" -ForegroundColor White
Write-Host ""

# Mở folder
Start-Process explorer.exe $submissionFolder

Write-Host "Nhấn Enter để đóng..." -ForegroundColor Gray
Read-Host
