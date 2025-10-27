# Hướng dẫn triển khai lên domain thanhbinhdlu.id.vn

## 1. Chuẩn bị triển khai

### Trên máy chủ web:

1. Đảm bảo đã cài đặt:

   - Node.js (phiên bản 14 trở lên)
   - npm hoặc yarn
   - PM2 (để quản lý process Node.js)

   ```bash
   npm install -g pm2
   ```

2. Tạo thư mục cho ứng dụng:
   ```bash
   mkdir -p /var/www/thanhbinhdlu.id.vn
   ```

## 2. Triển khai ứng dụng

### Backend (Server):

1. Copy toàn bộ thư mục server lên máy chủ:

   ```bash
   scp -r server/* user@thanhbinhdlu.id.vn:/var/www/thanhbinhdlu.id.vn/server/
   ```

2. Cài đặt dependencies:

   ```bash
   cd /var/www/thanhbinhdlu.id.vn/server
   npm install --production
   ```

3. Copy file .env.production thành .env:

   ```bash
   cp .env.production .env
   ```

4. Khởi chạy server với PM2:
   ```bash
   pm2 start src/index.js --name "oldmarket-backend"
   ```

### Frontend (Client):

1. Copy toàn bộ thư mục client lên máy chủ:
   ```bash
   scp -r client/* user@thanhbinhdlu.id.vn:/var/www/thanhbinhdlu.id.vn/public/
   ```

## 3. Cấu hình Nginx

Tạo file cấu hình Nginx cho domain:

```nginx
server {
    listen 80;
    server_name thanhbinhdlu.id.vn;

    root /var/www/thanhbinhdlu.id.vn/public;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js server
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy WebSocket connections
    location /socket.io {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

4. Kiểm tra và khởi động lại Nginx:

```bash
nginx -t
systemctl restart nginx
```

## 4. Kiểm tra triển khai

1. Kiểm tra backend:

   ```bash
   pm2 status
   pm2 logs oldmarket-backend
   ```

2. Kiểm tra frontend bằng cách truy cập: http://thanhbinhdlu.id.vn

## 5. Xử lý sự cố

- Kiểm tra logs của Node.js:

  ```bash
  pm2 logs oldmarket-backend
  ```

- Kiểm tra logs của Nginx:
  ```bash
  tail -f /var/log/nginx/error.log
  ```

## 6. Backup và Rollback

1. Tạo backup trước khi cập nhật:

   ```bash
   tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/thanhbinhdlu.id.vn/
   ```

2. Để rollback:
   ```bash
   pm2 stop oldmarket-backend
   tar -xzf backup-[date].tar.gz -C /
   pm2 start oldmarket-backend
   ```
