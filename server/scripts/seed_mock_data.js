/*
 Seed a large volume of mock data for categories, users, posts and ratings.
 - Ensures enough categories (including "Khác")
 - Creates demo users if not present
 - Creates many posts across categories with status=approved
 - Mix of selling (loaiGia=ban) and exchange (loaiGia=trao-doi), but mostly selling
 - Generates many ratings (both positive and negative) for posts
*/

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../src/models/User");
const Category = require("../src/models/Category");
const Post = require("../src/models/Post");

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateWithin(daysBack = 60) {
  const now = Date.now();
  const past = now - rand(0, daysBack) * 24 * 60 * 60 * 1000;
  return new Date(past);
}

async function upsertCategories() {
  const list = [
    { tenDanhMuc: "Điện Thoại", icon: "fas fa-mobile-alt" },
    { tenDanhMuc: "Laptop - PC", icon: "fas fa-laptop" },
    { tenDanhMuc: "Máy Ảnh", icon: "fas fa-camera" },
    { tenDanhMuc: "Âm Thanh", icon: "fas fa-headphones" },
    { tenDanhMuc: "Đồng Hồ", icon: "fas fa-watch" },
    { tenDanhMuc: "Thời Trang", icon: "fas fa-tshirt" },
    { tenDanhMuc: "Giày Dép", icon: "fas fa-shoe-prints" },
    { tenDanhMuc: "Đồ Gia Dụng", icon: "fas fa-home" },
    { tenDanhMuc: "Sách - VPP", icon: "fas fa-book" },
    { tenDanhMuc: "Xe Cộ", icon: "fas fa-motorcycle" },
    { tenDanhMuc: "Thể Thao", icon: "fas fa-dumbbell" },
    { tenDanhMuc: "Khác", icon: "fas fa-box" },
  ];

  const results = [];
  for (const c of list) {
    let doc = await Category.findOne({ tenDanhMuc: c.tenDanhMuc });
    if (!doc) {
      doc = await Category.create({ ...c, trangThai: "active" });
    }
    results.push(doc);
  }
  return results;
}

async function ensureUsers(count = 30) {
  const existing = await User.countDocuments();
  if (existing >= count) {
    return User.find().limit(count);
  }
  const arr = [];
  for (let i = 0; i < count - existing; i++) {
    const idx = existing + i + 1;
    const user = new User({
      hoTen: `Người Dùng ${idx}`,
      email: `user${idx}@example.com`,
      matKhau: "123456",
      soDienThoai: `09${rand(10000000, 99999999)}`,
      diaChi: pick(["Hà Nội", "TP.HCM", "Đà Nẵng", "Cần Thơ", "Hải Phòng"]),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent("ND"+idx)}&background=FFD333&color=3D464D`,
    });
    arr.push(user.save());
  }
  await Promise.all(arr);
  return User.find().limit(count);
}

const sampleTitles = [
  "iPhone 12 Pro Max", "Samsung Galaxy S22", "MacBook Pro 14", "Dell XPS 13",
  "Sony A7 III", "Canon EOS R6", "Tai nghe Sony WH-1000XM4", "Loa JBL Charge",
  "Đồng hồ Apple Watch Series 7", "Giày Nike Air Max", "Áo khoác Uniqlo",
  "Nồi chiên không dầu", "Bàn phím cơ Keychron", "Xe đạp thể thao Giant",
  "Sách Lập Trình JavaScript", "Màn hình LG 27 inch", "Router Wi-Fi Asus",
];

const sampleImages = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
  "https://images.unsplash.com/photo-1512499617640-c2f999098c09?w=800",
  "https://images.unsplash.com/photo-1510557880182-3d4d3cba35b1?w=800",
  "https://images.unsplash.com/photo-1511381939415-c1e8453a2832?w=800",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
];

const positiveComments = [
  "Sản phẩm rất tốt, đáng tiền!",
  "Giao hàng nhanh, tư vấn nhiệt tình.",
  "Hình như mô tả, chất lượng ổn.",
  "Rất hài lòng, sẽ ủng hộ tiếp.",
  "Đóng gói kỹ, dùng mượt mà.",
];

const negativeComments = [
  "Chất lượng chưa như mong đợi.",
  "Giao hàng hơi chậm.",
  "Sản phẩm có vết xước nhẹ.",
  "Hơi ồn, pin tụt nhanh.",
  "Đóng gói sơ sài.",
];

function buildRandomPost({ sellerId, categories }) {
  const title = pick(sampleTitles) + " - " + rand(1, 9999);
  const cat = pick(categories);
  const selling = Math.random() < 0.8; // 80% là bán
  const gia = selling ? rand(50000, 30000000) : 0;
  const city = pick(["TP.HCM", "Hà Nội", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Bình Dương", "Đồng Nai"]);
  return {
    tieuDe: title,
    moTa:
      "Mô tả tự động cho sản phẩm thử nghiệm. Sản phẩm được tạo ngẫu nhiên để test hiển thị danh sách.",
    gia,
    loaiGia: selling ? "ban" : "trao-doi",
    hinhAnh: [pick(sampleImages)],
    danhMuc: cat._id,
    nguoiDang: sellerId,
    diaDiem: city,
    tinhTrang: pick(["moi", "nhu-moi", "tot", "can-sua-chua"]),
    trangThai: "approved",
    createdAt: randomDateWithin(60),
    updatedAt: new Date(),
    tags: ["seed", cat.tenDanhMuc.toLowerCase()]
  };
}

function buildRandomRatings({ post, users }) {
  const ratings = [];
  const n = rand(0, 50); // số lượt đánh giá mỗi bài
  for (let i = 0; i < n; i++) {
    let rater = pick(users);
    // tránh tự đánh giá bài của mình
    let tryCount = 0;
    while (rater._id.toString() === post.nguoiDang.toString() && tryCount < 5) {
      rater = pick(users);
      tryCount++;
    }
    const good = Math.random() < 0.7; // 70% tích cực
    const score = good ? rand(4, 5) : rand(1, 3);
    const comment = good ? pick(positiveComments) : pick(negativeComments);
    ratings.push({
      nguoiDanhGia: rater._id,
      diemDanhGia: score,
      binhLuan: comment,
      ngayDanhGia: randomDateWithin(60),
    });
  }
  return ratings;
}

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/oldmarket";
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");

  const categories = await upsertCategories();
  const users = await ensureUsers(40);

  // Create posts in bulk
  const totalPostsToCreate = 120;
  const sellers = users; // any user can be a seller
  const docs = [];
  for (let i = 0; i < totalPostsToCreate; i++) {
    const seller = pick(sellers);
    const doc = buildRandomPost({ sellerId: seller._id, categories });
    // push now and add ratings later after insert to have post id
    docs.push(doc);
  }

  console.log(`📝 Inserting ${docs.length} posts...`);
  const inserted = await Post.insertMany(docs, { ordered: false });
  console.log(`✅ Inserted ${inserted.length} posts`);

  // Attach ratings
  console.log("⭐ Generating ratings for posts...");
  const updates = [];
  for (const p of inserted) {
    const ratings = buildRandomRatings({ post: p, users });
    updates.push(
      Post.findByIdAndUpdate(
        p._id,
        { $set: { danhGia: ratings } },
        { new: false }
      )
    );
  }
  await Promise.all(updates);
  console.log("✅ Ratings generated");

  console.log("🎉 Mock data seeding complete!");
  await mongoose.connection.close();
}

run().catch(async (e) => {
  console.error("❌ Seed error:", e);
  try { await mongoose.connection.close(); } catch(_) {}
  process.exit(1);
});
