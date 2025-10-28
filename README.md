📘 THANH LÝ ĐỒ CŨ

Nền tảng mua bán đồ cũ uy tín, an toàn và tiện lợi

🧭 Giới Thiệu

Thanh Lý Đồ Cũ là website kết nối người mua và người bán đồ cũ, với hệ thống xác thực và đánh giá uy tín.
Mục tiêu là xây dựng một cộng đồng giao dịch văn minh, an toàn và minh bạch.

💡 Mục Tiêu

🛡️ An toàn cho người mua & người bán

💬 Tương tác trực tiếp qua chat

⭐ Đánh giá uy tín sau mỗi giao dịch

📢 Minh bạch thông tin sản phẩm

✨ Tính Năng Chính
👨‍💼 Dành cho Người Bán

Đăng tin với hình ảnh sản phẩm

Quản lý bài đăng, chỉnh sửa, xóa

Chat trực tiếp với người mua

Theo dõi đánh giá và độ uy tín

🛒 Dành cho Người Mua

Tìm kiếm, lọc sản phẩm theo danh mục & giá

Chat với người bán, thương lượng giá

Đánh giá người bán sau giao dịch

⚙️ Hệ thống Quản Trị (Admin)

Kiểm duyệt bài đăng

Quản lý người dùng

Xử lý báo cáo vi phạm

Xem thống kê toàn hệ thống

🏗️ Kiến Trúc & Tech Stack
🔹 Sơ đồ tổng thể
graph TD
    Client[HTML/CSS/JS - Frontend] -->|HTTP| API[Node.js Express Server]
    API -->|CRUD| DB[(MongoDB Atlas)]
    API -->|Auth| JWT[JWT Authentication]
    API -->|Upload| Cloudinary[Cloudinary Storage]

🖥️ Frontend

HTML5 + CSS3 + JavaScript (ES6)

Bootstrap 5: Giao diện responsive, thân thiện mobile

Fetch API: Kết nối tới backend

Handlebars (tuỳ chọn): Template HTML động

⚙️ Backend

Node.js + Express: Xây dựng RESTful API

MongoDB Atlas: Lưu trữ dữ liệu cloud

Mongoose: ORM kết nối MongoDB

JWT: Xác thực bảo mật

Bcrypt: Mã hóa mật khẩu

Cloudinary: Lưu trữ hình ảnh sản phẩm

Dotenv: Quản lý biến môi trường

🚀 Hướng Dẫn Cài Đặt
📋 Yêu Cầu

Node.js >= 16

Git

Tài khoản MongoDB Atlas

Cloudinary account (để lưu ảnh)

🔧 Cài Đặt

1️⃣ Clone project

git clone https://github.com/yourusername/oldmarket-html.git
cd oldmarket-html


2️⃣ Cài đặt dependencies

cd server
npm install


3️⃣ Cấu hình môi trường

Tạo file .env trong thư mục server:

PORT=8080
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/oldmarket"
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret


4️⃣ Khởi tạo dữ liệu mẫu

npm run seed


5️⃣ Chạy server

npm run dev


Server chạy tại:
👉 http://localhost:8080

Frontend truy cập trực tiếp qua các file HTML trong thư mục /client.

🧱 Cấu Trúc Thư Mục
## 📁 Project Structure


client
├── cart.html
├── checkout.html
├── contact.html
├── create-post.html
├── detail.html
├── index.html
├── index.html.bak
├── login.html
├── messages.html
├── my-posts.html
├── my-transactions.html
├── profile.html
├── shop.html
├── signup.html
├── transaction-detail.html
├── vip-packages.html
│
├── admin/
│   ├── dashboard.html
│   └── posts.html
│
├── assets/
│   └── templates/
│
├── LICENSE.txt
├── READ-ME.txt
│
├── css/
│   └── style.min.css
│
├── img/
│
├── js/
│   ├── admin-dashboard.js
│   ├── admin-posts.js
│   ├── api.js
│   ├── checkout.js
│   ├── create-post.js
│   ├── decorators.js
│   ├── detail.js
│   ├── formatters.js
│   ├── index.js
│   ├── layout.js
│   ├── main.js
│   ├── messages.js
│   ├── my-posts.js
│   ├── my-transactions.js
│   ├── payment-setup.js
│   ├── profile.js
│   ├── shop.js
│   ├── socket.js
│   ├── transaction-detail.js
│   ├── vip-packages.js
│   └── vn-geo-fallback.json
│
├── lib/
│   ├── animate/
│   │   └── animate.min.css
│   │
│   ├── easing/
│   │   └── easing.min.js
│   │
│   ├── owlcarousel/
│   │   ├── LICENSE
│   │   ├── owl.carousel.min.js
│   │   ├── assets/
│   │   └── owl.carousel.min.css
│   │
│   ├── partials/
│   │   ├── footer.html
│   │   └── header.html
│   │
│   └── scss/
│       └── style.scss
│
docs
├── DESIGN_PATTERNS_REPORT.md
├── PATTERNS.md
├── SHOPPING_GUIDE.md
│
├── api/
│   └── API.md
│
└── development/
    ├── C2C_CONVERSION.md
    ├── DEBUG_CREATE_POST.md
    ├── INTEGRATION_COMPLETE.md
    ├── MONGODB_INTEGRATION.md
    └── SELLER_RATING_UPDATE.md

server
├── init_vip_packages.js
├── INSTALL.md
├── package.json
├── test_vip_api.js
│
├── scripts/
│   ├── backfillImageDetail.js
│   ├── initVipPackages.js
│   └── seed_mock_data.js
│
├── admin/
│   └── reset_admin_password.js
│
├── seed/
│   ├── seed_data.js
│   └── seed_full_data.js
│
├── src/
│   ├── index.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   │
│   ├── models/
│   │   ├── Category.js
│   │   ├── Message.js
│   │   ├── Post.js
│   │   ├── Rating.js
│   │   ├── SavedPost.js
│   │   ├── Transaction.js
│   │   ├── User.js
│   │   ├── VipPackage.js
│   │   └── VipSubscription.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── categories.js
│   │   ├── cloudinary.js
│   │   ├── messages.js
│   │   ├── payment-handlers.js
│   │   ├── post-ratings-addon.js
│   │   ├── posts.js
│   │   ├── ratings.js
│   │   ├── shipping-handlers.js
│   │   ├── stats.js
│   │   ├── transactions.js
│   │   ├── users.js
│   │   └── vip-packages.js
│   │
│   ├── scripts/
│   │   └── seedData.js
│   │
│   ├── socket/
│   │   └── chatHandler.js
│   │
│   └── utils/
│       ├── cloudinary.js
│       ├── VipDecorator.js
│       ├── VipPackageManager.js
│       └── VipStrategy.js


🧩 API Chính
Phân hệ	Endpoint	Method	Mô tả
Auth	/api/auth/register	POST	Đăng ký tài khoản
Auth	/api/auth/login	POST	Đăng nhập
Users	/api/users/:id	GET	Lấy thông tin người dùng
Posts	/api/posts	GET	Lấy danh sách bài đăng
Posts	/api/posts	POST	Tạo bài đăng mới
Chat	/api/chat/:id	GET	Lấy tin nhắn
Ratings	/api/ratings	POST	Gửi đánh giá
Admin	/api/admin/posts/:id/approve	PATCH	Duyệt bài đăng
🧪 Tài Khoản Demo
Role	Email	Password
Admin	admin@example.com
	admin123
User	user@example.com
	user123
🌍 Demo Đường Dẫn
Thành phần	URL
Trang chủ	http://localhost:8080/client/index.html

API Server	http://localhost:8080/api

API Docs	http://localhost:8080/api-docs

Admin Dashboard	http://localhost:8080/client/admin.html
