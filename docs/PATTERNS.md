# Mẫu thiết kế (Design Patterns) trong dự án

Tài liệu này tổng hợp các mẫu thiết kế đang được áp dụng (Singleton, Decorator, Strategy), các chỉnh sửa nhỏ đã triển khai, và gợi ý mở rộng an toàn trong tương lai.

## Tổng quan nhanh

- Singleton (Module): gom trạng thái dùng chung vào một nơi, tránh nhiều bản thể trôi nổi.
- Strategy: ánh xạ “nhiều cách thực thi” theo khóa, thay chuỗi if/else dài, dễ mở rộng.
- Decorator (middleware): thêm/bớt chức năng chéo (logging, retry, cache, auth) mà không phải sửa các điểm gọi API.

## Đang sử dụng trong dự án

- Singleton
  - `client/js/api.js`:
    - `AuthManager`, `ApiService`, `Utils` được dùng như các module tĩnh (một bản thể), gắn lên `window` để tái sử dụng toàn site.
  - `server/src/index.js`:
    - Express app, Socket.IO server khởi tạo một lần và dùng chung. Kết nối Mongoose (`connectDB`) cũng hoạt động như một singleton kết nối.

- Strategy
  - `server/src/routes/posts.js`:
    - Chọn cách sắp xếp (sort) bằng Strategy map: `newest`, `oldest`, `price_low`, `price_high`, và mặc định. Mỗi strategy trả về một object sort cho MongoDB. Thêm chiến lược mới chỉ cần thêm một key.
  - `client/js/formatters.js`:
    - Gom quy tắc hiển thị thành hàm dùng chung: `getPriceLabel(loaiGia, gia)`, `getConditionText(tinhTrang)`, `getConditionBadgeClass(tinhTrang)`, `getLocation(post)`. Đã tích hợp tại `client/js/index.js` và `client/js/shop.js` để đồng bộ hiển thị.

- Decorator
  - `client/js/api.js`:
    - `ApiService` hỗ trợ pipeline middleware với 3 hook: `beforeRequest`, `afterResponse`, `onError`.
    - Có sẵn:
      - `TimingLogger()`: log thời gian API khi bật `window.DEBUG_API = true`.
      - Retry nội bộ: vòng lặp retry nhẹ trong `request` cho lỗi 429/502/503/504 (mặc định tối đa 2 lần, backoff tăng dần). Có thể cấu hình qua `retries`, `retryOn`, `backoffMs` khi gọi.
  - `client/js/decorators.js` (UI Decorators):
    - ProductDecorators: diễn giải và trang trí sản phẩm dựa trên `tags` và trạng thái.
      - Giảm giá: tag dạng `discount-XX` (ví dụ: `discount-20`) sẽ tính giá sau giảm và thêm badge.
      - Nổi bật: các tag `highlight | featured | sponsored` kích hoạt lớp `.product-highlight` và badge.
      - Đã xác minh: hiển thị badge nếu bài đăng đã được duyệt hoặc người bán đã xác minh.
    - UserDecorators: huy hiệu uy tín, người bán, đã xác minh người bán (đọc từ `user.daXacMinhNguoiBan`).
    - Đã tích hợp tại `client/js/index.js`, `client/js/shop.js`, `client/js/profile.js`.
  - `client/css/style.css`:
    - Thêm `.product-highlight` để nhấn mạnh sản phẩm nổi bật (viền nhấn, nền nhẹ).

## Tại sao phù hợp

- Singleton giúp tập trung token, BASE_URL, tiện ích… vào một nơi, đơn giản hóa quản lý trạng thái.
- Strategy làm rõ ý đồ “chọn một cách thực thi theo khóa”, dễ đọc, dễ mở rộng, giảm rủi ro lỗi.
- Decorator giúp thêm chức năng chéo (logging/ retry / cache / auth…) mà không “động chạm” code gọi API, giảm coupling.

## Cách bật log thời gian API

Trong Console của trình duyệt:

```js
window.DEBUG_API = true
```

Các request tiếp theo sẽ hiển thị log ⏱️ thời gian bắt đầu/kết thúc.

## Thêm một chiến lược sắp xếp (server)

Trong `server/src/routes/posts.js`, thêm key vào `sortStrategies`:

```js
rating_desc: () => ({ avgRating: -1, createdAt: -1 })
```

Khi gọi API: `?sortBy=rating_desc` sẽ áp dụng chiến lược mới.

## Ghi chú & giới hạn hiện tại

- Retry trong `ApiService` chỉ áp dụng cho các lỗi tạm thời (429/5xx) và lỗi mạng, nhằm tăng độ bền nhưng không thay đổi hành vi business.
- Endpoint `/api/auth/refresh` hiện yêu cầu token hợp lệ (đã xác thực), nên không thể dùng để tự làm mới khi 401 do token hết hạn. Nếu muốn refresh đúng chuẩn, cần bổ sung refresh token riêng ở backend (ví dụ: lưu HTTP-only cookie hoặc cặp access/refresh token với vòng đời khác nhau).

## Quy ước tags sản phẩm (để Decorators hoạt động)

- Giảm giá: `discount-<percent>` với `<percent>` là số nguyên từ 1–90, ví dụ: `discount-15`.
- Nổi bật: một trong các tag `highlight`, `featured`, hoặc `sponsored` (chuẩn hóa hiển thị theo `highlight`).
- Các tag này không thay đổi schema, linh hoạt mở rộng và được Decorators tự động nhận diện.

## Quản trị: cấu hình Giảm giá/Nổi bật qua Admin

- Giao diện: `client/admin/posts.html` + logic `client/js/admin-posts.js` thêm cột “Khuyến mãi/Nổi bật” với:
  - Input phần trăm giảm (0–90, bước 5) → ánh xạ thành tag `discount-XX` (tự loại bỏ tag giảm cũ trước khi gán mới).
  - Checkbox “Nổi bật” → thêm/bỏ tag `highlight` (đồng thời dọn các biến thể `featured/sponsored`).
- API: sử dụng `PUT /api/posts/:id` với payload `{ tags: [...] }` (đã cho phép admin cập nhật `tags` trong `server/src/routes/posts.js`).
- Tác động UI: Trang danh sách/trang chủ đọc tags và hiển thị giảm giá, badge, và lớp nổi bật qua `decorators.js` và `style.css`.

## Hướng mở rộng đề xuất

- Auth refresh đúng chuẩn
  - Backend: thêm cơ chế refresh token an toàn (HTTP-only cookie hoặc collection lưu refresh token có thể thu hồi), endpoint `/auth/refresh` không yêu cầu access token còn hạn, kèm kiểm tra IP/UA nếu cần.
  - Client: thêm `AuthRefreshMiddleware` thử refresh 1 lần khi `401` rồi tự retry request ban đầu; nếu vẫn thất bại thì logout.

- Đồng bộ hiển thị trên toàn site
  - Áp dụng `Formatters` cho các trang còn lại (ví dụ: `detail.js`, sản phẩm liên quan…) để quy tắc hiển thị thống nhất.

- Singleton cho kết nối DB
  - Tách một `server/src/db.js` xuất `getConnection()` để làm rõ vai trò singleton của kết nối database, thuận tiện test và tái sử dụng.

---

Tài liệu này là “sổ tay sống”. Khi mở rộng/điều chỉnh, hãy cập nhật mục tương ứng để đội ngũ nắm được bức tranh kiến trúc chung.