const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
require("dotenv").config();

async function clearData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔗 Kết nối MongoDB thành công");

    // Clear categories
    const categoriesResult = await mongoose.connection.db
      .collection("categories")
      .deleteMany({});
    console.log(`🗑️ Đã xóa ${categoriesResult.deletedCount} categories`);

    // Clear posts
    const postsResult = await mongoose.connection.db
      .collection("posts")
      .deleteMany({});
    console.log(`🗑️ Đã xóa ${postsResult.deletedCount} posts`);

    console.log("✅ Xóa dữ liệu hoàn thành");
  } catch (error) {
    console.error("❌ Lỗi xóa dữ liệu:", error);
  } finally {
    await mongoose.connection.close();
  }
}

clearData();
