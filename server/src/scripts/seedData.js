const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const User = require("../models/User");
const Category = require("../models/Category");
const Post = require("../models/Post");
const Transaction = require("../models/Transaction");
const Rating = require("../models/Rating");
const Message = require("../models/Message");

// Kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/oldmarket"
    );
    console.log("✅ Kết nối MongoDB thành công");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    process.exit(1);
  }
};

// Dữ liệu mẫu
const seedData = async () => {
  try {
    console.log("🧹 Xóa dữ liệu cũ...");
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Post.deleteMany({}),
      Transaction.deleteMany({}),
      Rating.deleteMany({}),
      Message.deleteMany({}),
    ]);

    console.log("👤 Tạo users...");

    // Tạo Admin
    const admin = new User({
      hoTen: "Admin System",
      email: "admin@demo.com",
      matKhau: "123456",
      vaiTro: "admin",
      soDienThoai: "0123456789",
      diaChi: "Đà Lạt, Lâm Đồng",
    });
    await admin.save();

    // Tạo users mẫu
    const users = [];
    const userData = [
      {
        hoTen: "Nguyễn Văn An",
        email: "user1@demo.com",
        matKhau: "123456",
        soDienThoai: "0987654321",
        diaChi: "Quận 1, TP.HCM",
      },
      {
        hoTen: "Trần Thị Bình",
        email: "user2@demo.com",
        matKhau: "123456",
        soDienThoai: "0976543210",
        diaChi: "Quận 3, TP.HCM",
      },
      {
        hoTen: "Lê Minh Cường",
        email: "user3@demo.com",
        matKhau: "123456",
        soDienThoai: "0965432109",
        diaChi: "Đống Đa, Hà Nội",
      },
      {
        hoTen: "Phạm Thị Dung",
        email: "user4@demo.com",
        matKhau: "123456",
        soDienThoai: "0954321098",
        diaChi: "Cầu Giấy, Hà Nội",
      },
      {
        hoTen: "Hoàng Văn Em",
        email: "user5@demo.com",
        matKhau: "123456",
        soDienThoai: "0943210987",
        diaChi: "Đà Lạt, Lâm Đồng",
      },
    ];

    for (const [idx, data] of userData.entries()) {
      const user = new User({
        ...data,
        // Đánh dấu một vài user là người bán đã xác minh để demo badge
        daXacMinhNguoiBan: [0,2].includes(idx),
      });
      await user.save();
      users.push(user);
    }

    console.log("📂 Tạo categories...");
    const categories = [];
    const categoryData = [
      {
        tenDanhMuc: "Điện thoại & Máy tính bảng",
        moTa: "Điện thoại thông minh, máy tính bảng các loại",
        icon: "fas fa-mobile-alt",
      },
      {
        tenDanhMuc: "Laptop & Máy tính",
        moTa: "Laptop, PC, linh kiện máy tính",
        icon: "fas fa-laptop",
      },
      {
        tenDanhMuc: "Sách & Học tập",
        moTa: "Sách giáo khoa, sách tham khao, văn phòng phẩm",
        icon: "fas fa-book",
      },
      {
        tenDanhMuc: "Đồ gia dụng",
        moTa: "Đồ dùng gia đình, nội thất, trang trí",
        icon: "fas fa-home",
      },
      {
        tenDanhMuc: "Thời trang",
        moTa: "Quần áo, giày dép, phụ kiện thời trang",
        icon: "fas fa-tshirt",
      },
      {
        tenDanhMuc: "Xe cộ",
        moTa: "Xe máy, xe đạp, phụ kiện xe",
        icon: "fas fa-motorcycle",
      },
      {
        tenDanhMuc: "Đồ thể thao",
        moTa: "Dụng cụ tập luyện, đồ thể thao",
        icon: "fas fa-dumbbell",
      },
      {
        tenDanhMuc: "Khác",
        moTa: "Các mặt hàng khác",
        icon: "fas fa-box",
      },
    ];

    for (const data of categoryData) {
      const category = new Category(data);
      await category.save();
      categories.push(category);
    }

    console.log("📝 Tạo posts...");
    const posts = [];
    const postData = [
      { // iPhone - thêm discount & highlight để demo Decorator
        tieuDe: "iPhone 12 Pro Max 128GB còn mới 95%",
        moTa: "iPhone 12 Pro Max màu xanh dương, 128GB. Máy còn rất mới, không trầy xước, pin zin 89%. Có đầy đủ hộp, sạc. Lý do bán: nâng cấp iPhone 15.",
        gia: 18000000,
        hinhAnh: [
          "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800",
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
        ],
        danhMuc: categories[0]._id,
        nguoiDang: users[0]._id,
        diaDiem: "Quận 1, TP.HCM",
        tinhTrang: "nhu-moi",
        trangThai: "approved",
        tags: ["iphone", "apple", "smartphone", "discount-15", "highlight"],
        luotXem: 156,
      },
      { // Dell XPS - thêm discount
        tieuDe: "Laptop Dell XPS 13 i7 16GB RAM 512GB SSD",
        moTa: "Dell XPS 13 9310, Intel Core i7-1165G7, RAM 16GB, SSD 512GB. Laptop mỏng nhẹ, màn hình 4K touch. Còn bảo hành 8 tháng. Máy chạy mượt, phù hợp văn phòng và đồ họa.",
        gia: 22000000,
        hinhAnh: [
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
          "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800",
        ],
        danhMuc: categories[1]._id,
        nguoiDang: users[1]._id,
        diaDiem: "Quận 3, TP.HCM",
        tinhTrang: "tot",
        trangThai: "approved",
        tags: ["dell", "laptop", "xps", "discount-20"],
        luotXem: 89,
      },
      { // Sách - thêm featured
        tieuDe: "Bộ sách giáo khoa lớp 12 đầy đủ các môn",
        moTa: "Trọn bộ sách giáo khoa lớp 12 mới nhất, bao gồm: Toán, Lý, Hóa, Sinh, Văn, Sử, Địa, Anh. Sách còn mới, ít sử dụng, có gạch chú ít. Phù hợp cho học sinh chuẩn bị thi THPT.",
        gia: 280000,
        hinhAnh: [
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800",
        ],
        danhMuc: categories[2]._id,
        nguoiDang: users[2]._id,
        diaDiem: "Đống Đa, Hà Nội",
        tinhTrang: "tot",
        trangThai: "approved",
        tags: ["sach", "giao-khoa", "lop12", "featured"],
        luotXem: 67,
      },
      {
        tieuDe: "Tủ lạnh Samsung 208L ít sử dụng",
        moTa: "Tủ lạnh Samsung RT20HAR8DSA 208L, 2 cửa. Máy mới mua 1 năm, ít sử dụng do chuyển nhà. Làm lạnh tốt, tiết kiệm điện, không ồn. Có bảo hành còn 11 tháng.",
        gia: 4500000,
        hinhAnh: [
          "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800",
        ],
        danhMuc: categories[3]._id,
        nguoiDang: users[3]._id,
        diaDiem: "Cầu Giấy, Hà Nội",
        tinhTrang: "nhu-moi",
        trangThai: "approved",
        tags: ["tu-lanh", "samsung", "gia-dung"],
        luotXem: 123,
      },
      {
        tieuDe: "Áo khoác jeans Uniqlo size M",
        moTa: "Áo khoác jeans Uniqlo màu xanh đen, size M. Chất liệu cotton mềm mại, form dáng đẹp. Mặc ít lần, còn rất mới. Phù hợp cho mùa thu đông.",
        gia: 350000,
        hinhAnh: [
          "https://images.unsplash.com/photo-1544966503-7cc5ac882d5d?w=800",
        ],
        danhMuc: categories[4]._id,
        nguoiDang: users[4]._id,
        diaDiem: "Đà Lạt, Lâm Đồng",
        tinhTrang: "nhu-moi",
        trangThai: "approved",
        tags: ["ao-khoac", "jeans", "uniqlo"],
        luotXem: 45,
      },
      {
        tieuDe: "Xe đạp thể thao Giant ATX 26 inch",
        moTa: "Xe đạp thể thao Giant ATX 26 inch, màu đen xanh. Xe còn mới, đã thay phanh đĩa, lốp mới. Phù hợp đi làm, tập thể dục. Có bảo trì định kỳ.",
        gia: 2800000,
        hinhAnh: [
          "https://images.unsplash.com/photo-1544191696-15285ea70b5d?w=800",
        ],
        danhMuc: categories[5]._id,
        nguoiDang: users[0]._id,
        diaDiem: "Quận 1, TP.HCM",
        tinhTrang: "tot",
        trangThai: "approved",
        tags: ["xe-dap", "giant", "the-thao"],
        luotXem: 78,
      },
      {
        tieuDe: "Tạ tay 5kg mới không sử dụng",
        moTa: "Cặp tạ tay 5kg mỗi chiếc, mới nguyên hộp chưa sử dụng. Mua nhầm nặng quá không tập được. Phù hợp cho người tập gym tại nhà.",
        gia: 800000,
        hinhAnh: [
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
        ],
        danhMuc: categories[6]._id,
        nguoiDang: users[1]._id,
        diaDiem: "Quận 3, TP.HCM",
        tinhTrang: "moi",
        trangThai: "approved",
        tags: ["ta-tay", "gym", "the-thao"],
        luotXem: 34,
      },
      {
        tieuDe: "Máy pha cà phê Nespresso Essenza Mini",
        moTa: "Máy pha cà phê Nespresso Essenza Mini màu đỏ. Máy nhỏ gọn, pha cà phê ngon. Kèm theo 20 viên cà phê Nespresso. Lý do bán: chuyển sang dùng máy pha tự động.",
        gia: 1200000,
        hinhAnh: [
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
        ],
        danhMuc: categories[3]._id,
        nguoiDang: users[2]._id,
        diaDiem: "Đống Đa, Hà Nội",
        tinhTrang: "tot",
        trangThai: "approved",
        tags: ["ca-phe", "nespresso", "may-pha"],
        luotXem: 91,
      },
    ];

    for (const data of postData) {
      const post = new Post(data);
      await post.save();
      posts.push(post);
    }

    // Tạo một số bài đăng chờ duyệt
    const pendingPosts = [
      {
        tieuDe: "MacBook Air M2 13 inch 2022",
        moTa: "MacBook Air M2 chip, 13 inch, RAM 8GB, SSD 256GB. Máy còn mới, sử dụng ít. Có đầy đủ hộp phụ kiện.",
        gia: 26000000,
        hinhAnh: [
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=800",
        ],
        danhMuc: categories[1]._id,
        nguoiDang: users[3]._id,
        diaDiem: "Cầu Giấy, Hà Nội",
        tinhTrang: "nhu-moi",
        trangThai: "pending",
      },
    ];

    for (const data of pendingPosts) {
      const post = new Post(data);
      await post.save();
    }

    console.log("💬 Tạo messages...");
    // Tạo tin nhắn mẫu
    const messages = [
      {
        nguoiGui: users[1]._id,
        nguoiNhan: users[0]._id,
        noiDung: "Chào bạn, iPhone còn không ạ?",
        baiDangLienQuan: posts[0]._id,
      },
      {
        nguoiGui: users[0]._id,
        nguoiNhan: users[1]._id,
        noiDung: "Chào bạn, dạ máy còn ạ. Bạn có quan tâm không?",
        baiDangLienQuan: posts[0]._id,
      },
      {
        nguoiGui: users[1]._id,
        nguoiNhan: users[0]._id,
        noiDung:
          "Máy có trầy xước gì không ạ? Bạn có thể gặp mặt xem máy được không?",
        baiDangLienQuan: posts[0]._id,
      },
    ];

    for (const data of messages) {
      const message = new Message(data);
      await message.save();
    }

    console.log("🔄 Tạo transactions...");
    // Tạo giao dịch mẫu
    const transaction1 = new Transaction({
      baiDang: posts[2]._id, // Bộ sách lớp 12
      nguoiMua: users[3]._id,
      nguoiBan: users[2]._id,
      giaThanhToan: 280000,
      phuongThucThanhToan: "tien-mat",
      diaDiemGiaoDich: "Trường THPT ABC, Đống Đa",
      thoiGianGiaoDich: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 ngày trước
      trangThai: "hoan-thanh",
    });
    await transaction1.save();

    const transaction2 = new Transaction({
      baiDang: posts[4]._id, // Áo khoác jeans
      nguoiMua: users[1]._id,
      nguoiBan: users[4]._id,
      giaThanhToan: 350000,
      phuongThucThanhToan: "chuyen-khoan",
      trangThai: "da-dong-y",
    });
    await transaction2.save();

    console.log("⭐ Tạo ratings...");
    // Tạo đánh giá mẫu
    const rating1 = new Rating({
      tuNguoiDung: users[3]._id, // Người mua
      denNguoiDung: users[2]._id, // Người bán
      giaoDich: transaction1._id,
      soSao: 5,
      binhLuan: "Sách còn mới, người bán nhiệt tình. Giao hàng đúng hẹn.",
      loaiDanhGia: "nguoi-ban",
    });
    await rating1.save();

    const rating2 = new Rating({
      tuNguoiDung: users[2]._id, // Người bán
      denNguoiDung: users[3]._id, // Người mua
      giaoDich: transaction1._id,
      soSao: 5,
      binhLuan: "Người mua uy tín, thanh toán nhanh chóng.",
      loaiDanhGia: "nguoi-mua",
    });
    await rating2.save();

    // Cập nhật điểm uy tín cho users
    await users[2].calculateRating();
    await users[3].calculateRating();

    console.log("✅ Seed data hoàn thành!");
    console.log(`
📊 Thống kê dữ liệu đã tạo:
- Users: ${users.length + 1} (bao gồm 1 admin)
- Categories: ${categories.length}
- Posts: ${posts.length} (approved) + 1 (pending)
- Messages: ${messages.length}
- Transactions: 2
- Ratings: 2

🔑 Tài khoản demo:
Admin: admin@demo.com / 123456
User 1: user1@demo.com / 123456
User 2: user2@demo.com / 123456
...
    `);
  } catch (error) {
    console.error("❌ Lỗi seed data:", error);
  }
};

// Chạy script
const run = async () => {
  await connectDB();
  await seedData();
  process.exit(0);
};

run();
