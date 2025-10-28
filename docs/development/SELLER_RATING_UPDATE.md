# Cập Nhật Hệ Thống Đánh Giá Người Bán

## Tổng Quan

Đã chuyển đổi hệ thống đánh giá từ **"Đánh Giá Sản Phẩm"** sang **"Đánh Giá Người Bán"** với cập nhật realtime cho số sao và số lượng đánh giá.

## Thay Đổi Chi Tiết

### 1. Frontend - HTML (client/detail.html)

#### Cập Nhật Text & Label
```html
<!-- BEFORE -->
<h4 class="mb-4">Đánh giá sản phẩm</h4>
<h4 class="mb-4">Viết Đánh Giá</h4>
<small>Địa chỉ email của bạn sẽ không được công khai...</small>
<textarea placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."></textarea>

<!-- AFTER -->
<h4 class="mb-4">Đánh giá người bán</h4>
<h4 class="mb-4">Viết Đánh Giá Cho Người Bán</h4>
<small>Chia sẻ trải nghiệm của bạn khi giao dịch với người bán này...</small>
<textarea placeholder="Chia sẻ trải nghiệm giao dịch của bạn với người bán này..."></textarea>
```

### 2. Backend - API Endpoint (server/src/routes/users.js)

#### Thêm POST /api/users/:id/ratings
Endpoint mới để đánh giá người bán **không cần transaction ID** (khác với `/api/ratings` yêu cầu giaoDich).

**Request:**
```javascript
POST /api/users/:sellerId/ratings
Headers: { Authorization: "Bearer <token>" }
Body: {
  diemDanhGia: 5,       // 1-5 stars (required)
  nhanXet: "string"     // Comment (optional)
}
```

**Response (201):**
```javascript
{
  message: "Đánh giá người bán thành công",
  rating: {
    _id: "...",
    tuNguoiDung: { hoTen, avatar },
    diemDanhGia: 5,
    nhanXet: "...",
    ngayDanhGia: "2025-10-24T..."
  },
  seller: {
    _id: "...",
    hoTen: "...",
    diemUyTin: 4.8,        // Cập nhật realtime
    soLuotDanhGia: 15       // Cập nhật realtime
  }
}
```

**Validations:**
- ✅ Điểm đánh giá phải từ 1-5
- ✅ Không thể tự đánh giá chính mình
- ✅ Người bán phải tồn tại

**Logic Cập Nhật Realtime:**
```javascript
// 1. Tạo rating mới
const rating = new Rating({
  tuNguoiDung: buyerId,
  denNguoiDung: sellerId,
  soSao: diemDanhGia,
  binhLuan: nhanXet,
  loaiDanhGia: "nguoi-ban"
});
await rating.save();

// 2. Tính lại điểm trung bình từ TẤT CẢ ratings của seller
const allRatings = await Rating.find({ denNguoiDung: sellerId });
const totalStars = allRatings.reduce((sum, r) => sum + r.soSao, 0);
const avgRating = totalStars / allRatings.length;

// 3. Cập nhật User model
seller.diemUyTin = Math.round(avgRating * 10) / 10; // Round to 1 decimal
seller.soLuotDanhGia = allRatings.length;
await seller.save();
```

### 3. Frontend - JavaScript (client/js/detail.js)

#### A. Cập Nhật loadReviews()
**BEFORE:** Load từ `/posts/:id/ratings` (đánh giá sản phẩm)
**AFTER:** Load từ `/users/:sellerId/ratings` (đánh giá người bán)

```javascript
async function loadReviews(postId) {
  try {
    if (!currentPost?.nguoiDang?._id) return;

    const sellerId = currentPost.nguoiDang._id;
    const response = await ApiService.get(`/users/${sellerId}/ratings`);
    const reviews = response.ratings || [];

    displayReviews(reviews);
  } catch (error) {
    // Show empty state
  }
}
```

#### B. Cập Nhật displayReviews()
Thay đổi field names để khớp với Rating model:

| Old Field | New Field |
|-----------|-----------|
| `review.nguoiDanhGia` | `review.tuNguoiDung` |
| `review.diemDanhGia` | `review.soSao` hoặc `review.diemDanhGia` |
| `review.binhLuan` | `review.binhLuan` hoặc `review.nhanXet` |
| `review.ngayDanhGia` | `review.createdAt` hoặc `review.ngayDanhGia` |

```javascript
reviews.forEach((review) => {
  const stars = generateStarsHTML(review.soSao || review.diemDanhGia || 0);
  const avatar = review.tuNguoiDung?.avatar || /* fallback */;
  const userName = review.tuNguoiDung?.hoTen || 'Người dùng';
  const comment = review.binhLuan || review.nhanXet || '';
  // ...render HTML
});
```

#### C. Cập Nhật handleSubmitReview()
**BEFORE:**
```javascript
// Submit to /posts/:postId/ratings
const reviewData = { diemDanhGia, binhLuan };
await ApiService.post(`/posts/${currentPost._id}/ratings`, reviewData);
```

**AFTER:**
```javascript
// Validation: không thể tự đánh giá
if (currentPost.nguoiDang._id === currentUser._id) {
  Utils.showToast("Bạn không thể đánh giá chính mình", "warning");
  return;
}

// Submit to /users/:sellerId/ratings
const reviewData = { diemDanhGia, nhanXet };
await ApiService.post(`/users/${currentPost.nguoiDang._id}/ratings`, reviewData);

// Reload reviews
await loadReviews(currentPost._id);

// ⭐ REALTIME UPDATE: Reload seller rating stats
await reloadSellerRating();
```

#### D. Thêm reloadSellerRating() - Realtime Update
Function mới để cập nhật số sao/số lượng đánh giá ngay sau khi submit:

```javascript
async function reloadSellerRating() {
  try {
    // Fetch updated seller info
    const response = await ApiService.get(`/users/${currentPost.nguoiDang._id}`);
    const updatedSeller = response.user || response.data;

    // Update currentPost with new data
    currentPost.nguoiDang = updatedSeller;

    // Re-render seller info with new rating/count
    updateSellerInfo(currentPost);

    console.log('✅ Seller rating updated realtime');
  } catch (error) {
    console.error("Error reloading seller rating:", error);
  }
}
```

#### E. Cập Nhật updateSellerInfo()
Hiển thị `soLuotDanhGia` thay vì `tongSoDanhGia`:

```javascript
const totalReviews = seller.soLuotDanhGia || seller.tongSoDanhGia || 0;
sellerRatingElement.innerHTML = `
  <strong>Đánh giá người bán:</strong>
  <div>${stars} <small>(${totalReviews} đánh giá)</small></div>
`;
```

## User Model Fields

| Field | Type | Description |
|-------|------|-------------|
| `diemUyTin` | Number (0-5) | Điểm trung bình từ tất cả ratings |
| `soLuotDanhGia` | Number | Tổng số lượt đánh giá nhận được |

## Rating Model Fields

| Field | Type | Description |
|-------|------|-------------|
| `tuNguoiDung` | ObjectId (User) | Người đánh giá |
| `denNguoiDung` | ObjectId (User) | Người được đánh giá |
| `soSao` | Number (1-5) | Số sao đánh giá |
| `binhLuan` | String | Nhận xét văn bản |
| `loaiDanhGia` | String | "nguoi-ban" / "nguoi-mua" |
| `giaoDich` | ObjectId (Transaction) | Optional |

## Flow Đánh Giá Người Bán

```
User A xem sản phẩm của User B (seller)
  ↓
Scroll xuống tab "Đánh giá người bán"
  ↓
Click vào số sao (1-5)
  ↓
Nhập nhận xét (optional)
  ↓
Click "Gửi Đánh Giá"
  ↓
Validation:
  - Đã login?
  - Không phải người bán?
  - Số sao hợp lệ?
  ↓
POST /users/:sellerId/ratings { diemDanhGia, nhanXet }
  ↓
Backend:
  1. Tạo Rating document mới
  2. Tính lại avgRating từ tất cả ratings
  3. Cập nhật seller.diemUyTin và seller.soLuotDanhGia
  4. Return updated seller data
  ↓
Frontend:
  1. Show toast "Đánh giá thành công"
  2. Reset form
  3. Reload reviews list → hiện rating mới ở đầu
  4. Reload seller info → cập nhật số sao/số lượng (REALTIME)
  5. Auto-scroll đến reviews section
```

## Realtime Update Flow

```
User gửi đánh giá
  ↓
handleSubmitReview()
  ↓
POST /users/:sellerId/ratings
  ↓ (Backend tự động tính lại)
Backend update:
  - seller.diemUyTin (avg rating)
  - seller.soLuotDanhGia (count)
  ↓
Frontend:
  await loadReviews() → Hiển thị review mới
  await reloadSellerRating() → GET /users/:sellerId
  ↓
updateSellerInfo(updatedSeller)
  ↓
✅ Seller rating section cập nhật realtime:
  "⭐⭐⭐⭐⭐ (15 đánh giá)" → "⭐⭐⭐⭐☆ (16 đánh giá)"
```

## Testing Checklist

- [ ] Xem trang detail → Tab "Đánh giá người bán" hiển thị đúng
- [ ] Người chưa login → Click đánh giá → Yêu cầu đăng nhập
- [ ] Người bán tự đánh giá → Show error "Không thể tự đánh giá"
- [ ] Đánh giá thành công → Toast xuất hiện
- [ ] Review mới hiển thị ở đầu danh sách
- [ ] Số sao và số lượng đánh giá cập nhật ngay lập tức (không cần refresh)
- [ ] Form reset sau khi gửi
- [ ] Auto-scroll đến phần reviews
- [ ] Avatar/tên người đánh giá hiển thị đúng
- [ ] Format ngày giờ đúng (Utils.formatDateTime)

## Lợi Ích

✅ **UX tốt hơn:** Người dùng đánh giá uy tín của người bán, không phải sản phẩm cụ thể
✅ **Realtime:** Điểm uy tín cập nhật ngay sau khi gửi đánh giá
✅ **Không cần Transaction:** Có thể đánh giá ngay khi xem sản phẩm (tương lai có thể thêm validation yêu cầu có giao dịch)
✅ **Tích lũy uy tín:** Seller có profile rating xuyên suốt tất cả sản phẩm

## Notes

- API `/api/ratings` (cần giaoDich) vẫn tồn tại cho đánh giá sau giao dịch hoàn thành
- API `/api/users/:id/ratings` (POST) mới này dùng cho đánh giá trực tiếp từ detail page
- Frontend tương thích với cả 2 format: `soSao`/`diemDanhGia`, `binhLuan`/`nhanXet`
- User model dùng `soLuotDanhGia` (không phải `tongSoDanhGia`)
