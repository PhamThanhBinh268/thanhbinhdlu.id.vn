const { MongoClient } = require("mongodb");
require("dotenv").config();

async function checkUsers() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log("🔗 Kết nối MongoDB Atlas thành công");

    const db = client.db("oldmarket");
    const users = db.collection("users");

    // Lấy tất cả users
    const allUsers = await users.find({}).toArray();

    console.log(`\n📊 Tổng số tài khoản đã đăng ký: ${allUsers.length}\n`);

    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.hoTen}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📱 SĐT: ${user.soDienThoai}`);
      console.log(`   📍 Địa chỉ: ${user.diaChi}`);
      console.log(`   👤 Vai trò: ${user.vaiTro}`);
      console.log(`   ⭐ Điểm uy tín: ${user.diemUyTin}`);
      console.log(
        `   📅 Ngày đăng ký: ${new Date(user.createdAt).toLocaleString(
          "vi-VN"
        )}`
      );
      console.log(`   🔥 Trạng thái: ${user.trangThai}`);
      console.log("   ---");
    });
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    await client.close();
  }
}

checkUsers();
