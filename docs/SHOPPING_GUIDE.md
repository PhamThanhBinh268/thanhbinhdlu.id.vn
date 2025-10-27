# Hướng Dẫn Sử Dụng Tính Năng Mua Bán

## 🛍️ Flow Hoàn Chỉnh: Shop → Detail → Checkout

### 1. 📋 **Trang Shop (shop.html)**
- Hiển thị danh sách tất cả sản phẩm
- Click vào **bất kỳ sản phẩm nào** để xem chi tiết
- Có các nút action:
  - 👁️ **Xem chi tiết**
  - ❤️ **Lưu sản phẩm**
  - 💬 **Chat với người bán**

### 2. 🔍 **Trang Chi Tiết (detail.html)**
- Hiển thị đầy đủ thông tin sản phẩm:
  - Hình ảnh (có thể xem nhiều ảnh)
  - Tiêu đề, giá, mô tả
  - Tình trạng, danh mục, địa điểm
  - Thông tin người bán
- **Nút "Mua Ngay"** màu xanh nổi bật
- Các nút khác: Liên hệ, Đề xuất, Lưu

### 3. 💳 **Trang Thanh Toán (checkout.html)**
- Tự động load thông tin sản phẩm từ detail
- Điền thông tin giao hàng
- Chọn phương thức thanh toán
- Nút "Đặt Hàng" để hoàn tất

## 🚀 **Cách Test Tính Năng**

### Bước 1: Tạo Sản Phẩm
1. Mở `create-post.html`
2. Đăng nhập (nếu chưa)
3. Điền form đăng bài:
   - Tiêu đề: "iPhone 12 Pro Max còn mới"
   - Chọn danh mục: "Đồ Điện Tử"
   - Giá: 15000000
   - Mô tả chi tiết
   - Upload ít nhất 1 ảnh
4. Nhấn "Đăng Bài"

### Bước 2: Xem Sản Phẩm
1. Mở `shop.html`
2. Tìm sản phẩm vừa tạo
3. **Click vào sản phẩm** để xem chi tiết

### Bước 3: Mua Sản Phẩm
1. Ở trang detail, nhấn **"Mua Ngay"** (nút xanh)
2. Sẽ chuyển đến trang checkout
3. Thông tin sản phẩm tự động hiển thị
4. Điền thông tin giao hàng
5. Chọn phương thức thanh toán
6. Nhấn "Đặt Hàng"

## ✅ **Tính Năng Đã Hoàn Thành**

### Frontend
- ✅ Trang chi tiết sản phẩm với đầy đủ thông tin
- ✅ Nút "Mua Ngay" chức năng đầy đủ
- ✅ Trang thanh toán với form hoàn chỉnh
- ✅ Navigation giữa các trang
- ✅ Validation form đầy đủ
- ✅ Responsive design

### Logic Xử Lý
- ✅ Load thông tin sản phẩm từ API
- ✅ Kiểm tra đăng nhập trước khi mua
- ✅ Kiểm tra quyền mua (không mua hàng của chính mình)
- ✅ Kiểm tra loại giao dịch (chỉ mua được nếu hỗ trợ bán)
- ✅ Truyền dữ liệu giữa các trang qua localStorage
- ✅ Tự động điền thông tin người dùng

### Error Handling
- ✅ Thông báo lỗi rõ ràng
- ✅ Redirect an toàn khi có lỗi
- ✅ Validate form trước khi submit
- ✅ Loading states

## 🎯 **Test Cases**

### Case 1: Mua hàng thành công ✅
- Đăng nhập ✅
- Sản phẩm hỗ trợ bán ✅
- Không phải sản phẩm của mình ✅
- Điền đầy đủ thông tin ✅
- → **Kết quả: Đặt hàng thành công**

### Case 2: Chưa đăng nhập ❌
- → **Chuyển đến trang login**

### Case 3: Mua sản phẩm của chính mình ❌
- → **Thông báo: "Không thể mua sản phẩm của chính mình"**

### Case 4: Sản phẩm chỉ trao đổi ❌
- → **Thông báo: "Sản phẩm này chỉ hỗ trợ trao đổi"**

### Case 5: Thiếu thông tin thanh toán ❌
- → **Highlight các field bắt buộc và thông báo lỗi**

## 🔧 **Cấu Hình Cần Thiết**

### HTML Files
- ✅ `shop.html` - Trang danh sách sản phẩm
- ✅ `detail.html` - Trang chi tiết sản phẩm  
- ✅ `checkout.html` - Trang thanh toán

### JavaScript Files
- ✅ `js/shop.js` - Logic trang shop
- ✅ `js/detail.js` - Logic trang chi tiết + nút mua
- ✅ `js/checkout.js` - Logic trang thanh toán
- ✅ `js/api.js` - API utilities
- ✅ `js/layout.js` - Header/Footer shared

### CSS
- ✅ Sử dụng Bootstrap classes có sẵn
- ✅ Custom styles cho product cards
- ✅ Responsive design

## 🎉 **Kết Luận**

Tính năng **"Xem sản phẩm → Mua ngay → Thanh toán"** đã được tích hợp hoàn chỉnh với:

- **UX/UI mượt mà**: Click sản phẩm → Xem chi tiết → Mua ngay → Thanh toán
- **Validation đầy đủ**: Kiểm tra đăng nhập, quyền mua, thông tin form
- **Error handling tốt**: Thông báo lỗi rõ ràng, redirect an toàn
- **Responsive**: Hoạt động tốt trên mọi thiết bị
- **Integration**: Kết nối với hệ thống authentication và API

Bạn có thể test ngay bằng cách:
1. Tạo 1 sản phẩm ở `create-post.html`
2. Xem ở `shop.html` 
3. Click vào sản phẩm
4. Nhấn "Mua Ngay"
5. Hoàn tất thanh toán

🚀 **Happy Shopping!**