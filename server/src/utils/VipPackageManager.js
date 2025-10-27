/**
 * SINGLETON PATTERN
 * VipPackageManager - Quản lý cấu hình gói VIP (chỉ có 1 instance duy nhất)
 */

class VipPackageManager {
  constructor() {
    if (VipPackageManager.instance) {
      return VipPackageManager.instance;
    }

    this.packages = this.initializePackages();
    VipPackageManager.instance = this;
  }

  /**
   * Khởi tạo cấu hình gói VIP
   */
  initializePackages() {
    return {
      basic: {
        name: "basic",
        displayName: "Gói Cơ Bản",
        description: "Dành cho mỗi giới BDS có giỏ hàng nhỏ",
        price: 470000,
        postLimit: 20,
        postDuration: 15,
        displayOrder: 1,
        isBestSeller: false,
        isActive: true,
      },
      professional: {
        name: "professional",
        displayName: "Gói Chuyên Nghiệp",
        description: "Dành cho mỗi giới BDS chuyên nghiệp có giỏ hàng lớn",
        price: 790000,
        postLimit: 50,
        postDuration: 15,
        displayOrder: 2,
        isBestSeller: true,
        isActive: true,
      },
      vip: {
        name: "vip",
        displayName: "Gói VIP",
        description:
          "Giải pháp trọn gói, lợi ích toàn diện cho mỗi giới BDS chuyên nghiệp",
        price: 2200000,
        postLimit: 60,
        postDuration: 15,
        displayOrder: 3,
        isBestSeller: false,
        isActive: true,
      },
    };
  }

  /**
   * Lấy cấu hình gói VIP theo tên
   */
  getPackage(packageName) {
    return this.packages[packageName] || null;
  }

  /**
   * Lấy tất cả gói VIP
   */
  getAllPackages() {
    return Object.values(this.packages);
  }

  /**
   * Kiểm tra gói VIP có tồn tại không
   */
  isValidPackage(packageName) {
    return !!this.packages[packageName];
  }

  /**
   * Lấy instance (Singleton)
   */
  static getInstance() {
    if (!VipPackageManager.instance) {
      VipPackageManager.instance = new VipPackageManager();
    }
    return VipPackageManager.instance;
  }
}

// Đảm bảo chỉ có 1 instance
const instance = new VipPackageManager();
Object.freeze(instance);

module.exports = VipPackageManager;
