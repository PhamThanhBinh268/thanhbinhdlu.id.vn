const mongoose = require("mongoose");
require("dotenv").config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔗 Kết nối MongoDB thành công");

    // Drop slug index from categories collection
    try {
      await mongoose.connection.db.collection("categories").dropIndex("slug_1");
      console.log("✅ Đã xóa index slug_1 từ categories");
    } catch (error) {
      console.log("ℹ️ Index slug_1 không tồn tại hoặc đã bị xóa");
    }

    // List all indexes
    const indexes = await mongoose.connection.db
      .collection("categories")
      .indexes();
    console.log("📋 Các index hiện tại trong categories:");
    indexes.forEach((index) => {
      console.log(`  - ${JSON.stringify(index.key)}: ${index.name}`);
    });

    console.log("✅ Hoàn thành");
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await mongoose.connection.close();
  }
}

fixIndexes();
