const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const User = require("./src/models/User");
const Category = require("./src/models/Category");
const Post = require("./src/models/Post");
const Rating = require("./src/models/Rating");

async function seedFullData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔗 Kết nối MongoDB thành công");

    // Clear existing data
    console.log("🗑️ Xóa dữ liệu cũ...");
    await Post.deleteMany({});
    await Category.deleteMany({});
    await Rating.deleteMany({});
    
    // 1. Tạo categories (KHÓA - không cho tạo thêm)
    console.log("📁 Tạo danh mục cố định...");
    const categories = [
      {
        tenDanhMuc: "Đồ Điện Tử",
        moTa: "Điện thoại, laptop, máy tính bảng, phụ kiện",
        icon: "fas fa-mobile-alt",
        slug: "do-dien-tu",
        hinhAnh: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop"
      },
      {
        tenDanhMuc: "Thời Trang",
        moTa: "Quần áo, giày dép, túi xách, phụ kiện",
        icon: "fas fa-tshirt",
        slug: "thoi-trang",
        hinhAnh: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop"
      },
      {
        tenDanhMuc: "Đồ Gia Dụng",
        moTa: "Đồ dùng nhà bếp, nội thất, trang trí",
        icon: "fas fa-home",
        slug: "do-gia-dung",
        hinhAnh: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop"
      },
      {
        tenDanhMuc: "Sách Văn Phòng Phẩm",
        moTa: "Sách, vở, dụng cụ học tập, văn phòng",
        icon: "fas fa-book",
        slug: "sach-van-phong-pham",
        hinhAnh: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop"
      },
      {
        tenDanhMuc: "Xe Cộ",
        moTa: "Xe máy, xe đạp, ô tô, phụ tùng",
        icon: "fas fa-motorcycle",
        slug: "xe-co",
        hinhAnh: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=400&fit=crop"
      },
      {
        tenDanhMuc: "Thể Thao",
        moTa: "Dụng cụ thể thao, gym, yoga, thể hình",
        icon: "fas fa-dumbbell",
        slug: "the-thao",
        hinhAnh: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop"
      },
      {
        tenDanhMuc: "Khác",
        moTa: "Các sản phẩm khác không thuộc danh mục trên",
        icon: "fas fa-ellipsis-h",
        slug: "khac",
        hinhAnh: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop"
      }
    ];

    const createdCategories = {};
    for (const catData of categories) {
      const cat = await Category.create(catData);
      createdCategories[catData.slug] = cat._id;
      console.log(`✅ Tạo danh mục: ${catData.tenDanhMuc}`);
    }

    // 2. Lấy users
    const users = await User.find();
    if (users.length === 0) {
      console.log("❌ Không có user nào. Vui lòng tạo user trước.");
      return;
    }

    // Helper function
    const getRandomUser = () => users[Math.floor(Math.random() * users.length)];
    const getRandomLoaiGia = () => {
      const types = ["ban", "trao-doi", "cho-mien-phi"];
      return types[Math.floor(Math.random() * types.length)];
    };

    // 3. Tạo posts cho mỗi danh mục
    console.log("📝 Tạo bài đăng cho từng danh mục...");

    // ========== ĐỒ ĐIỆN TỬ ==========
    const electronicsData = [
      {
        tieuDe: "iPhone 13 Pro Max 256GB Pacific Blue - Fullbox",
        moTa: "iPhone 13 Pro Max 256GB màu xanh dương Pacific Blue. Máy còn mới 98%, không trầy xước, pin 100%. Fullbox đầy đủ phụ kiện chính hãng Apple. Bảo hành còn 8 tháng tại Apple Store.",
        gia: 28000000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 1, TP.HCM",
        loaiGia: "ban",
        tags: ["iphone", "iphone 13 pro max", "apple", "smartphone", "điện thoại"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500",
          "https://images.unsplash.com/photo-1632633728024-e1fd4bef561a?w=500"
        ]
      },
      {
        tieuDe: "Laptop Dell XPS 13 9310 - i7 1165G7, 16GB RAM, 512GB SSD",
        moTa: "Laptop Dell XPS 13 inch 2021, chip Intel Core i7-1165G7, RAM 16GB LPDDR4x, SSD 512GB NVMe. Màn hình Full HD+, pin 10 giờ, vỏ nhôm nguyên khối. Máy nhẹ chỉ 1.2kg, rất phù hợp cho dân văn phòng và sinh viên.",
        gia: 22000000,
        tinhTrang: "tot",
        diaDiem: "Quận 3, TP.HCM",
        loaiGia: "ban",
        tags: ["laptop", "dell", "dell xps", "i7", "laptop văn phòng"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500",
          "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500"
        ]
      },
      {
        tieuDe: "Samsung Galaxy S21 Ultra 5G - 128GB Phantom Black",
        moTa: "Samsung Galaxy S21 Ultra màu đen, bộ nhớ 128GB, hỗ trợ 5G. Camera 108MP chụp ảnh siêu nét, zoom 100x. Pin 5000mAh dùng cả ngày. Máy đẹp long lanh, không xước xát.",
        gia: 18500000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 7, TP.HCM",
        loaiGia: "trao-doi",
        tags: ["samsung", "galaxy s21", "android", "5g", "smartphone"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500"
        ]
      },
      {
        tieuDe: "MacBook Air M1 2020 - 8GB/256GB Gold",
        moTa: "MacBook Air chip M1 màu vàng gold, RAM 8GB, SSD 256GB. Máy siêu mỏng nhẹ, pin trâu 18 giờ, chạy cực mượt. Còn BH Apple 4 tháng. Màn Retina cực đẹp, loa hay.",
        gia: 20000000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận Bình Thạnh, TP.HCM",
        loaiGia: "ban",
        tags: ["macbook", "macbook air", "m1", "apple", "laptop"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500"
        ]
      },
      {
        tieuDe: "iPad Pro 11 inch 2021 - 128GB WiFi Space Gray",
        moTa: "iPad Pro 11 inch chip M1, bộ nhớ 128GB, màu xám đen. Màn hình Liquid Retina 120Hz siêu mượt, loa 4 chiều đỉnh. Kèm bao da chính hãng Apple. Dùng vẽ và xem phim cực đã!",
        gia: 16000000,
        tinhTrang: "tot",
        diaDiem: "Quận 10, TP.HCM",
        loaiGia: "cho-mien-phi",
        tags: ["ipad", "ipad pro", "tablet", "apple", "máy tính bảng"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500"
        ]
      },
      {
        tieuDe: "Tai nghe Sony WH-1000XM4 - Chống ồn chủ động",
        moTa: "Tai nghe Sony WH-1000XM4 màu đen, chống ồn chủ động đỉnh cao. Pin 30 giờ, âm thanh Hi-Res, kết nối Bluetooth 5.0. Đệm tai êm ái, đeo cả ngày không mỏi. Fullbox nguyên seal.",
        gia: 6500000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 5, TP.HCM",
        loaiGia: "ban",
        tags: ["tai nghe", "sony", "bluetooth", "chống ồn", "headphone"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500"
        ]
      }
    ];

    // ========== THỜI TRANG ==========
    const fashionData = [
      {
        tieuDe: "Áo khoác hoodie Uniqlo - Size M màu đen",
        moTa: "Áo khoác hoodie Uniqlo chính hãng Nhật Bản, size M, màu đen basic. Chất cotton 100% mềm mại, ấm áp. Form rộng thoải mái. Mặc 2-3 lần thôi, còn rất mới.",
        gia: 350000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 7, TP.HCM",
        loaiGia: "ban",
        tags: ["áo khoác", "hoodie", "uniqlo", "streetwear", "áo nam"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500"
        ]
      },
      {
        tieuDe: "Giày Nike Air Force 1 White - Size 42",
        moTa: "Giày Nike Air Force 1 trắng full, size 42. Hàng chính hãng Nike Vietnam. Đế cao su bền, đi êm chân. Giày còn rất mới, mang đi 5-6 lần. Không vàng ố, không bong tróc.",
        gia: 1800000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 1, TP.HCM",
        loaiGia: "trao-doi",
        tags: ["giày", "nike", "air force 1", "sneaker", "giày thể thao"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500"
        ]
      },
      {
        tieuDe: "Túi xách Michael Kors Selma Medium - Màu đen",
        moTa: "Túi xách Michael Kors dòng Selma size Medium, màu đen thanh lịch. Da Saffiano cao cấp, bền đẹp. Kèm thẻ bảo hành và túi vải chính hãng. Mua tại store USA.",
        gia: 4500000,
        tinhTrang: "tot",
        diaDiem: "Quận 3, TP.HCM",
        loaiGia: "ban",
        tags: ["túi xách", "michael kors", "túi nữ", "hàng hiệu", "phụ kiện"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500"
        ]
      },
      {
        tieuDe: "Quần jean Levi's 511 Slim Fit - W32 L32",
        moTa: "Quần jean Levi's 511 Slim Fit màu xanh navy classic. Size W32 L32, vừa người Việt Nam. Chất denim cao cấp, bền đẹp theo năm tháng. Mặc rất tôn dáng.",
        gia: 650000,
        tinhTrang: "tot",
        diaDiem: "Quận Bình Thạnh, TP.HCM",
        loaiGia: "cho-mien-phi",
        tags: ["quần jean", "levis", "denim", "quần nam", "slim fit"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500"
        ]
      },
      {
        tieuDe: "Áo sơ mi Zara trắng công sở - Size S",
        moTa: "Áo sơ mi trắng Zara dành cho nữ, size S. Chất liệu vải mềm mịn, không nhăn. Kiểu dáng thanh lịch, phù hợp đi làm và dự tiệc. Giặt máy được, dễ ủi.",
        gia: 280000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 10, TP.HCM",
        loaiGia: "ban",
        tags: ["áo sơ mi", "zara", "áo nữ", "công sở", "áo trắng"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500"
        ]
      },
      {
        tieuDe: "Kính mát Ray-Ban Aviator Classic - Gold Frame",
        moTa: "Kính mát Ray-Ban Aviator vàng gold kinh điển. Tròng kính polarized chống UV 100%. Gọng titan siêu nhẹ. Kèm hộp cứng và khăn lau chính hãng. Hàng xách tay từ Mỹ.",
        gia: 3200000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 7, TP.HCM",
        loaiGia: "ban",
        tags: ["kính mát", "ray-ban", "aviator", "phụ kiện", "sunglasses"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500"
        ]
      }
    ];

    // ========== ĐỒ GIA DỤNG ==========
    const householdData = [
      {
        tieuDe: "Nồi cơm điện Panasonic 1.8L - 10 người ăn",
        moTa: "Nồi cơm điện Panasonic dung tích 1.8 lít, nấu được 10 người ăn. Lòng nồi chống dính cao cấp, nấu cơm rất ngon. Có chức năng hẹn giờ và giữ ấm. Dùng 6 tháng, còn mới lắm.",
        gia: 1200000,
        tinhTrang: "tot",
        diaDiem: "Quận 5, TP.HCM",
        loaiGia: "ban",
        tags: ["nồi cơm điện", "panasonic", "đồ gia dụng", "nhà bếp"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=500"
        ]
      },
      {
        tieuDe: "Bàn làm việc gỗ công nghiệp - 120x60cm",
        moTa: "Bàn làm việc gỗ công nghiệp cao cấp, kích thước 120x60cm. Mặt bàn phủ melamine chống nước, chống trầy. Chân sắt sơn tĩnh điện chắc chắn. Phù hợp làm việc, học tập tại nhà.",
        gia: 1500000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận Tân Bình, TP.HCM",
        loaiGia: "trao-doi",
        tags: ["bàn làm việc", "nội thất", "bàn gỗ", "workspace", "furniture"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=500"
        ]
      },
      {
        tieuDe: "Quạt điều hòa Kangaroo - 35 lít",
        moTa: "Quạt điều hòa hơi nước Kangaroo, bình chứa 35 lít. Làm mát diện tích 30-40m2. Tiết kiệm điện gấp 10 lần máy lạnh. 3 tốc độ gió, có remote điều khiển từ xa. Mới mua 2 tháng.",
        gia: 2200000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 6, TP.HCM",
        loaiGia: "ban",
        tags: ["quạt điều hòa", "kangaroo", "máy làm mát", "điện gia dụng"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1631700611307-37dbcb89ef7e?w=500"
        ]
      },
      {
        tieuDe: "Bộ nồi inox 3 đáy Fissler - 5 món",
        moTa: "Bộ nồi inox 3 đáy Fissler cao cấp Đức, gồm 5 món đầy đủ. Inox 304 an toàn sức khỏe, dùng được trên bếp từ. Nấu nướng nhanh, tiết kiệm gas. Bảo hành chính hãng 10 năm.",
        gia: 3800000,
        tinhTrang: "tot",
        diaDiem: "Quận 7, TP.HCM",
        loaiGia: "cho-mien-phi",
        tags: ["nồi inox", "fissler", "dụng cụ nhà bếp", "bếp từ"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1584990347449-39b4632f014d?w=500"
        ]
      },
      {
        tieuDe: "Tủ lạnh Electrolux Inverter 350L - 2 cánh",
        moTa: "Tủ lạnh Electrolux Inverter 350 lít, 2 cửa. Công nghệ Inverter tiết kiệm điện 40%. Ngăn đông mềm giữ thực phẩm tươi ngon. Màu bạc sang trọng, dùng được 3 năm.",
        gia: 7500000,
        tinhTrang: "tot",
        diaDiem: "Quận 3, TP.HCM",
        loaiGia: "ban",
        tags: ["tủ lạnh", "electrolux", "inverter", "điện lạnh", "gia dụng"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500"
        ]
      },
      {
        tieuDe: "Ghế sofa da 3 chỗ ngồi - Màu nâu vintage",
        moTa: "Ghế sofa da bò 3 chỗ ngồi màu nâu vintage đẹp mắt. Kích thước 2m x 90cm, ngồi rất êm ái. Khung gỗ tự nhiên chắc chắn. Phong cách Bắc Âu hiện đại. Mua mới 1 năm.",
        gia: 12000000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 2, TP.HCM",
        loaiGia: "trao-doi",
        tags: ["sofa", "ghế sofa", "da bò", "nội thất", "phòng khách"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500"
        ]
      }
    ];

    // ========== SÁCH VĂN PHÒNG PHẨM ==========
    const booksData = [
      {
        tieuDe: "Bộ sách Harry Potter - 7 tập bản tiếng Việt",
        moTa: "Bộ sách Harry Potter đầy đủ 7 tập, bản dịch tiếng Việt xuất bản bởi NXB Trẻ. Bìa cứng sang trọng, hình ảnh minh họa đẹp. Sách còn mới 95%, không rách rời, không ghi chú.",
        gia: 850000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 10, TP.HCM",
        loaiGia: "ban",
        tags: ["sách", "harry potter", "tiểu thuyết", "văn học", "fantasy"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=500"
        ]
      },
      {
        tieuDe: "Sách Sapiens: Lược Sử Loài Người - Yuval Noah Harari",
        moTa: "Cuốn sách bán chạy nhất thế giới 'Sapiens' của Yuval Noah Harari. Bản tiếng Việt do NXB Thế Giới phát hành. Bìa cứng, 500+ trang, nội dung sâu sắc về lịch sử nhân loại.",
        gia: 180000,
        tinhTrang: "tot",
        diaDiem: "Quận 1, TP.HCM",
        loaiGia: "cho-mien-phi",
        tags: ["sách", "sapiens", "lịch sử", "khoa học", "non-fiction"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500"
        ]
      },
      {
        tieuDe: "Bộ bút màu Faber-Castell 48 màu - Hộp thiếc",
        moTa: "Bộ bút màu Faber-Castell 48 màu chính hãng Đức trong hộp thiếc cao cấp. Màu sắc tươi sáng, không độc hại. Phù hợp cho học sinh, sinh viên nghệ thuật và người yêu vẽ.",
        gia: 420000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận Bình Thạnh, TP.HCM",
        loaiGia: "ban",
        tags: ["bút màu", "faber-castell", "văn phòng phẩm", "dụng cụ vẽ"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500"
        ]
      },
      {
        tieuDe: "Máy tính Casio FX-580VN X - Giải toán cao cấp",
        moTa: "Máy tính Casio FX-580VN X chính hãng, bảo hành 7 năm. Giải được phương trình, ma trận, tích phân. Pin dùng 3 năm. Được phép sử dụng trong kỳ thi THPT và Đại học.",
        gia: 550000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 5, TP.HCM",
        loaiGia: "trao-doi",
        tags: ["máy tính", "casio", "calculator", "học tập", "văn phòng"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500"
        ]
      },
      {
        tieuDe: "Sổ tay Moleskine Classic - Size Large",
        moTa: "Sổ tay Moleskine Classic Notebook size Large (13x21cm), bìa cứng màu đen. Giấy 240 trang dày dặn, viết mượt. Có dải đánh dấu và túi đựng phía sau. Hàng chính hãng Italy.",
        gia: 380000,
        tinhTrang: "tot",
        diaDiem: "Quận 3, TP.HCM",
        loaiGia: "ban",
        tags: ["sổ tay", "moleskine", "notebook", "văn phòng phẩm", "bullet journal"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1517842645767-c639042777db?w=500"
        ]
      },
      {
        tieuDe: "Combo 30 quyển vở kẻ ngang Campus 80 trang",
        moTa: "Combo 30 quyển vở kẻ ngang Campus 80 trang, size B5. Giấy trắng không gây lóa mắt, mực không thấm. Phù hợp cho học sinh, sinh viên ghi chép. Bán theo combo tiết kiệm.",
        gia: 250000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 7, TP.HCM",
        loaiGia: "ban",
        tags: ["vở", "campus", "học tập", "văn phòng phẩm", "notebook"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=500"
        ]
      }
    ];

    // ========== XE CỘ ==========
    const vehiclesData = [
      {
        tieuDe: "Xe máy Honda Wave Alpha 110cc - Đời 2019",
        moTa: "Xe máy Honda Wave Alpha 110cc đời 2019, màu đỏ đen. Máy zin chưa sửa chữa, đi êm ru. Ngoại thất đẹp 90%, không tai nạn, không ngập nước. Giấy tờ đầy đủ, chính chủ.",
        gia: 18500000,
        tinhTrang: "tot",
        diaDiem: "Quận Gò Vấp, TP.HCM",
        loaiGia: "ban",
        tags: ["xe máy", "honda", "wave alpha", "xe số", "xe cộ"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=500"
        ]
      },
      {
        tieuDe: "Xe đạp đường phố Giant Escape 3 - Size M",
        moTa: "Xe đạp Giant Escape 3 màu xanh, size M phù hợp người cao 1m65-1m75. Xe 24 số, khung nhôm siêu nhẹ. Phanh đĩa trước sau. Đi trong thành phố rất êm, lướt nhanh. Bảo dưỡng định kỳ.",
        gia: 6800000,
        tinhTrang: "tot",
        diaDiem: "Quận 1, TP.HCM",
        loaiGia: "trao-doi",
        tags: ["xe đạp", "giant", "xe đạp thể thao", "bike", "bicycle"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=500"
        ]
      },
      {
        tieuDe: "Xe SH Mode 125cc 2020 - Màu xám bạc",
        moTa: "Xe SH Mode 125cc đời 2020, màu xám bạc sang trọng. Xe chính chủ nữ đi, giữ gìn cẩn thận. Máy Honda zin 100%, đèn full LED. Phanh ABS an toàn. Đi 12,000km, còn rất mới.",
        gia: 48000000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 7, TP.HCM",
        loaiGia: "ban",
        tags: ["sh mode", "honda", "xe tay ga", "scooter", "xe máy"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=500"
        ]
      },
      {
        tieuDe: "Xe đạp Fixed Gear - Khung thép carbon",
        moTa: "Xe đạp Fixed Gear khung thép carbon siêu nhẹ, màu trắng đen. Bánh 700c, yên da bò Brooks. Xe lướt nhanh, kiểu dáng Hipster cực chất. Phù hợp dân chơi xe đạp thành phố.",
        gia: 4500000,
        tinhTrang: "tot",
        diaDiem: "Quận Phú Nhuận, TP.HCM",
        loaiGia: "cho-mien-phi",
        tags: ["fixed gear", "xe đạp", "fixie", "urban bike", "bicycle"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500"
        ]
      },
      {
        tieuDe: "Yamaha Exciter 150 2019 - Phanh ABS",
        moTa: "Yamaha Exciter 150 đời 2019 màu đỏ đen thể thao. Phanh ABS 2 kênh, đèn LED, yên phân tầng. Máy côn tay 6 số, vọt êm. Xe chạy 15,000km, bảo dưỡng thường xuyên tại hãng.",
        gia: 42000000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận Tân Bình, TP.HCM",
        loaiGia: "ban",
        tags: ["exciter", "yamaha", "xe côn tay", "xe thể thao", "motorcycle"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500"
        ]
      },
      {
        tieuDe: "Nón bảo hiểm Fullface Yohe - Size L",
        moTa: "Nón bảo hiểm fullface Yohe đen bóng, size L. Có kính chống bụi, lót nón tháo rời giặt được. Chuẩn an toàn CR, bảo vệ đầu tối ưu. Đội rất thoáng, không nóng. Dùng 6 tháng.",
        gia: 850000,
        tinhTrang: "tot",
        diaDiem: "Quận 10, TP.HCM",
        loaiGia: "trao-doi",
        tags: ["nón bảo hiểm", "fullface", "yohe", "helmet", "phụ kiện xe"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"
        ]
      }
    ];

    // ========== THỂ THAO ==========
    const sportsData = [
      {
        tieuDe: "Bộ tạ tay Reebok 2x10kg - Kèm giá để",
        moTa: "Bộ tạ tay Reebok 2 quả 10kg, tổng 20kg. Bọc cao su không gây ồn, không trầy sàn. Kèm giá để tạ chắc chắn. Phù hợp tập gym tại nhà, luyện tay, vai, ngực. Mua mới 3 tháng.",
        gia: 1200000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 3, TP.HCM",
        loaiGia: "ban",
        tags: ["tạ tay", "reebok", "gym", "fitness", "dụng cụ tập"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500"
        ]
      },
      {
        tieuDe: "Thảm tập Yoga Adidas 6mm - Màu tím",
        moTa: "Thảm tập Yoga Adidas dày 6mm, màu tím lavender. Chất liệu TPE an toàn, chống trượt tốt. Kích thước 183x61cm chuẩn. Nhẹ, dễ cuộn, kèm túi đựng và dây buộc. Mới dùng 5 lần.",
        gia: 650000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 7, TP.HCM",
        loaiGia: "trao-doi",
        tags: ["thảm yoga", "adidas", "yoga mat", "fitness", "thể dục"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500"
        ]
      },
      {
        tieuDe: "Xe đạp tập thể dục Elip - Có màn hình LCD",
        moTa: "Xe đạp tập thể dục Elip, có màn hình LCD hiển thị tốc độ, km, calories. Yên ngồi êm, tay cầm bọc xốp chống trượt. Điều chỉnh được 8 mức độ. Gấp gọn, tiết kiệm không gian. Như mới.",
        gia: 2800000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận Bình Thạnh, TP.HCM",
        loaiGia: "ban",
        tags: ["xe đạp tập", "elip", "cardio", "máy tập", "gym"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500"
        ]
      },
      {
        tieuDe: "Bóng đá Adidas Champions League - Size 5",
        moTa: "Bóng đá Adidas Champions League chính hãng, size 5 chuẩn FIFA. Da PU cao cấp, đường may chắc chắn. Độ nảy tốt, chơi sân cỏ tự nhiên và nhân tạo. Bơm sẵn, dùng ngay.",
        gia: 850000,
        tinhTrang: "tot",
        diaDiem: "Quận 10, TP.HCM",
        loaiGia: "cho-mien-phi",
        tags: ["bóng đá", "adidas", "football", "soccer ball", "thể thao"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=500"
        ]
      },
      {
        tieuDe: "Găng tay Boxing Everlast - Size M",
        moTa: "Găng tay Boxing Everlast màu đen đỏ, size M (12oz). Chất liệu da tổng hợp bền, lót xốp đệm tốt. Quấn cổ tay chắc chắn, bảo vệ xương. Tập Muay, Boxing, MMA đều được. Mua hãng 8 tháng.",
        gia: 1400000,
        tinhTrang: "tot",
        diaDiem: "Quận 1, TP.HCM",
        loaiGia: "ban",
        tags: ["găng tay boxing", "everlast", "muay", "boxing gloves", "võ thuật"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500"
        ]
      },
      {
        tieuDe: "Dây nhảy thể dục Speed Rope - Có đếm số",
        moTa: "Dây nhảy thể dục Speed Rope cao cấp, có bộ đếm số tự động. Dây thép bọc PVC, tay cầm xốp chống trượt. Điều chỉnh chiều dài linh hoạt. Nhảy êm, không rối. Pin xài 6 tháng.",
        gia: 280000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 5, TP.HCM",
        loaiGia: "trao-doi",
        tags: ["dây nhảy", "jump rope", "cardio", "fitness", "giảm cân"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500"
        ]
      }
    ];

    // ========== KHÁC ==========
    const otherData = [
      {
        tieuDe: "Cây cảnh Kim Ngân - Chậu sứ trắng",
        moTa: "Cây Kim Ngân phong thủy trồng trong chậu sứ trắng cao 40cm. Cây khỏe, lá xanh mướt. Dễ chăm sóc, ít tưới nước. Hợp phong thủy, đặt bàn làm việc hoặc phòng khách đều đẹp.",
        gia: 350000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 9, TP.HCM",
        loaiGia: "ban",
        tags: ["cây cảnh", "kim ngân", "phong thủy", "trang trí", "plant"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=500"
        ]
      },
      {
        tieuDe: "Đàn guitar Acoustic Yamaha F310 - Gỗ thật",
        moTa: "Đàn guitar Acoustic Yamaha F310 gỗ Spruce nguyên khối. Âm thanh ấm, rõ ràng. Dây Yamaha chính hãng. Kèm bao da, picks, capo. Phù hợp người mới học và chơi lâu năm.",
        gia: 2800000,
        tinhTrang: "tot",
        diaDiem: "Quận Tân Phú, TP.HCM",
        loaiGia: "trao-doi",
        tags: ["guitar", "yamaha", "nhạc cụ", "acoustic guitar", "music"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=500"
        ]
      },
      {
        tieuDe: "Loa Bluetooth JBL Flip 5 - Chống nước IPX7",
        moTa: "Loa Bluetooth JBL Flip 5 màu đen, chống nước IPX7. Âm bass mạnh mẽ, pin 12 giờ. Kết nối 2 loa cùng lúc. Mang đi biển, picnic cực đã. Fullbox, còn BH 10 tháng.",
        gia: 1900000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 2, TP.HCM",
        loaiGia: "ban",
        tags: ["loa bluetooth", "jbl", "speaker", "âm thanh", "portable"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500"
        ]
      },
      {
        tieuDe: "Bộ pha cà phê Espresso Bialetti Moka Express",
        moTa: "Bộ pha cà phê Espresso Bialetti Moka Express 6 cup, nhôm nguyên chất. Made in Italy. Pha cà phê đậm đà như quán. Dùng được trên bếp gas, điện. Bảo quản tốt, không gỉ.",
        gia: 650000,
        tinhTrang: "tot",
        diaDiem: "Quận 1, TP.HCM",
        loaiGia: "cho-mien-phi",
        tags: ["pha cà phê", "bialetti", "moka pot", "coffee maker", "espresso"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500"
        ]
      },
      {
        tieuDe: "Máy sấy tóc Philips 2200W - Ion âm",
        moTa: "Máy sấy tóc Philips công suất 2200W, công nghệ ion âm giảm xơ rối. 3 chế độ nhiệt, 2 tốc độ gió. Nhẹ, sấy nhanh khô. Kèm 2 đầu tạo kiểu. Bảo hành 2 năm.",
        gia: 850000,
        tinhTrang: "nhu-moi",
        diaDiem: "Quận 6, TP.HCM",
        loaiGia: "ban",
        tags: ["máy sấy tóc", "philips", "hair dryer", "chăm sóc tóc", "beauty"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=500"
        ]
      },
      {
        tieuDe: "Đồng hồ thông minh Apple Watch Series 6 - 44mm",
        moTa: "Apple Watch Series 6 GPS 44mm, màu xám Space Gray. Đo nhịp tim, SpO2, ECG. Chống nước 50m. Kết nối iPhone mượt mà. Kèm dây cao su nguyên hãng. Pin 1 ngày rưỡi.",
        gia: 8500000,
        tinhTrang: "tot",
        diaDiem: "Quận 7, TP.HCM",
        loaiGia: "trao-doi",
        tags: ["apple watch", "smartwatch", "đồng hồ", "wearable", "apple"],
        hinhAnh: [
          "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500"
        ]
      }
    ];

    // Combine all data
    const allPostsData = {
      "do-dien-tu": electronicsData,
      "thoi-trang": fashionData,
      "do-gia-dung": householdData,
      "sach-van-phong-pham": booksData,
      "xe-co": vehiclesData,
      "the-thao": sportsData,
      "khac": otherData
    };

    // Create posts
    const createdPosts = [];
    for (const [slug, posts] of Object.entries(allPostsData)) {
      for (const postData of posts) {
        const randomUser = getRandomUser();
        const post = await Post.create({
          ...postData,
          nguoiDang: randomUser._id,
          danhMuc: createdCategories[slug],
          trangThai: "approved"
        });
        createdPosts.push(post);
        console.log(`✅ Tạo bài đăng: ${postData.tieuDe}`);
      }
    }

    // 4. Create ratings for posts
    console.log("⭐ Tạo đánh giá...");
    const positiveComments = [
      "Sản phẩm tốt, đúng như mô tả!",
      "Người bán nhiệt tình, giao hàng nhanh",
      "Chất lượng ok, giá hợp lý",
      "Rất hài lòng, sẽ ủng hộ lần sau",
      "Đóng gói cẩn thận, ship siêu nhanh",
      "Sản phẩm xịn, recommend mọi người",
      "Tốt như mới, mua về dùng luôn",
      "Người bán uy tín, 5 sao"
    ];

    const negativeComments = [
      "Sản phẩm không như mô tả",
      "Giao hàng chậm, thái độ không tốt",
      "Chất lượng kém hơn hình ảnh",
      "Giá hơi cao so với chất lượng",
      "Còn nhiều khuyết điểm không nói rõ",
      "Sản phẩm cũ hơn mô tả",
      "Không đáng tiền lắm"
    ];

    for (const post of createdPosts) {
      // Random 1-3 ratings per post
      const numRatings = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numRatings; i++) {
        const randomReviewer = getRandomUser();
        if (randomReviewer._id.toString() === post.nguoiDang.toString()) continue;

        // 70% positive, 30% negative
        const isPositive = Math.random() > 0.3;
        const rating = isPositive ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 2) + 2; // 4-5 or 2-3
        const comment = isPositive 
          ? positiveComments[Math.floor(Math.random() * positiveComments.length)]
          : negativeComments[Math.floor(Math.random() * negativeComments.length)];

        await Rating.create({
          tuNguoiDung: randomReviewer._id,
          denNguoiDung: post.nguoiDang,
          soSao: rating,
          binhLuan: comment,
          loaiDanhGia: "nguoi-mua" // Người mua đánh giá người bán
        });
      }
    }

    console.log("🎉 Seed đầy đủ data hoàn thành!");
    console.log(`📊 Tổng số bài đăng: ${createdPosts.length}`);
    console.log(`📂 Tổng số danh mục: 7 (bao gồm "Khác")`);

  } catch (error) {
    console.error("❌ Lỗi seed data:", error);
  } finally {
    await mongoose.connection.close();
  }
}

seedFullData();
