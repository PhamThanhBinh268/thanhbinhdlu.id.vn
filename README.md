<img width="456" height="661" alt="image" src="https://github.com/user-attachments/assets/3e8bfda0-04ff-4d12-829c-8537c331cfbb" />📘 THANH LÝ ĐỒ CŨ

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
index.html, detail.html, shop.html, create-post.html, login.html, signup.html, profile.html, messages.html, vip-packages.html
admin/ — dashboard.html, posts.html
assets/, css/, img/, js/, lib/, partials/, scss/
docs — tài liệu & hướng dẫn (DESIGN_PATTERNS_REPORT.md, SHOPPING_GUIDE.md, ...)
server
top-level scripts: init_vip_packages.js, INSTALL.md, package.json, test_vip_api.js
scripts/ — seed và helpers
src/
index.js
middleware/, models/, routes/, socket/, utils/

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
