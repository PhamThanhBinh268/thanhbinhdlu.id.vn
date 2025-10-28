# Debug Hướng Dẫn - Tính Năng Đăng Bài

## 🔍 Cách Kiểm Tra Lỗi Đăng Bài

### Bước 1: Mở Developer Tools
1. Mở trang `create-post.html` trong browser
2. Nhấn `F12` hoặc `Ctrl+Shift+I` để mở Developer Tools
3. Chuyển đến tab **Console**

### Bước 2: Thử Đăng Bài
1. Điền đầy đủ thông tin form:
   - **Tiêu đề**: Ít nhất 10 ký tự
   - **Danh mục**: Chọn một danh mục
   - **Giá**: Ít nhất 1.000 VNĐ
   - **Mô tả**: Ít nhất 20 ký tự
   - **Hình ảnh**: Chọn ít nhất 1 file ảnh
2. Nhấn nút **Đăng Bài**
3. Quan sát messages trong Console

### Bước 3: Phân Tích Log Messages

#### ✅ **Khi Server Đang Chạy:**
```
🔧 Initializing create post page...
🔍 Testing API connectivity...
🌐 Server response status: 200
✅ Server is running
🔄 Đang tải danh mục từ API...
📥 API response: {categories: [...]}
✅ Đã load X danh mục từ API
🚀 Bắt đầu đăng bài...
✅ Validating form...
✅ Form validation passed
✅ User is logged in
📝 Preparing form data...
📤 Sending request to server...
✅ Response received: {data: {...}}
```

#### ❌ **Khi Server Chưa Chạy:**
```
❌ API connectivity test failed: TypeError: Failed to fetch
⚠️ Không thể kết nối đến server
🔄 Giữ nguyên danh mục mặc định từ HTML...
🚀 Bắt đầu đăng bài...
❌ API failed, trying fallback method...
✅ Post saved to localStorage: {...}
```

### Bước 4: Các Vấn đề Thường Gặp

#### 🔴 **Lỗi: "Form validation failed"**
- **Nguyên nhân**: Thiếu thông tin bắt buộc
- **Giải pháp**: Kiểm tra các trường required:
  - Tiêu đề >= 10 ký tự
  - Chọn danh mục
  - Giá >= 1.000 VNĐ
  - Mô tả >= 20 ký tự
  - Chọn ít nhất 1 ảnh

#### 🔴 **Lỗi: "Bạn cần đăng nhập để đăng bài"**
- **Nguyên nhân**: Chưa đăng nhập
- **Giải pháp**: Đi đến `login.html` để đăng nhập trước

#### 🔴 **Lỗi: "Failed to fetch"**
- **Nguyên nhân**: Server chưa chạy
- **Giải pháp**: 
  1. Khởi động server backend
  2. Hoặc sử dụng chế độ demo (tự động lưu vào localStorage)

#### 🔴 **Lỗi: "Upload failed"**
- **Nguyên nhân**: 
  - File ảnh quá lớn (>5MB)
  - Format file không hỗ trợ
  - Server lỗi
- **Giải pháp**:
  - Chọn ảnh < 5MB
  - Chỉ chọn file ảnh (jpg, png, gif, etc.)

### Bước 5: Chế Độ Demo

Nếu server chưa chạy, trang sẽ tự động chuyển sang **chế độ demo**:
- Dữ liệu được lưu vào `localStorage`
- Hiển thị thông báo "chế độ demo"
- Form sẽ được reset sau khi submit thành công

#### Kiểm tra dữ liệu demo:
```javascript
// Trong Console, gõ:
console.log(JSON.parse(localStorage.getItem('demo_posts') || '[]'));
```

### Bước 6: Khởi Động Server (Nếu Cần)

Nếu muốn sử dụng đầy đủ tính năng:
1. Mở terminal trong thư mục `server`
2. Chạy: `npm install`
3. Chạy: `npm start`
4. Server sẽ chạy tại `http://localhost:8080`

## 📋 Checklist Debug

- [ ] Mở Developer Tools Console
- [ ] Điền đầy đủ form với thông tin hợp lệ
- [ ] Kiểm tra log messages khi submit
- [ ] Xác định server có chạy không
- [ ] Thử chế độ demo nếu server chưa chạy
- [ ] Kiểm tra localStorage cho dữ liệu demo

## 🚀 Kết Luận

Tính năng đăng bài hiện đã có:
1. **Validation đầy đủ** cho tất cả trường
2. **Fallback tự động** khi server chưa chạy
3. **Debug logging chi tiết** để tìm lỗi
4. **Chế độ demo** để test giao diện

Ngay cả khi server chưa chạy, bạn vẫn có thể test đầy đủ chức năng!