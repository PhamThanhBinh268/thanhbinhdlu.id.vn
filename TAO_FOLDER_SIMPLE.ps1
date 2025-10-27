# Script tao folder nop bai - Don gian
# ========================================

Write-Host "========================================"
Write-Host "  TAO FOLDER NOP BAI DO AN"
Write-Host "========================================"
Write-Host ""

# Duong dan
$currentPath = Get-Location
$submissionName = "MSSV_HoTen_WebsiteTraoDoiDoCu_NopBai"
$submissionFolder = Join-Path (Split-Path $currentPath -Parent) $submissionName

Write-Host "Thu muc goc: $currentPath"
Write-Host "Thu muc nop bai: $submissionFolder"
Write-Host ""

# Xac nhan
$confirm = Read-Host "Tiep tuc? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Huy bo!"
    exit
}

# Tao folder
Write-Host ""
Write-Host "Tao folder..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path "$submissionFolder\1. Source" -Force | Out-Null
New-Item -ItemType Directory -Path "$submissionFolder\2. Database\scripts" -Force | Out-Null
New-Item -ItemType Directory -Path "$submissionFolder\3. Executable" -Force | Out-Null
New-Item -ItemType Directory -Path "$submissionFolder\4. GitHub" -Force | Out-Null
New-Item -ItemType Directory -Path "$submissionFolder\5. Doc" -Force | Out-Null

Write-Host "  OK - Folder" -ForegroundColor Green

# Copy client
Write-Host ""
Write-Host "Copy client..." -ForegroundColor Yellow
Copy-Item -Path "client" -Destination "$submissionFolder\1. Source\client" -Recurse -Force
Write-Host "  OK - client" -ForegroundColor Green

# Copy server (khong co node_modules)
Write-Host "Copy server..." -ForegroundColor Yellow
$serverDest = "$submissionFolder\1. Source\server"
New-Item -ItemType Directory -Path $serverDest -Force | Out-Null

Get-ChildItem -Path "server" -Exclude "node_modules" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $serverDest -Recurse -Force
}

# Xoa .env
if (Test-Path "$serverDest\.env") {
    Remove-Item "$serverDest\.env" -Force
}

Write-Host "  OK - server" -ForegroundColor Green

# Copy docs
Write-Host "Copy docs..." -ForegroundColor Yellow
Copy-Item -Path "docs" -Destination "$submissionFolder\1. Source\docs" -Recurse -Force
Write-Host "  OK - docs" -ForegroundColor Green

# Copy README
if (Test-Path "README.md") {
    Copy-Item -Path "README.md" -Destination "$submissionFolder\1. Source\" -Force
}

# Tao .env.example
Write-Host "Tao .env.example..." -ForegroundColor Yellow
$envContent = "MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key
PORT=8080
CLIENT_URL=http://localhost:5500"

$envContent | Out-File -FilePath "$submissionFolder\1. Source\server\.env.example" -Encoding UTF8
Write-Host "  OK - .env.example" -ForegroundColor Green

# Copy database scripts
Write-Host "Copy database scripts..." -ForegroundColor Yellow
$dbScripts = @("seed_data.js", "clear_data.js", "check_users.js", "reset_admin_password.js")
foreach ($script in $dbScripts) {
    if (Test-Path "server\$script") {
        Copy-Item -Path "server\$script" -Destination "$submissionFolder\2. Database\scripts\" -Force
    }
}
Write-Host "  OK - scripts" -ForegroundColor Green

# Tao Database README
$dbReadme = "# DATABASE - MONGODB ATLAS

Cac collection:
- users, posts, categories, messages
- transactions, savedposts, ratings
- vippackages, vipsubscriptions

Huong dan:
1. Tao MongoDB Atlas account
2. Tao cluster
3. Lay connection string
4. Paste vao file .env"

$dbReadme | Out-File -FilePath "$submissionFolder\2. Database\README.md" -Encoding UTF8

# Tao START_SERVER.bat
Write-Host "Tao START_SERVER.bat..." -ForegroundColor Yellow
$batContent = '@echo off
echo ========================================
echo   WEBSITE TRAO DOI DO CU
echo ========================================
cd /d "%~dp0..\1. Source\server"
call npm install
call npm start
pause'

$batContent | Out-File -FilePath "$submissionFolder\3. Executable\START_SERVER.bat" -Encoding ASCII
Write-Host "  OK - START_SERVER.bat" -ForegroundColor Green

# Tao Executable README
$execReadme = "# HUONG DAN CHAY

Yeu cau:
- Node.js >= 16.x
- MongoDB Atlas account

Cach chay:
1. Cai Node.js
2. Cau hinh .env
3. Double-click START_SERVER.bat
4. Mo index.html"

$execReadme | Out-File -FilePath "$submissionFolder\3. Executable\README.md" -Encoding UTF8

# Tao GitHub info
Write-Host "Tao GitHub info..." -ForegroundColor Yellow
$githubInfo = "Repository: cvinh-doanchuyennganh
Owner: Ji-Eung
Branch: master
URL: https://github.com/Ji-Eung/cvinh-doanchuyennganh

TODO: Dien thong tin cua ban
MSSV: [Dien MSSV]
Ho ten: [Dien ho ten]
Email: [Dien email]"

$githubInfo | Out-File -FilePath "$submissionFolder\4. GitHub\github_info.txt" -Encoding UTF8
Write-Host "  OK - github_info.txt" -ForegroundColor Green

# Copy bao cao
Write-Host "Copy bao cao..." -ForegroundColor Yellow
if (Test-Path "docs\DESIGN_PATTERNS_REPORT.md") {
    Copy-Item -Path "docs\DESIGN_PATTERNS_REPORT.md" -Destination "$submissionFolder\5. Doc\" -Force
}

$docNote = "Copy bao cao Word cua ban vao day!
Ten file: MSSV_HoTen_BaoCao.docx"

$docNote | Out-File -FilePath "$submissionFolder\5. Doc\LUU_Y.txt" -Encoding UTF8
Write-Host "  OK - Doc" -ForegroundColor Green

# Tao CHECKLIST
$checklist = "# CHECKLIST NOP BAI

1. Source - OK
2. Database - OK
3. Executable - OK
4. GitHub - Cap nhat thong tin!
5. Doc - Copy bao cao Word!

BUOC TIEP THEO:
1. Cap nhat 4. GitHub/github_info.txt
2. Copy bao cao Word vao 5. Doc/
3. Doi ten folder: MSSV_HoTen_WebsiteTraoDoiDoCu_MTK
4. Test chay START_SERVER.bat
5. Nen va nop bai!"

$checklist | Out-File -FilePath "$submissionFolder\CHECKLIST.txt" -Encoding UTF8

# Hoan tat
Write-Host ""
Write-Host "========================================"
Write-Host "  HOAN TAT!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "Folder: $submissionFolder" -ForegroundColor Yellow
Write-Host ""
Write-Host "Doc file: CHECKLIST.txt" -ForegroundColor Cyan
Write-Host ""

# Mo folder
Start-Process explorer.exe $submissionFolder

Write-Host "Nhan Enter de dong..."
Read-Host
