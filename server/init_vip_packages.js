/**
 * Script khởi tạo dữ liệu gói VIP packages
 * Chỉ chạy 1 lần duy nhất khi setup
 */

require("dotenv").config();
const mongoose = require("mongoose");
const VipPackage = require("./src/models/VipPackage");

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Kết nối MongoDB thành công");
    return initVipPackages();
  })
  .then(() => {
    console.log("✅ Khởi tạo gói VIP thành công");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  });

async function initVipPackages() {
  try {
    // Kiểm tra xem đã có dữ liệu chưa
    const existingCount = await VipPackage.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Đã có ${existingCount} gói VIP trong database`);
      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      return new Promise((resolve) => {
        readline.question("Bạn có muốn xóa và tạo lại? (y/n): ", async (answer) => {
          readline.close();
          if (answer.toLowerCase() === "y") {
            await VipPackage.deleteMany({});
            console.log("🗑️  Đã xóa dữ liệu cũ");
            await createPackages();
            resolve();
          } else {
            console.log("⏭️  Bỏ qua khởi tạo");
            resolve();
          }
        });
      });
    }

    await createPackages();
  } catch (error) {
    console.error("Error in initVipPackages:", error);
    throw error;
  }
}

async function createPackages() {
  const packages = [
    {
      name: "basic",
      displayName: "BASIC",
      description: "Gói cơ bản cho người mới bắt đầu",
      price: 470000,
      postLimit: 20,
      postDuration: 30,
      features: [
        "20 tin đăng mỗi tháng",
        "Hiển thị 30 ngày",
        "Tối đa 8 ảnh/tin",
        "Badge Basic đặc biệt",
        "Hỗ trợ qua email",
      ],
      isActive: true,
      displayOrder: 1,
      isBestSeller: false,
    },
    {
      name: "professional",
      displayName: "PROFESSIONAL",
      description: "Gói chuyên nghiệp cho người dùng thường xuyên",
      price: 790000,
      postLimit: 50,
      postDuration: 45,
      features: [
        "50 tin đăng mỗi tháng",
        "Hiển thị 45 ngày",
        "Tối đa 12 ảnh/tin",
        "Badge Professional đặc biệt",
        "Ưu tiên hiển thị",
        "Hỗ trợ ưu tiên 12h",
        "Phân tích thống kê chi tiết",
        "Duyệt tin trong 12h",
      ],
      isActive: true,
      displayOrder: 2,
      isBestSeller: true, // Gói phổ biến nhất
    },
    {
      name: "vip",
      displayName: "VIP",
      description: "Gói cao cấp cho người dùng chuyên nghiệp",
      price: 2200000,
      postLimit: 60,
      postDuration: 60,
      features: [
        "60 tin đăng mỗi tháng",
        "Hiển thị 60 ngày",
        "Tối đa 15 ảnh/tin",
        "Badge VIP vàng đặc biệt",
        "Ưu tiên hiển thị cao nhất",
        "Hỗ trợ ưu tiên 24/7",
        "Phân tích chuyên sâu",
        "Duyệt tin ngay lập tức",
        "Tư vấn chiến lược bán hàng",
        "Không giới hạn tính năng",
      ],
      isActive: true,
      displayOrder: 3,
      isBestSeller: false,
    },
  ];

  const created = await VipPackage.insertMany(packages);
  console.log(`✨ Đã tạo ${created.length} gói VIP:`);
  created.forEach((pkg) => {
    console.log(`   - ${pkg.displayName}: ${pkg.price.toLocaleString("vi-VN")}đ`);
  });

  return created;
}
