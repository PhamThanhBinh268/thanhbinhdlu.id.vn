# =========================================================
# SCRIPT TAO FOLDER NOP BAI - TUAN TU VA SACH SE
# =========================================================

Write-Host "========================================"
Write-Host "  TAO FOLDER NOP BAI DO AN"
Write-Host "========================================"
Write-Host ""

# Duong dan
$currentPath = Get-Location
$submissionName = "MSSV_HoTen_WebsiteTraoDoiDoCu_NopBai"
$submissionFolder = Join-Path (Split-Path $currentPath -Parent) $submissionName

Write-Host "Thu muc hien tai: $currentPath"
Write-Host "Thu muc nop bai: $submissionFolder"
Write-Host ""

# Xac nhan
Write-Host "Ban co muon tiep tuc? " -NoNewline -ForegroundColor Yellow
$confirm = Read-Host "(Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Huy bo!" -ForegroundColor Red
    exit
}

# =========================================================
# BUOC 1: TAO CAU TRUC FOLDER
# =========================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUOC 1: TAO CAU TRUC FOLDER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$folders = @(
    "$submissionFolder\1. Source",
    "$submissionFolder\2. Database\scripts",
    "$submissionFolder\3. Executable",
    "$submissionFolder\4. GitHub",
    "$submissionFolder\5. Doc"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Write-Host "  [OK] $folder" -ForegroundColor Green
}

Write-Host ""
Write-Host "Nhan Enter de tiep tuc..." -ForegroundColor Yellow
Read-Host

# =========================================================
# BUOC 2: COPY CLIENT (CHI HTML, CSS, JS)
# =========================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUOC 2: COPY CLIENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$clientDest = "$submissionFolder\1. Source\client"
New-Item -ItemType Directory -Path $clientDest -Force | Out-Null

Write-Host "Dang copy client..." -ForegroundColor Yellow

# Copy cac file HTML
Get-ChildItem -Path "client" -Filter "*.html" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring((Get-Location).Path.Length + 8)
    $destPath = Join-Path $clientDest $relativePath
    $destDir = Split-Path $destPath -Parent
    
    if (!(Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    
    Copy-Item -Path $_.FullName -Destination $destPath -Force
}
Write-Host "  [OK] HTML files" -ForegroundColor Green

# Copy thu muc css
if (Test-Path "client\css") {
    Copy-Item -Path "client\css" -Destination "$clientDest\css" -Recurse -Force
    Write-Host "  [OK] css/" -ForegroundColor Green
}

# Copy thu muc js
if (Test-Path "client\js") {
    Copy-Item -Path "client\js" -Destination "$clientDest\js" -Recurse -Force
    Write-Host "  [OK] js/" -ForegroundColor Green
}

# Copy thu muc img
if (Test-Path "client\img") {
    Copy-Item -Path "client\img" -Destination "$clientDest\img" -Recurse -Force
    Write-Host "  [OK] img/" -ForegroundColor Green
}

# Copy thu muc lib
if (Test-Path "client\lib") {
    Copy-Item -Path "client\lib" -Destination "$clientDest\lib" -Recurse -Force
    Write-Host "  [OK] lib/" -ForegroundColor Green
}

# Copy thu muc scss (neu can)
if (Test-Path "client\scss") {
    Copy-Item -Path "client\scss" -Destination "$clientDest\scss" -Recurse -Force
    Write-Host "  [OK] scss/" -ForegroundColor Green
}

# Copy thu muc partials
if (Test-Path "client\partials") {
    Copy-Item -Path "client\partials" -Destination "$clientDest\partials" -Recurse -Force
    Write-Host "  [OK] partials/" -ForegroundColor Green
}

# Copy thu muc admin
if (Test-Path "client\admin") {
    Copy-Item -Path "client\admin" -Destination "$clientDest\admin" -Recurse -Force
    Write-Host "  [OK] admin/" -ForegroundColor Green
}

Write-Host ""
Write-Host "Hoan thanh copy client!" -ForegroundColor Green
Write-Host "Nhan Enter de tiep tuc..." -ForegroundColor Yellow
Read-Host

# =========================================================
# BUOC 3: COPY SERVER (LOAI TRU NODE_MODULES, .ENV, .MD)
# =========================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUOC 3: COPY SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$serverDest = "$submissionFolder\1. Source\server"
New-Item -ItemType Directory -Path $serverDest -Force | Out-Null

Write-Host "Dang copy server..." -ForegroundColor Yellow

# Copy package.json
if (Test-Path "server\package.json") {
    Copy-Item -Path "server\package.json" -Destination $serverDest -Force
    Write-Host "  [OK] package.json" -ForegroundColor Green
}

if (Test-Path "server\package-lock.json") {
    Copy-Item -Path "server\package-lock.json" -Destination $serverDest -Force
    Write-Host "  [OK] package-lock.json" -ForegroundColor Green
}

# Copy thu muc src
if (Test-Path "server\src") {
    Copy-Item -Path "server\src" -Destination "$serverDest\src" -Recurse -Force
    Write-Host "  [OK] src/" -ForegroundColor Green
}

# Copy cac file script (khong phai .md)
Get-ChildItem -Path "server" -File | Where-Object { 
    $_.Extension -ne ".md" -and $_.Name -ne ".env" -and $_.Name -ne ".env.local"
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $serverDest -Force
    Write-Host "  [OK] $($_.Name)" -ForegroundColor Green
}

# Tao file .env.example (KHONG CO THONG TIN THAT)
Write-Host ""
Write-Host "Tao .env.example..." -ForegroundColor Yellow
$envExample = "# CAU HINH MOI TRUONG
# Huong dan: Copy file nay thanh .env va dien thong tin thuc te

# MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# JWT Secret (doi thanh chuoi ngau nhien)
JWT_SECRET=your-secret-key-here-change-in-production

# Server Port
PORT=8080

# Cloudinary (Upload anh)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Client URL
CLIENT_URL=http://localhost:5500

# VNPay (neu co)
VNPAY_TMN_CODE=your-tmn-code
VNPAY_HASH_SECRET=your-hash-secret"

$envExample | Out-File -FilePath "$serverDest\.env.example" -Encoding UTF8
Write-Host "  [OK] .env.example (TEMPLATE)" -ForegroundColor Green

# XOA cac file nhay cam neu co
$sensitiveFiles = @(".env", ".env.local", ".env.production")
foreach ($file in $sensitiveFiles) {
    $filePath = Join-Path $serverDest $file
    if (Test-Path $filePath) {
        Remove-Item $filePath -Force
        Write-Host "  [DELETED] $file (file nhay cam)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Hoan thanh copy server!" -ForegroundColor Green
Write-Host "Nhan Enter de tiep tuc..." -ForegroundColor Yellow
Read-Host

# =========================================================
# BUOC 4: TAO THU MUC DATABASE
# =========================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUOC 4: TAO THU MUC DATABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Copy database scripts
Write-Host "Copy database scripts..." -ForegroundColor Yellow
$dbScripts = @("seed_data.js", "clear_data.js", "check_users.js", "reset_admin_password.js", "check_admins.js")
foreach ($script in $dbScripts) {
    if (Test-Path "server\$script") {
        Copy-Item -Path "server\$script" -Destination "$submissionFolder\2. Database\scripts\" -Force
        Write-Host "  [OK] $script" -ForegroundColor Green
    }
}

# Tao README cho Database
Write-Host ""
Write-Host "Tao Database README..." -ForegroundColor Yellow
$dbReadme = "DATABASE - WEBSITE TRAO DOI DO CU
=====================================

Loai DB: MongoDB (NoSQL)
Cloud: MongoDB Atlas (Free Tier)
Ten Database: website-trao-doi-do-cu

CAC COLLECTION
--------------
1. users - Nguoi dung
2. posts - Bai dang san pham
3. categories - Danh muc
4. messages - Tin nhan chat
5. transactions - Giao dich
6. savedposts - Bai dang da luu
7. ratings - Danh gia
8. vippackages - Goi VIP
9. vipsubscriptions - Dang ky VIP

HUONG DAN SETUP
---------------
1. Tao tai khoan MongoDB Atlas (mien phi):
   https://www.mongodb.com/cloud/atlas

2. Tao Cluster moi (chon Free Tier)

3. Tao Database User:
   - Username: [tu dat]
   - Password: [tu dat]

4. Whitelist IP: 0.0.0.0/0 (cho phep moi IP)

5. Lay Connection String:
   - Vao Cluster > Connect > Connect your application
   - Copy connection string
   - Paste vao file .env (bien MONGO_URI)
   - Thay <username> va <password> bang thong tin thuc te

6. Seed du lieu mau (optional):
   cd server
   node seed_data.js

SCRIPTS HO TRO
--------------
- seed_data.js: Tao du lieu mau
- clear_data.js: Xoa toan bo du lieu
- check_users.js: Kiem tra users
- reset_admin_password.js: Reset mat khau admin
- check_admins.js: Kiem tra admin accounts"

$dbReadme | Out-File -FilePath "$submissionFolder\2. Database\README.txt" -Encoding UTF8
Write-Host "  [OK] README.txt" -ForegroundColor Green

Write-Host ""
Write-Host "Hoan thanh thu muc Database!" -ForegroundColor Green
Write-Host "Nhan Enter de tiep tuc..." -ForegroundColor Yellow
Read-Host

# =========================================================
# BUOC 5: TAO THU MUC EXECUTABLE
# =========================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUOC 5: TAO THU MUC EXECUTABLE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Tao START_SERVER.bat
Write-Host "Tao START_SERVER.bat..." -ForegroundColor Yellow
$batContent = '@echo off
chcp 65001 > nul
echo ========================================
echo   WEBSITE TRAO DOI DO CU
echo   Dang khoi dong server...
echo ========================================
echo.

cd /d "%~dp0..\1. Source\server"

echo [1/3] Cai dat dependencies...
call npm install

if errorlevel 1 (
    echo.
    echo [LOI] Khong the cai dat dependencies!
    echo Vui long kiem tra ket noi internet.
    pause
    exit /b 1
)

echo.
echo [2/3] Kiem tra file .env...

if not exist .env (
    echo.
    echo [CANH BAO] Chua co file .env!
    echo Vui long:
    echo 1. Copy file .env.example thanh .env
    echo 2. Dien thong tin MongoDB URI
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] Khoi dong server...
echo Server se chay tai: http://localhost:8080
echo Nhan Ctrl+C de dung server
echo.

call npm start

pause'

$batContent | Out-File -FilePath "$submissionFolder\3. Executable\START_SERVER.bat" -Encoding ASCII
Write-Host "  [OK] START_SERVER.bat" -ForegroundColor Green

# Tao HUONG_DAN.txt
Write-Host "Tao HUONG_DAN.txt..." -ForegroundColor Yellow
$huongDan = "HUONG DAN CHAY WEBSITE TRAO DOI DO CU
=======================================

YEU CAU HE THONG
----------------
- Node.js phien ban 16.x tro len
  Download: https://nodejs.org/
  
- MongoDB Atlas account (mien phi)
  Dang ky: https://www.mongodb.com/cloud/atlas
  
- Trinh duyet: Chrome, Firefox, Edge (khuyen dung Chrome)


CACH CHAY CHO WINDOWS
----------------------

BUOC 1: Cai dat Node.js
  1. Truy cap: https://nodejs.org/
  2. Chon phien ban LTS (khuyen nghị)
  3. Tai ve va cai dat
  4. Kiem tra cai dat thanh cong:
     Mo CMD va go:
     node --version
     npm --version

BUOC 2: Cau hinh MongoDB
  1. Xem huong dan trong thu muc: ../2. Database/README.txt
  2. Tao MongoDB Atlas account
  3. Lay connection string
  4. Mo file: ../1. Source/server/.env.example
  5. Copy file nay thanh .env
  6. Dien MongoDB URI vao dong MONGO_URI

BUOC 3: Chay server
  Cach 1: Double-click file START_SERVER.bat
  Cach 2: Mo CMD tai thu muc nay va go:
          START_SERVER.bat

BUOC 4: Mo website
  1. Doi server khoi dong xong (hien thi: Server running on port 8080)
  2. Mo file: ../1. Source/client/index.html bang trinh duyet
  3. Hoac dung Live Server trong VS Code

TAI KHOAN TEST
--------------
Admin:
  Email: admin@example.com
  Password: admin123

User:
  Email: user@example.com
  Password: user123


LOI THUONG GAP
--------------

1. Loi: node is not recognized
   Nguyen nhan: Chua cai Node.js hoac chua restart terminal
   Giai phap: Cai Node.js va restart may

2. Loi: Cannot connect to MongoDB
   Nguyen nhan: File .env chua cau hinh dung
   Giai phap: Kiem tra lai MONGO_URI trong .env

3. Loi: Port 8080 already in use
   Nguyen nhan: Da co ung dung khac chay tren port 8080
   Giai phap: Tat ung dung do hoac doi PORT trong .env

4. Loi: npm ERR! code ENOENT
   Nguyen nhan: Dang o sai thu muc
   Giai phap: Dam bao dang o thu muc server

5. Loi: Failed to fetch
   Nguyen nhan: Server chua chay hoac URL sai
   Giai phap: Kiem tra server dang chay va URL dung


HO TRO
------
Neu gap loi khac, vui long:
1. Doc file log trong terminal
2. Google loi cu the
3. Lien he nguoi phat trien"

$huongDan | Out-File -FilePath "$submissionFolder\3. Executable\HUONG_DAN.txt" -Encoding UTF8
Write-Host "  [OK] HUONG_DAN.txt" -ForegroundColor Green

Write-Host ""
Write-Host "Hoan thanh thu muc Executable!" -ForegroundColor Green
Write-Host "Nhan Enter de tiep tuc..." -ForegroundColor Yellow
Read-Host

# =========================================================
# BUOC 6: TAO THU MUC GITHUB
# =========================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUOC 6: TAO THU MUC GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Tao GITHUB_INFO.txt..." -ForegroundColor Yellow
$githubInfo = "THONG TIN GITHUB DU AN
======================

Repository: cvinh-doanchuyennganh
Owner: Ji-Eung
Branch: master
URL: https://github.com/Ji-Eung/cvinh-doanchuyennganh


THONG KE
--------
- Ngon ngu: JavaScript, HTML, CSS
- Design Patterns: Singleton, Strategy, Decorator
- Framework: Node.js, Express, MongoDB, Socket.IO
- Frontend: Bootstrap 4, jQuery, Vanilla JS


CAC GIAI DOAN PHAT TRIEN
-------------------------
1. Khoi tao du an va setup co ban
2. Phat trien tinh nang CRUD
3. Tich hop Socket.IO cho chat realtime
4. Ap dung Design Patterns
5. Hoan thien va optimize


CLONE VA SETUP
--------------
git clone https://github.com/Ji-Eung/cvinh-doanchuyennganh.git
cd cvinh-doanchuyennganh/server
npm install
cp .env.example .env
# Chinh sua .env
npm start


TODO: DIEN THONG TIN CUA BAN
==============================
MSSV: [Dien MSSV cua ban]
Ho va ten: [Dien ho ten cua ban]
Lop: [Dien lop cua ban]
Email: [Dien email cua ban]
GitHub cua ban: [Dien link GitHub cua ban neu co]"

$githubInfo | Out-File -FilePath "$submissionFolder\4. GitHub\GITHUB_INFO.txt" -Encoding UTF8
Write-Host "  [OK] GITHUB_INFO.txt" -ForegroundColor Green

Write-Host ""
Write-Host "Hoan thanh thu muc GitHub!" -ForegroundColor Green
Write-Host "Nhan Enter de tiep tuc..." -ForegroundColor Yellow
Read-Host

# =========================================================
# BUOC 7: TAO THU MUC DOC
# =========================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUOC 7: TAO THU MUC DOC" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Tao LUU_Y.txt..." -ForegroundColor Yellow
$luuY = "LUU Y - FOLDER DOC
==================

HAY COPY BAO CAO WORD CUA BAN VAO DAY!

Ten file nen dat: MSSV_HoTen_BaoCao_DoAn.docx

Vi du: 2021604123_NguyenVanA_BaoCao_DoAn.docx


NOI DUNG BAO CAO NEN BAO GOM
-----------------------------
1. Trang bia (Ten truong, khoa, ten do an, MSSV, ho ten, giang vien)
2. Muc luc (tu dong)
3. Gioi thieu du an
4. Cong nghe su dung
5. Chuc nang chinh
6. Design Patterns da ap dung:
   - Singleton Pattern
   - Strategy Pattern
   - Decorator Pattern
7. Database schema
8. Screenshots cac chuc nang
9. Ket luan
10. Tai lieu tham khao


FILE THAM KHAO
--------------
File DESIGN_PATTERNS_REPORT.md trong thu muc docs/ cua du an goc
co the dung de tham khao viet bao cao Word.


DINH DANG
---------
- Font: Times New Roman, 13pt
- Tieu de: 14-16pt, dam
- Dan dong: 1.5
- Le: Trai 3cm, Phai 2cm, Tren/Duoi 2.5cm
- Code: Font Courier New, 11pt, background xam nhat"

$luuY | Out-File -FilePath "$submissionFolder\5. Doc\LUU_Y.txt" -Encoding UTF8
Write-Host "  [OK] LUU_Y.txt" -ForegroundColor Green

Write-Host ""
Write-Host "Hoan thanh thu muc Doc!" -ForegroundColor Green
Write-Host "Nhan Enter de tiep tuc..." -ForegroundColor Yellow
Read-Host

# =========================================================
# BUOC 8: TAO CHECKLIST TONG QUAN
# =========================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BUOC 8: TAO CHECKLIST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Tao CHECKLIST.txt..." -ForegroundColor Yellow
$checklist = "CHECKLIST NOP BAI DO AN
========================

1. SOURCE
---------
   [x] client/ (HTML, CSS, JS)
   [x] server/ (src, models, routes, middleware)
   [x] package.json
   [x] .env.example (KHONG CO .env that)
   [x] KHONG CO node_modules
   [x] KHONG CO file .md hay README

2. DATABASE
-----------
   [x] scripts/ (seed_data.js, clear_data.js, etc.)
   [x] README.txt (huong dan setup MongoDB)

3. EXECUTABLE
-------------
   [x] START_SERVER.bat (file tu chay)
   [x] HUONG_DAN.txt (huong dan chi tiet)

4. GITHUB
---------
   [ ] Cap nhat thong tin trong GITHUB_INFO.txt
       - MSSV
       - Ho ten
       - Lop
       - Email

5. DOC
------
   [ ] Copy bao cao Word vao day
   [ ] Ten file: MSSV_HoTen_BaoCao_DoAn.docx


BUOC TIEP THEO (QUAN TRONG!)
=============================

1. CAP NHAT THONG TIN
   - Mo file: 4. GitHub/GITHUB_INFO.txt
   - Dien MSSV, ho ten, lop, email

2. COPY BAO CAO WORD
   - Copy file bao cao Word vao: 5. Doc/
   - Kiem tra ten file dung format: MSSV_HoTen_BaoCao_DoAn.docx

3. DOI TEN FOLDER
   - Doi ten folder nay thanh:
     MSSV_HoTen_WebsiteTraoDoiDoCu_MTK
   - Vi du: 2021604123_NguyenVanA_WebsiteTraoDoiDoCu_MTK

4. TEST CHAY
   - Mo 3. Executable/
   - Double-click START_SERVER.bat
   - Kiem tra server chay thanh cong
   - Mo client/index.html
   - Test dang nhap, xem san pham

5. KIEM TRA CUOI CUNG
   - Kiem tra lai tat ca cac file
   - Dam bao KHONG co file .env that
   - Dam bao KHONG co node_modules
   - Tong kich thuoc folder < 100MB

6. NEN VA NOP BAI
   - Nen folder thanh file ZIP
   - Ten file ZIP: MSSV_HoTen_WebsiteTraoDoiDoCu_MTK.zip
   - Upload len he thong nop bai cua truong


CANH BAO BAO MAT
================
- KHONG duoc co file .env that (chi co .env.example)
- KHONG duoc co thong tin nhay cam (password, API key, etc.)
- Da xoa cac file nhay cam trong qua trinh copy


CHUC MAY MAN!
============="

$checklist | Out-File -FilePath "$submissionFolder\CHECKLIST.txt" -Encoding UTF8
Write-Host "  [OK] CHECKLIST.txt" -ForegroundColor Green

# =========================================================
# HOAN TAT
# =========================================================
Write-Host ""
Write-Host ""
Write-Host "========================================"
Write-Host "========================================"
Write-Host "  HOAN TAT TAO FOLDER NOP BAI!"
Write-Host "========================================"
Write-Host "========================================"
Write-Host ""
Write-Host "Folder da duoc tao tai:" -ForegroundColor Yellow
Write-Host "$submissionFolder" -ForegroundColor Cyan
Write-Host ""
Write-Host "BUOC TIEP THEO:" -ForegroundColor Yellow
Write-Host "  1. Doc file CHECKLIST.txt" -ForegroundColor White
Write-Host "  2. Cap nhat 4. GitHub/GITHUB_INFO.txt" -ForegroundColor White
Write-Host "  3. Copy bao cao Word vao 5. Doc/" -ForegroundColor White
Write-Host "  4. Doi ten folder" -ForegroundColor White
Write-Host "  5. Test chay START_SERVER.bat" -ForegroundColor White
Write-Host ""

# Mo folder trong Explorer
Write-Host "Dang mo folder..." -ForegroundColor Green
Start-Process explorer.exe $submissionFolder

Write-Host ""
Write-Host "Nhan Enter de dong cua so nay..." -ForegroundColor Gray
Read-Host
