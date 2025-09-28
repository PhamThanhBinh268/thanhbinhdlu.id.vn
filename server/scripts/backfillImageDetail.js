// Script: backfillImageDetail.js
// Mục đích: tạo hinhAnhChiTiet từ hinhAnh cũ (không có publicId vì không lưu trước đó)
// Chạy: node scripts/backfillImageDetail.js
require("dotenv").config();
const mongoose = require("mongoose");
const Post = require("../src/models/Post");

(async () => {
  const mongoURI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/oldmarket";
  await mongoose.connect(mongoURI);
  console.log("Connected to MongoDB");

  const posts = await Post.find({
    hinhAnh: { $exists: true, $ne: [] },
    $or: [
      { hinhAnhChiTiet: { $exists: false } },
      { hinhAnhChiTiet: { $size: 0 } },
    ],
  });

  console.log("Need backfill:", posts.length);
  for (const p of posts) {
    p.hinhAnhChiTiet = p.hinhAnh.map((url) => ({ url, publicId: null }));
    await p.save();
    console.log("Updated post", p._id.toString());
  }

  await mongoose.disconnect();
  console.log("Done");
})();
