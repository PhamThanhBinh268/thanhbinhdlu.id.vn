/**
 * DECORATOR PATTERN
 * Thêm các tính năng bổ sung cho user khi có VIP
 */

/**
 * Base Component - User cơ bản
 */
class BaseUser {
  constructor(user) {
    this.user = user;
  }

  getPermissions() {
    return {
      canCreatePost: true,
      postLimit: 5,
      postDuration: 7,
      maxImages: 5,
      hasHighlight: false,
      hasBadge: false,
      hasPrioritySupport: false,
      hasAdvancedFeatures: false,
      approvalTime: "24 giờ",
    };
  }

  getDisplayBadge() {
    return null;
  }

  getUserInfo() {
    return {
      ...this.user,
      vipStatus: "none",
      permissions: this.getPermissions(),
    };
  }
}

/**
 * Decorator - VIP Decorator base
 */
class VipDecorator extends BaseUser {
  constructor(user, subscription) {
    super(user);
    this.subscription = subscription;
  }

  getPermissions() {
    return super.getPermissions();
  }
}

/**
 * Concrete Decorator - Basic Package
 */
class BasicVipDecorator extends VipDecorator {
  getPermissions() {
    const basePermissions = super.getPermissions();
    return {
      ...basePermissions,
      postLimit: 20,
      postDuration: 15,
      maxImages: 10,
      approvalTime: "dưới 24 giờ",
    };
  }

  getDisplayBadge() {
    return {
      type: "basic",
      label: "Cơ Bản",
      color: "#28a745",
      icon: "fa-star",
    };
  }

  getUserInfo() {
    return {
      ...this.user,
      vipStatus: "basic",
      vipBadge: this.getDisplayBadge(),
      permissions: this.getPermissions(),
      subscription: this.subscription,
    };
  }
}

/**
 * Concrete Decorator - Professional Package
 */
class ProfessionalVipDecorator extends VipDecorator {
  getPermissions() {
    const basePermissions = super.getPermissions();
    return {
      ...basePermissions,
      postLimit: 50,
      postDuration: 15,
      maxImages: 20,
      hasHighlight: true,
      hasBadge: true,
      hasAdvancedFeatures: true,
      approvalTime: "dưới 12 giờ",
    };
  }

  getDisplayBadge() {
    return {
      type: "professional",
      label: "Chuyên Nghiệp",
      color: "#fd7e14",
      icon: "fa-crown",
    };
  }

  getUserInfo() {
    return {
      ...this.user,
      vipStatus: "professional",
      vipBadge: this.getDisplayBadge(),
      permissions: this.getPermissions(),
      subscription: this.subscription,
    };
  }
}

/**
 * Concrete Decorator - VIP Package
 */
class VipPackageDecorator extends VipDecorator {
  getPermissions() {
    const basePermissions = super.getPermissions();
    return {
      ...basePermissions,
      postLimit: 60,
      postDuration: 15,
      maxImages: 30,
      hasHighlight: true,
      hasBadge: true,
      hasPrioritySupport: true,
      hasAdvancedFeatures: true,
      hasFastApproval: true,
      approvalTime: "dưới 5 phút",
    };
  }

  getDisplayBadge() {
    return {
      type: "vip",
      label: "VIP",
      color: "#ffc107",
      icon: "fa-gem",
    };
  }

  getUserInfo() {
    return {
      ...this.user,
      vipStatus: "vip",
      vipBadge: this.getDisplayBadge(),
      permissions: this.getPermissions(),
      subscription: this.subscription,
    };
  }
}

/**
 * Decorator Factory - Tạo decorator phù hợp
 */
class VipDecoratorFactory {
  static decorate(user, subscription) {
    if (!subscription || subscription.status !== "active") {
      return new BaseUser(user);
    }

    const decoratorMap = {
      basic: BasicVipDecorator,
      professional: ProfessionalVipDecorator,
      vip: VipPackageDecorator,
    };

    const DecoratorClass = decoratorMap[subscription.packageName] || BaseUser;
    return new DecoratorClass(user, subscription);
  }
}

module.exports = {
  BaseUser,
  VipDecorator,
  BasicVipDecorator,
  ProfessionalVipDecorator,
  VipPackageDecorator,
  VipDecoratorFactory,
};
