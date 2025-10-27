# API Documentation - Website Trao Đổi & Mua Bán Đồ Cũ

## Base URL

```
Development: http://localhost:8080
Production: https://api.volamchivinh.id.vn
```

## Authentication

Sử dụng JWT Bearer token trong header:

```
Authorization: Bearer <token>
```

## Response Format

```json
{
  "message": "Mô tả kết quả",
  "data": {},
  "pagination": {
    "current": 1,
    "pages": 5,
    "total": 50
  }
}
```

## Error Response

```json
{
  "message": "Mô tả lỗi",
  "code": "ERROR_CODE",
  "errors": []
}
```

---

## 🔐 Authentication APIs

### POST /api/auth/register

Đăng ký tài khoản mới

**Body:**

```json
{
  "hoTen": "Nguyen Van A",
  "email": "user@example.com",
  "matKhau": "123456",
  "soDienThoai": "0123456789",
  "diaChi": "TP.HCM"
}
```

**Response:**

```json
{
  "message": "Đăng ký thành công",
  "user": { ... },
  "token": "jwt_token_here"
}
```

### POST /api/auth/login

Đăng nhập

**Body:**

```json
{
  "email": "user@example.com",
  "matKhau": "123456"
}
```

### GET /api/auth/me

Lấy thông tin user hiện tại (cần token)

---

## 👤 User APIs

### GET /api/users

Lấy danh sách users (Admin only)

**Query params:**

- `page`: Trang (default: 1)
- `limit`: Số lượng/trang (default: 20)
- `search`: Tìm kiếm theo tên/email
- `trangThai`: active | inactive | blocked

### GET /api/users/:id

Lấy thông tin user theo ID

### PUT /api/users/:id

Cập nhật thông tin user

### GET /api/users/:id/posts

Lấy bài đăng của user

### GET /api/users/:id/ratings

Lấy đánh giá của user

---

## 📂 Category APIs

### GET /api/categories

Lấy danh sách danh mục

**Query params:**

- `includeStats`: true/false - Có đếm số bài đăng không

### POST /api/categories (Admin only)

Tạo danh mục mới

**Body:**

```json
{
  "tenDanhMuc": "Điện thoại",
  "moTa": "Các thiết bị di động",
  "icon": "fas fa-mobile-alt"
}
```

### PUT /api/categories/:id (Admin only)

Cập nhật danh mục

### DELETE /api/categories/:id (Admin only)

Xóa danh mục

---

## 📝 Post APIs

### GET /api/posts

Lấy danh sách bài đăng

**Query params:**

- `page`, `limit`: Phân trang
- `search`: Tìm kiếm theo tiêu đề, mô tả
- `danhMuc`: ID danh mục
- `minPrice`, `maxPrice`: Khoảng giá
- `loaiGia`: ban | trao-doi | cho-mien-phi
- `tinhTrang`: moi | nhu-moi | tot | can-sua-chua
- `diaDiem`: Địa điểm
- `sortBy`: createdAt | gia | luotXem
- `sortOrder`: asc | desc

### GET /api/posts/:id

Lấy chi tiết bài đăng

### POST /api/posts

Tạo bài đăng mới (cần token)

**Body:** multipart/form-data

- `tieuDe`: string (required)
- `moTa`: string (required)
- `gia`: number (required)
- `danhMuc`: ObjectId (required)
- `diaDiem`: string
- `loaiGia`: string
- `tinhTrang`: string
- `tags`: string (comma separated)
- `hinhAnh`: files[] (max 5 files, 5MB each)

### PUT /api/posts/:id

Cập nhật bài đăng (cần token, chỉ chủ bài đăng hoặc admin)

### DELETE /api/posts/:id

Xóa bài đăng (cần token, chỉ chủ bài đăng hoặc admin)

### POST /api/posts/:id/save

Lưu/Bỏ lưu bài đăng (cần token)

### GET /api/posts/saved/me

Lấy danh sách bài đăng đã lưu (cần token)

### PATCH /api/posts/:id/approve (Admin only)

Duyệt bài đăng

### PATCH /api/posts/:id/reject (Admin only)

Từ chối bài đăng

**Body:**

```json
{
  "lyDoTuChoi": "Bài đăng vi phạm quy định"
}
```

---

## 💬 Message APIs

### GET /api/messages/conversations

Lấy danh sách cuộc trò chuyện (cần token)

### GET /api/messages/:otherUserId

Lấy tin nhắn với user khác (cần token)

**Query params:**

- `page`, `limit`: Phân trang

### POST /api/messages/send

Gửi tin nhắn (cần token)

**Body:**

```json
{
  "nguoiNhan": "ObjectId",
  "noiDung": "Nội dung tin nhắn",
  "baiDangLienQuan": "ObjectId" // optional
}
```

### GET /api/messages/unread/count

Đếm số tin nhắn chưa đọc (cần token)

### PATCH /api/messages/mark-read/:otherUserId

Đánh dấu tin nhắn đã đọc (cần token)

### DELETE /api/messages/:messageId

Xóa tin nhắn (cần token, chỉ người gửi)

---

## 🔄 Transaction APIs

### GET /api/transactions

Lấy danh sách giao dịch của user (cần token)

**Query params:**

- `page`, `limit`: Phân trang
- `type`: all | selling | buying
- `trangThai`: dang-thoa-thuan | da-dong-y | hoan-thanh | huy-bo

### GET /api/transactions/:id

Lấy chi tiết giao dịch (cần token)

### POST /api/transactions

Tạo giao dịch mới - người mua tạo (cần token)

**Body:**

```json
{
  "baiDang": "ObjectId",
  "giaThanhToan": 1000000,
  "phuongThucThanhToan": "tien-mat",
  "diaDiemGiaoDich": "Địa điểm gặp mặt",
  "thoiGianGiaoDich": "2024-12-01T10:00:00Z",
  "ghiChu": "Ghi chú thêm"
}
```

### PATCH /api/transactions/:id/accept

Chấp nhận giao dịch - người bán (cần token)

### PATCH /api/transactions/:id/complete

Hoàn thành giao dịch (cần token)

### PATCH /api/transactions/:id/cancel

Hủy giao dịch (cần token)

**Body:**

```json
{
  "lyDoHuy": "Lý do hủy giao dịch"
}
```

### PUT /api/transactions/:id

Cập nhật thông tin giao dịch (cần token)

---

## ⭐ Rating APIs

### GET /api/ratings

Lấy danh sách đánh giá

**Query params:**

- `page`, `limit`: Phân trang
- `userId`: Lọc theo user được đánh giá
- `minStars`, `maxStars`: Khoảng số sao
- `sortBy`: createdAt | soSao
- `sortOrder`: asc | desc

### GET /api/ratings/:id

Lấy chi tiết đánh giá

### POST /api/ratings

Tạo đánh giá mới (cần token)

**Body:**

```json
{
  "denNguoiDung": "ObjectId",
  "giaoDich": "ObjectId",
  "soSao": 5,
  "binhLuan": "Người bán uy tín, giao hàng nhanh"
}
```

### PUT /api/ratings/:id

Cập nhật đánh giá (cần token, chỉ người tạo)

### DELETE /api/ratings/:id

Xóa đánh giá (cần token, chỉ người tạo hoặc admin)

### GET /api/ratings/stats/:userId

Thống kê đánh giá của user

### GET /api/ratings/can-rate/:transactionId

Kiểm tra có thể đánh giá giao dịch không (cần token)

---

## 🔌 WebSocket Events

### Connection

```javascript
const socket = io("http://localhost:8080", {
  auth: {
    token: "your_jwt_token",
  },
});
```

### Events

#### Client → Server

- `send_message`: Gửi tin nhắn

  ```json
  {
    "receiverId": "ObjectId",
    "content": "Tin nhắn",
    "postId": "ObjectId", // optional
    "tempId": "temp_id" // optional
  }
  ```

- `mark_messages_read`: Đánh dấu tin nhắn đã đọc

  ```json
  {
    "senderId": "ObjectId"
  }
  ```

- `typing_start`: Bắt đầu gõ
- `typing_stop`: Ngừng gõ

#### Server → Client

- `new_message`: Tin nhắn mới
- `message_sent`: Xác nhận tin nhắn đã gửi
- `messages_read`: Tin nhắn đã được đọc
- `user_typing`: User đang gõ
- `user_stop_typing`: User ngừng gõ
- `user_status`: Trạng thái online/offline
- `notification`: Thông báo hệ thống
- `error`: Lỗi

---

## 📊 HTTP Status Codes

- `200`: Thành công
- `201`: Tạo mới thành công
- `400`: Dữ liệu không hợp lệ
- `401`: Chưa xác thực
- `403`: Không có quyền
- `404`: Không tìm thấy
- `500`: Lỗi server

## 🔑 Error Codes

- `NO_TOKEN`: Thiếu token
- `INVALID_TOKEN`: Token không hợp lệ
- `TOKEN_EXPIRED`: Token hết hạn
- `FORBIDDEN`: Không có quyền
- `EMAIL_EXISTS`: Email đã tồn tại
- `INVALID_CREDENTIALS`: Sai email/mật khẩu
- `USER_NOT_FOUND`: Không tìm thấy user
- `POST_NOT_FOUND`: Không tìm thấy bài đăng
- `TRANSACTION_NOT_FOUND`: Không tìm thấy giao dịch
- `ALREADY_RATED`: Đã đánh giá
