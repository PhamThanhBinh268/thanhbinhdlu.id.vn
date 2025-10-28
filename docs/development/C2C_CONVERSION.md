# Chuyển Đổi Sang Mô Hình C2C (Consumer-to-Consumer)

## Tổng Quan

Website đã được chuyển đổi từ mô hình B2C (có giỏ hàng tập trung) sang mô hình C2C (giao dịch 1-1 trực tiếp giữa người mua và người bán).

## Thay Đổi Đã Thực Hiện ✅

### 1. Frontend - Header
**File: `client/partials/header.html`**
- ✅ Xóa icon giỏ hàng (`cart-link`) và badge số lượng
- ✅ Giữ lại: Đăng Tin, Tin Nhắn, Profile, Login/Signup buttons

### 2. Frontend - Detail Page
**File: `client/detail.html`**
- ✅ Thay đổi cấu trúc buttons:
  - Xóa: "Mua Ngay", "Liên Hệ Người Bán", "Đưa Ra Đề Xuất"
  - Thêm: "Gửi Đề Nghị" (primary, dynamic), "Nhắn Tin Trực Tiếp", "Lưu", "Báo Cáo"

**File: `client/js/detail.js`**
- ✅ Xóa functions: `addToCart()`, `handleBuyNow()`, `handleMakeOffer()`, `submitOffer()`
- ✅ Thêm handlers mới:
  - `handlePrimaryAction()`: Route dựa trên loaiGia (ban/trao-doi/cho-mien-phi)
  - `handleSendBuyProposal()`: Xử lý đề nghị mua
  - `handleProposeSwap()`: Xử lý đề nghị trao đổi
  - `handleRequestFree()`: Xử lý nhận miễn phí
- ✅ Thêm modal functions:
  - `showBuyProposalModal()`: Modal đề nghị mua (giá đề xuất + lời nhắn)
  - `showSwapProposalModal()`: Modal trao đổi (chọn sản phẩm + tiền bù + lời nhắn)
  - `showFreeRequestModal()`: Modal nhận miễn phí (lời nhắn)
  - `loadMyProductsForSwap()`: Load danh sách sản phẩm của người dùng để trao đổi
- ✅ Thêm submit functions:
  - `submitBuyProposal()`: Gửi đề nghị mua
  - `submitSwapProposal()`: Gửi đề nghị trao đổi
  - `submitFreeRequest()`: Gửi yêu cầu nhận miễn phí
- ✅ Cập nhật `updateActionButtons(post)`: Thay đổi text/icon/class dựa trên `post.loaiGia`

### 3. Button Logic - Dynamic theo loaiGia

| loaiGia | Button Text | Button Class | Icon | Handler |
|---------|-------------|--------------|------|---------|
| `ban` | "Gửi Đề Nghị Mua" | `btn-success` | `fa-paper-plane` | `handleSendBuyProposal()` |
| `trao-doi` | "Đề Nghị Trao Đổi" | `btn-warning` | `fa-exchange-alt` | `handleProposeSwap()` |
| `cho-mien-phi` | "Nhận Miễn Phí" | `btn-success` | `fa-gift` | `handleRequestFree()` |

## Chưa Hoàn Thành ⏳

### 4. Backend - Transaction Model
**File: `server/src/models/Transaction.js`**
- ⏳ Cần thêm fields:
  ```javascript
  type: { 
    type: String, 
    enum: ['buy', 'swap', 'free'], 
    required: true 
  },
  productA: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post',
    required: true 
  }, // Seller's product
  productB: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post' 
  }, // Buyer's product (for swap)
  priceDifference: { 
    type: Number, 
    default: 0 
  }, // Cash difference for swap
  offerPrice: { 
    type: Number 
  }, // Proposed price for buy
  swapStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'counter'], 
    default: 'pending' 
  },
  message: { 
    type: String 
  } // User's message
  ```

### 5. Backend - Transaction API
**File: `server/src/routes/transactions.js`**
- ⏳ Cần tạo endpoints:
  - `POST /transactions/propose-buy` - Gửi đề nghị mua
    ```javascript
    Body: { postId, offerPrice, message }
    ```
  - `POST /transactions/propose-swap` - Gửi đề nghị trao đổi
    ```javascript
    Body: { productA, productB, priceDifference, message }
    ```
  - `POST /transactions/request-free` - Gửi yêu cầu nhận miễn phí
    ```javascript
    Body: { postId, message }
    ```
  - `GET /transactions/my-proposals?role=buyer|seller&status=pending|approved|rejected` - Xem proposals của tôi
  - `PUT /transactions/:id/approve` - Chấp nhận proposal
  - `PUT /transactions/:id/reject` - Từ chối proposal
  - `PUT /transactions/:id/counter` - Đề xuất ngược lại

### 6. Frontend - Remove Cart Logic
**Files: `client/js/layout.js`, `client/js/index.js`, `client/js/shop.js`**
- ⏳ Xóa:
  - Cart badge update logic
  - `cart:updated` event listeners
  - localStorage cart operations
  - `updateCartBadge()` functions

### 7. Frontend - Delete/Repurpose Cart & Checkout
**Files to Delete:**
- ⏳ `client/cart.html`
- ⏳ `client/js/cart.js`

**Files to Repurpose:**
- ⏳ `client/checkout.html` → Rename to `transactions.html` (My Transactions page)
- ⏳ `client/js/checkout.js` → Rename to `transactions.js` (view/manage proposals)

## Flow Giao Dịch Mới

### 1. Mua Trực Tiếp (loaiGia: 'ban')
```
User A xem sản phẩm của User B
  ↓
Click "Gửi Đề Nghị Mua"
  ↓
Modal hiện ra: nhập giá đề xuất + lời nhắn
  ↓
Submit → POST /transactions/propose-buy
  ↓
Tạo Transaction { type: 'buy', productA, offerPrice, nguoiMua, nguoiBan, status: 'pending' }
  ↓
Redirect to messages.html để thảo luận
  ↓
User B approve/reject/counter via Transaction API
  ↓
Hoàn thành giao dịch
```

### 2. Trao Đổi (loaiGia: 'trao-doi')
```
User A xem sản phẩm X của User B
  ↓
Click "Đề Nghị Trao Đổi"
  ↓
Modal hiện ra:
  - Hiển thị sản phẩm X của User B
  - Load danh sách sản phẩm của User A (GET /posts?nguoiDang=A&trangThai=approved)
  - User A chọn sản phẩm Y
  - Nhập tiền bù (nếu có)
  - Nhập lời nhắn
  ↓
Submit → POST /transactions/propose-swap
  ↓
Tạo Transaction { type: 'swap', productA: X, productB: Y, priceDifference, nguoiMua: A, nguoiBan: B, swapStatus: 'pending' }
  ↓
Socket emit 'transaction:new' → User B nhận thông báo
  ↓
User B vào transactions.html → Xem proposal → Approve/Reject/Counter
  ↓
Nếu approved → Thảo luận qua messages về giao nhận
  ↓
Hoàn thành trao đổi
```

### 3. Nhận Miễn Phí (loaiGia: 'cho-mien-phi')
```
User A xem sản phẩm miễn phí của User B
  ↓
Click "Nhận Miễn Phí"
  ↓
Modal hiện ra: nhập lời nhắn (giải thích lý do muốn nhận)
  ↓
Submit → POST /transactions/request-free
  ↓
Tạo Transaction { type: 'free', productA, nguoiMua: A, nguoiBan: B, status: 'pending' }
  ↓
User B xem và approve/reject
  ↓
Thảo luận qua messages về giao nhận
```

## Tính Năng Mới Swap Proposal

### Modal Swap - Features
1. **Left Panel**: Hiển thị sản phẩm của người bán (currentPost)
   - Ảnh, tiêu đề, mô tả
2. **Right Panel**: Danh sách sản phẩm của người mua
   - Load từ API: `/posts?nguoiDang=currentUser&trangThai=approved`
   - Selectable list (click to select)
   - Hiển thị ảnh, tiêu đề, giá của mỗi sản phẩm
   - Check icon khi được chọn
3. **Price Difference Input**: Nhập số tiền bù (VNĐ)
4. **Message Textarea**: Lời nhắn cho người bán

### Submit Logic
- Validate: Phải chọn sản phẩm
- POST data:
  ```javascript
  {
    productA: currentPost._id, // Seller's product
    productB: selectedProductId, // Buyer's product
    type: 'swap',
    priceDifference: parseFloat(priceDifference),
    message: message
  }
  ```
- TODO: Uncomment API call khi backend ready
- Hiện tại: Show toast và redirect to messages

## TODO List Tiếp Theo

1. **Cập nhật Transaction Model** (Backend)
   - Thêm fields cho swap/buy/free proposals
   - Validation logic

2. **Tạo Transaction API** (Backend)
   - CRUD endpoints cho proposals
   - Approve/reject/counter logic
   - Query filter (role, status)

3. **Xóa Cart Logic** (Frontend)
   - layout.js, index.js, shop.js
   - Remove cart badge, localStorage

4. **Tạo Transactions Page** (Frontend)
   - Repurpose checkout.html → transactions.html
   - View: Proposals I sent (buyer)
   - View: Proposals I received (seller)
   - Actions: Approve/Reject/Counter
   - Filter: Pending/Approved/Rejected

5. **Socket.IO Integration**
   - Emit 'transaction:new' khi có proposal mới
   - Client listen và show notification

6. **Testing**
   - Test all 3 flows (buy/swap/free)
   - Test validation
   - Test socket notifications

## Notes

- ✅ Frontend UI/UX đã hoàn thành
- ⏳ Backend API cần implement
- ⏳ Transaction management page cần tạo
- ✅ Đã comment TODO tại các vị trí cần gọi API
- ✅ Modal hiển thị đầy đủ thông tin và UX tốt
