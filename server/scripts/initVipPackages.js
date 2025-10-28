/**
 * Script khởi tạo dữ liệu VIP Packages
 * Chạy 1 lần duy nhất để tạo 3 gói VIP trong database
 */

const mongoose = require("mongoose");
require("dotenv").config();

const VipPackage = require("../src/models/VipPackage");

const packages = [
  {
    name: "basic",
    displayName: "Basic",
    description: "Gói cơ bản cho người mới bắt đầu",
    price: 470000,
    postLimit: 20,
    postDuration: 30,
    isActive: true,
    displayOrder: 1,
    isBestSeller: false,
  },
  {
    name: "professional",
    displayName: "Professional",
    description: "Gói chuyên nghiệp cho người dùng thường xuyên",
    price: 790000,
    postLimit: 50,
    postDuration: 30,
    isActive: true,
    displayOrder: 2,
    isBestSeller: true,
  },
  {
    name: "vip",
    displayName: "VIP",
    description: "Gói VIP cao cấp với nhiều ưu đãi nhất",
    price: 2200000,
    postLimit: 60,
    postDuration: 30,
    isActive: true,
    displayOrder: 3,
    isBestSeller: false,
  },
];

async function initVipPackages() {
  try {
    console.log("🔌 Kết nối MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Kết nối MongoDB thành công");

    // Check if packages already exist
    const existingCount = await VipPackage.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Đã có ${existingCount} gói VIP trong database`);
      console.log("Bạn có muốn xóa và tạo lại? (Ctrl+C để hủy)");
      
      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log("🗑️  Xóa dữ liệu cũ...");
      await VipPackage.deleteMany({});
      console.log("✅ Đã xóa dữ liệu cũ");
    }

    console.log("📦 Tạo gói VIP packages...");
    const created = await VipPackage.insertMany(packages);
    
    console.log("\n✅ Đã tạo thành công các gói VIP:");
    created.forEach(pkg => {
      console.log(`  - ${pkg.displayName}: ${pkg.price.toLocaleString('vi-VN')} VNĐ`);
      console.log(`    ${pkg.postLimit} bài đăng / ${pkg.postDuration} ngày`);
      console.log(`    Best Seller: ${pkg.isBestSeller ? 'Yes' : 'No'}`);
      console.log("");
    });

    console.log("🎉 Khởi tạo hoàn tất!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
}

// Run
initVipPackages();
