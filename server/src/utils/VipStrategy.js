/**
 * STRATEGY PATTERN
 * Định nghĩa các chiến lược khác nhau cho từng gói VIP
 */

/**
 * Base Strategy - Chiến lược cơ bản cho user thường
 */
class UserStrategy {
  getPostLimit() {
    return 5; // User thường chỉ đăng được 5 tin
  }

  getPostDuration() {
    return 7; // Tin đăng hiển thị 7 ngày
  }

  hasHighlightPost() {
    return false;
  }

  hasBadge() {
    return false;
  }

  hasPrioritySupport() {
    return false;
  }

  hasAdvancedFeatures() {
    return false;
  }

  hasFastApproval() {
    return false;
  }

  getMaxImages() {
    return 5;
  }

  canCreatePost() {
    return true;
  }

  getApprovalTime() {
    return "24 giờ";
  }

  getFeaturesList() {
    return [
      "Đăng tin miễn phí",
      "Tối đa 5 tin đăng đồng thời",
      "Tin hiển thị 7 ngày",
      "Tối đa 5 hình ảnh/tin",
      "Duyệt tin trong 24 giờ",
    ];
  }
}

/**
 * Basic Strategy - Gói Cơ Bản
 */
class BasicStrategy extends UserStrategy {
  getPostLimit() {
    return 20;
  }

  getPostDuration() {
    return 15;
  }

  getMaxImages() {
    return 10;
  }

  getApprovalTime() {
    return "dưới 24 giờ";
  }

  getFeaturesList() {
    return [
      "20 tin đăng - hiển thị 15 ngày",
      "Hiển thị đa 30 tin đăng",
      "Ưu đãi nâng cấp lên Tin nổi bật - nhiều hình ảnh",
      "Duyệt tin nhanh dưới 24 giờ",
    ];
  }
}

/**
 * Professional Strategy - Gói Chuyên Nghiệp
 */
class ProfessionalStrategy extends UserStrategy {
  getPostLimit() {
    return 50;
  }

  getPostDuration() {
    return 15;
  }

  hasHighlightPost() {
    return true;
  }

  hasBadge() {
    return true;
  }

  hasAdvancedFeatures() {
    return true;
  }

  getMaxImages() {
    return 20;
  }

  getApprovalTime() {
    return "dưới 12 giờ";
  }

  getFeaturesList() {
    return [
      "50 tin đăng - hiển thị 15 ngày",
      "Không giới hạn tin đăng",
      "Bảo cáo hiệu suất tin đăng",
      "Thêm kênh liên hệ mới",
      "Công cụ quản lý khách hàng tiềm năng",
      "Ưu đãi nâng cấp lên Tin nổi bật - nhiều hình ảnh",
      "Duyệt tin nhanh dưới 12 giờ",
    ];
  }
}

/**
 * VIP Strategy - Gói VIP
 */
class VipStrategy extends UserStrategy {
  getPostLimit() {
    return 60;
  }

  getPostDuration() {
    return 15;
  }

  hasHighlightPost() {
    return true;
  }

  hasBadge() {
    return true;
  }

  hasPrioritySupport() {
    return true;
  }

  hasAdvancedFeatures() {
    return true;
  }

  hasFastApproval() {
    return true;
  }

  getMaxImages() {
    return 30;
  }

  getApprovalTime() {
    return "dưới 5 phút";
  }

  getFeaturesList() {
    return [
      "60 tin đăng - hiển thị 15 ngày",
      "Không giới hạn tin đăng",
      "Bảo cáo hiệu suất tin đăng",
      "Thêm kênh liên hệ mới",
      "Công cụ quản lý khách hàng tiềm năng",
      "Ưu đãi nâng cấp lên Tin nổi bất - nhiều hình ảnh",
      "Duyệt tin nhanh dưới 5 phút",
    ];
  }
}

/**
 * Strategy Context - Chọn strategy phù hợp
 */
class VipStrategyContext {
  constructor(subscription) {
    this.setStrategy(subscription);
  }

  setStrategy(subscription) {
    if (!subscription) {
      this.strategy = new UserStrategy();
      return;
    }

    const strategyMap = {
      basic: BasicStrategy,
      professional: ProfessionalStrategy,
      vip: VipStrategy,
    };

    const StrategyClass = strategyMap[subscription.packageName] || UserStrategy;
    this.strategy = new StrategyClass();
  }

  // Delegate methods to strategy
  getPostLimit() {
    return this.strategy.getPostLimit();
  }

  getPostDuration() {
    return this.strategy.getPostDuration();
  }

  hasHighlightPost() {
    return this.strategy.hasHighlightPost();
  }

  hasBadge() {
    return this.strategy.hasBadge();
  }

  hasPrioritySupport() {
    return this.strategy.hasPrioritySupport();
  }

  hasAdvancedFeatures() {
    return this.strategy.hasAdvancedFeatures();
  }

  hasFastApproval() {
    return this.strategy.hasFastApproval();
  }

  getMaxImages() {
    return this.strategy.getMaxImages();
  }

  canCreatePost() {
    return this.strategy.canCreatePost();
  }

  getApprovalTime() {
    return this.strategy.getApprovalTime();
  }

  getFeaturesList() {
    return this.strategy.getFeaturesList();
  }
}

module.exports = {
  UserStrategy,
  BasicStrategy,
  ProfessionalStrategy,
  VipStrategy,
  VipStrategyContext,
};
