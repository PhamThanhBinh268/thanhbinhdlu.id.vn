const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const User = require("./src/models/User");
const Category = require("./src/models/Category");
const Post = require("./src/models/Post");

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔗 Kết nối MongoDB thành công");

    // 1. Tạo categories
    console.log("📁 Tạo danh mục...");
    const categories = [
      {
        tenDanhMuc: "Đồ Điện Tử",
        moTa: "Điện thoại, laptop, máy tính bảng",
        icon: "fas fa-mobile-alt",
      },
      {
        tenDanhMuc: "Thời Trang",
        moTa: "Quần áo, giày dép, phụ kiện",
        icon: "fas fa-tshirt",
      },
      {
        tenDanhMuc: "Đồ Gia Dụng",
        moTa: "Đồ dùng nhà bếp, nội thất",
        icon: "fas fa-home",
      },
      {
        tenDanhMuc: "Sách Văn Phòng Phẩm",
        moTa: "Sách, dụng cụ học tập",
        icon: "fas fa-book",
      },
      {
        tenDanhMuc: "Xe Cộ",
        moTa: "Xe máy, xe đạp, ô tô",
        icon: "fas fa-motorcycle",
      },
      {
        tenDanhMuc: "Thể Thao",
        moTa: "Dụng cụ thể thao, gym",
        icon: "fas fa-dumbbell",
      },
    ];

    for (const catData of categories) {
      const existingCat = await Category.findOne({
        tenDanhMuc: catData.tenDanhMuc,
      });
      if (!existingCat) {
        await Category.create(catData);
        console.log(`✅ Tạo danh mục: ${catData.tenDanhMuc}`);
      }
    }

    // 2. Lấy user và category IDs
    const users = await User.find();
    const categoriesDb = await Category.find();

    if (users.length === 0) {
      console.log("❌ Không có user nào. Vui lòng tạo user trước.");
      return;
    }

    // 3. Tạo sample posts
    console.log("📝 Tạo bài đăng mẫu...");
    const samplePosts = [
      {
        tieuDe: "iPhone 13 Pro Max 128GB - Còn mới 95%",
        moTa: "Bán iPhone 13 Pro Max màu xanh dương, 128GB. Máy còn rất mới, không trầy xước. Full box, cáp sạc, tai nghe. Bảo hành chính hãng còn 6 tháng.",
        gia: 25000000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 1, TP.HCM",
        tags: ["iphone", "apple", "điện thoại", "smartphone"],
        hinhAnh: [
          "https://via.placeholder.com/400x300.png?text=iPhone+13+Pro+Max+1",
          "https://via.placeholder.com/400x300.png?text=iPhone+13+Pro+Max+2",
        ],
      },
      {
        tieuDe: "Laptop Dell XPS 13 - i7 Gen 11, 16GB RAM",
        moTa: "Laptop Dell XPS 13 inch, chip Intel i7 thế hệ 11, RAM 16GB, SSD 512GB. Máy mỏng nhẹ, pin tốt, màn hình sắc nét. Sử dụng cho công việc và học tập.",
        gia: 18000000,
        tinhTrang: "tot",
        diaDiem: "Quận 3, TP.HCM",
        tags: ["laptop", "dell", "xps", "i7", "máy tính"],
        hinhAnh: [
          "https://via.placeholder.com/400x300.png?text=Dell+XPS+13+1",
          "https://via.placeholder.com/400x300.png?text=Dell+XPS+13+2",
        ],
      },
      {
        tieuDe: "Áo khoác hoodie Uniqlo - Size M",
        moTa: "Áo khoác hoodie Uniqlo chính hãng, size M, màu đen. Chất liệu cotton mềm mại, ấm áp. Mặc ít lần, còn rất mới.",
        gia: 350000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 7, TP.HCM",
        tags: ["áo khoác", "hoodie", "uniqlo", "thời trang"],
        hinhAnh: [
          "https://via.placeholder.com/400x300.png?text=Hoodie+Uniqlo+1",
        ],
      },
      {
        tieuDe: "Xe đạp Fixed Gear - Màu trắng",
        moTa: "Xe đạp Fixed Gear màu trắng, khung hợp kim nhôm, bánh xe 700c. Xe đẹp, chạy êm, phù hợp cho việc di chuyển trong thành phố.",
        gia: 2500000,
        tinhTrang: "tot",
        diaDiem: "Quận Bình Thạnh, TP.HCM",
        tags: ["xe đạp", "fixed gear", "xe cộ"],
        hinhAnh: [
          "https://via.placeholder.com/400x300.png?text=Fixed+Gear+1",
          "https://via.placeholder.com/400x300.png?text=Fixed+Gear+2",
        ],
      },
      {
        tieuDe: "Bộ sách Harry Potter - Tiếng Việt",
        moTa: "Bộ sách Harry Potter đầy đủ 7 tập, bản dịch tiếng Việt. Sách còn mới, không rách rời. Phù hợp cho học sinh, sinh viên yêu thích đọc sách.",
        gia: 450000,
        tinhTrang: "tot",
        diaDiem: "Quận 10, TP.HCM",
        tags: ["sách", "harry potter", "văn học", "tiểu thuyết"],
        hinhAnh: [
          "https://via.placeholder.com/400x300.png?text=Harry+Potter+Books",
        ],
      },
    ];

    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];

      // Random user and category
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomCategory =
        categoriesDb[Math.floor(Math.random() * categoriesDb.length)];

      const existingPost = await Post.findOne({ tieuDe: postData.tieuDe });
      if (!existingPost) {
        await Post.create({
          ...postData,
          nguoiDang: randomUser._id,
          danhMuc: randomCategory._id,
          trangThai: "approved",
        });
        console.log(`✅ Tạo bài đăng: ${postData.tieuDe}`);
      }
    }

    console.log("🎉 Seed data hoàn thành!");
  } catch (error) {
    console.error("❌ Lỗi seed data:", error);
  } finally {
    await mongoose.connection.close();
  }
}

seedData();
