// =============================================================================
// VIP Packages Page - Optimized with Design Patterns
// =============================================================================

/**
 * VIP Package Service - Singleton Pattern
 * Quản lý tất cả các API calls liên quan đến VIP packages
 */
class VipPackageService {
  static instance = null;

  static getInstance() {
    if (!VipPackageService.instance) {
      VipPackageService.instance = new VipPackageService();
    }
    return VipPackageService.instance;
  }

  constructor() {
    if (VipPackageService.instance) {
      return VipPackageService.instance;
    }
    this.baseUrl = API_CONFIG.BASE_URL + "/vip-packages";
  }

  /**
   * Lấy danh sách tất cả gói VIP
   */
  async getAllPackages() {
    try {
      const response = await ApiService.request("/vip-packages");
      return response.data;
    } catch (error) {
      console.error("Error fetching VIP packages:", error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết một gói VIP
   */
  async getPackageDetail(packageName) {
    try {
      const response = await ApiService.request(`/vip-packages/${packageName}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching package detail:", error);
      throw error;
    }
  }

  /**
   * Đăng ký gói VIP
   */
  async subscribe(packageName, paymentMethod) {
    try {
      const response = await ApiService.request("/vip-packages/subscribe", {
        method: "POST",
        body: JSON.stringify({ packageName, paymentMethod }),
      });
      return response.data;
    } catch (error) {
      console.error("Error subscribing to VIP:", error);
      throw error;
    }
  }

  /**
   * Lấy thông tin gói VIP hiện tại của user
   */
  async getMySubscription() {
    try {
      const response = await ApiService.request("/vip-packages/my-subscription");
      return response.data;
    } catch (error) {
      console.error("Error fetching my subscription:", error);
      throw error;
    }
  }

  /**
   * Khởi tạo dữ liệu gói VIP (chỉ dùng 1 lần)
   */
  async initPackages() {
    try {
      const response = await ApiService.request("/vip-packages/init", {
        method: "POST",
      });
      return response.data;
    } catch (error) {
      console.error("Error initializing packages:", error);
      throw error;
    }
  }
}

/**
 * VIP Card Renderer - Factory Pattern
 * Tạo HTML cho các card VIP
 */
class VipCardFactory {
  static createCard(packageData) {
    const { name, displayName, description, price, postLimit, postDuration, isBestSeller, features } =
      packageData;

    const cardClass = this.getCardClass(name);
    const bestSellerBadge = isBestSeller ? "best-seller" : "";

    return `
      <div class="col-lg-4 col-md-6 mb-4" data-package="${name}">
        <div class="vip-card ${cardClass} ${bestSellerBadge}">
          <div class="vip-name">
            ${displayName}
            ${this.getIcon(name)}
          </div>
          <div class="vip-price">
            ${this.formatPrice(price)}
            <small>VNĐ</small>
          </div>
          <div class="vip-duration">
            ${postLimit} bài đăng / ${postDuration} ngày
          </div>
          <div class="vip-description text-muted mb-3">
            ${description}
          </div>
          <ul class="vip-features">
            ${features ? features.map((feature) => `
              <li>
                <i class="fas fa-check-circle"></i>
                <span>${feature}</span>
              </li>
            `).join("") : this.getDefaultFeatures(name)}
          </ul>
          <button class="vip-subscribe-btn" data-package="${name}" data-price="${price}" data-name="${displayName}">
            Đăng Ký Ngay
          </button>
        </div>
      </div>
    `;
  }

  static getCardClass(name) {
    const classMap = {
      basic: "basic",
      professional: "professional",
      vip: "vip",
    };
    return classMap[name] || "basic";
  }

  static getIcon(name) {
    const iconMap = {
      basic: '<i class="fas fa-star text-muted"></i>',
      professional: '<i class="fas fa-crown text-primary"></i>',
      vip: '<i class="fas fa-gem text-warning"></i>',
    };
    return iconMap[name] || "";
  }

  static formatPrice(price) {
    return new Intl.NumberFormat("vi-VN").format(price);
  }

  static getDefaultFeatures(name) {
    const featuresMap = {
      basic: [
        "20 bài đăng trong 30 ngày",
        "Hiển thị 5 hình ảnh/bài",
        "Duyệt bài trong 24h",
        "Hỗ trợ cơ bản",
      ],
      professional: [
        "50 bài đăng trong 30 ngày",
        "Hiển thị 8 hình ảnh/bài",
        "Duyệt bài trong 6h",
        "Badge Professional",
        "Ưu tiên hiển thị",
        "Hỗ trợ ưu tiên",
      ],
      vip: [
        "60 bài đăng trong 30 ngày",
        "Hiển thị 10 hình ảnh/bài",
        "Duyệt bài trong 2h",
        "Badge VIP độc quyền",
        "Ưu tiên cao nhất",
        "Hỗ trợ VIP 24/7",
        "Tính năng nâng cao",
      ],
    };

    return (
      featuresMap[name]
        ?.map(
          (f) => `
      <li>
        <i class="fas fa-check-circle"></i>
        <span>${f}</span>
      </li>
    `
        )
        .join("") || ""
    );
  }
}

/**
 * UI Manager - Strategy Pattern
 * Quản lý các thao tác UI
 */
class VipUIManager {
  constructor() {
    this.service = VipPackageService.getInstance();
    this.selectedPackage = null;
    this.selectedPaymentMethod = null;
  }

  /**
   * Khởi tạo page
   */
  async init() {
    try {
      // Load packages và subscription song song
      const [packages, subscription] = await Promise.all([
        this.service.getAllPackages(),
        this.loadMySubscription(),
      ]);

      this.renderPackages(packages);
      this.setupEventListeners();
    } catch (error) {
      this.showError("Không thể tải dữ liệu gói VIP");
    }
  }

  /**
   * Load thông tin subscription hiện tại
   */
  async loadMySubscription() {
    try {
      if (!AuthManager.isLoggedIn()) return null;

      const subscription = await this.service.getMySubscription();
      if (subscription) {
        this.renderMySubscription(subscription);
      }
      return subscription;
    } catch (error) {
      console.error("Error loading subscription:", error);
      return null;
    }
  }

  /**
   * Render danh sách gói VIP
   */
  renderPackages(packages) {
    const container = $("#vipPackagesContainer");

    if (!packages || packages.length === 0) {
      container.html(`
        <div class="col-12 text-center py-5">
          <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
          <p class="text-muted">Chưa có gói VIP nào</p>
        </div>
      `);
      return;
    }

    // Sắp xếp: Basic, Professional, VIP
    const sortedPackages = packages.sort((a, b) => a.displayOrder - b.displayOrder);

    const html = sortedPackages.map((pkg) => VipCardFactory.createCard(pkg)).join("");
    container.html(html);
  }

  /**
   * Render thông tin subscription hiện tại
   */
  renderMySubscription(subscription) {
    if (!subscription) return;

    const { subscription: subData, features, userInfo } = subscription;

    const endDate = new Date(subData.endDate);
    const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

    const html = `
      <div class="my-subscription-card">
        <div class="subscription-info">
          <div>
            <h3>
              <i class="fas fa-crown"></i> Gói VIP Hiện Tại
            </h3>
            <div class="subscription-badge">
              ${subData.packageName.toUpperCase()}
            </div>
          </div>
          <div class="subscription-stats">
            <div class="stat-item">
              <span class="stat-value">${subData.postsRemaining}</span>
              <span class="stat-label">Bài đăng còn lại</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${daysRemaining}</span>
              <span class="stat-label">Ngày còn lại</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${features?.maxImages || 5}</span>
              <span class="stat-label">Hình ảnh/bài</span>
            </div>
          </div>
        </div>
        <div class="mt-3">
          <small>
            <i class="far fa-calendar-alt"></i> 
            Hết hạn: ${endDate.toLocaleDateString("vi-VN")}
          </small>
        </div>
      </div>
    `;

    $("#mySubscriptionSection").html(html).show();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Subscribe button click
    $(document).on("click", ".vip-subscribe-btn", (e) => {
      const btn = $(e.currentTarget);
      this.selectedPackage = {
        name: btn.data("package"),
        displayName: btn.data("name"),
        price: btn.data("price"),
      };

      if (!AuthManager.isLoggedIn()) {
        this.showLoginRequired();
        return;
      }

      this.showPaymentModal();
    });

    // Payment method selection
    $(".payment-method").on("click", (e) => {
      $(".payment-method").removeClass("selected");
      $(e.currentTarget).addClass("selected");
      this.selectedPaymentMethod = $(e.currentTarget).data("method");
      $("#confirmPaymentBtn").prop("disabled", false);
    });

    // Confirm payment
    $("#confirmPaymentBtn").on("click", () => {
      this.confirmSubscription();
    });
  }

  /**
   * Hiển thị modal thanh toán
   */
  showPaymentModal() {
    const { displayName, price } = this.selectedPackage;
    const formattedPrice = VipCardFactory.formatPrice(price);

    $("#selectedPackageInfo").html(`
      <strong>Gói đã chọn:</strong> ${displayName}<br>
      <strong>Giá:</strong> ${formattedPrice} VNĐ
    `);

    $(".payment-method").removeClass("selected");
    this.selectedPaymentMethod = null;
    $("#confirmPaymentBtn").prop("disabled", true);

    $("#paymentModal").modal("show");
  }

  /**
   * Xác nhận đăng ký
   */
  async confirmSubscription() {
    if (!this.selectedPackage || !this.selectedPaymentMethod) {
      this.showError("Vui lòng chọn phương thức thanh toán");
      return;
    }

    this.showLoading();

    try {
      const result = await this.service.subscribe(
        this.selectedPackage.name,
        this.selectedPaymentMethod
      );

      $("#paymentModal").modal("hide");
      this.hideLoading();

      this.showSuccess("Đăng ký gói VIP thành công!");

      // Reload page sau 2s
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      this.hideLoading();
      const message = error.message || "Đăng ký thất bại. Vui lòng thử lại!";
      this.showError(message);
    }
  }

  /**
   * Hiển thị thông báo yêu cầu đăng nhập
   */
  showLoginRequired() {
    Swal.fire({
      icon: "warning",
      title: "Yêu Cầu Đăng Nhập",
      text: "Vui lòng đăng nhập để đăng ký gói VIP",
      showCancelButton: true,
      confirmButtonText: "Đăng Nhập",
      cancelButtonText: "Hủy",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "/login.html?redirect=" + encodeURIComponent(window.location.pathname);
      }
    });
  }

  /**
   * Hiển thị loading overlay
   */
  showLoading() {
    if ($("#loadingOverlay").length === 0) {
      $("body").append(`
        <div id="loadingOverlay" class="loading-overlay">
          <div class="loading-spinner"></div>
        </div>
      `);
    }
    $("#loadingOverlay").fadeIn();
  }

  /**
   * Ẩn loading overlay
   */
  hideLoading() {
    $("#loadingOverlay").fadeOut();
  }

  /**
   * Hiển thị thông báo lỗi
   */
  showError(message) {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: message,
        confirmButtonText: "Đóng",
      });
    } else {
      alert(message);
    }
  }

  /**
   * Hiển thị thông báo thành công
   */
  showSuccess(message) {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        icon: "success",
        title: "Thành Công",
        text: message,
        confirmButtonText: "OK",
        timer: 2000,
      });
    } else {
      alert(message);
    }
  }
}

// =============================================================================
// Page Initialization
// =============================================================================
$(document).ready(async () => {
  // Load header/footer
  await Promise.all([
    $("#topbarNav").load("/partials/header.html"),
    $("#footerSection").load("/partials/footer.html"),
  ]);

  // Initialize UI Manager
  const uiManager = new VipUIManager();
  await uiManager.init();

  console.log("✅ VIP Packages page loaded successfully");
});
