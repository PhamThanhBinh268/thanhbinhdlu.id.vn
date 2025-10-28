const express = require("express");
const router = express.Router();
const VipPackage = require("../models/VipPackage");
const VipSubscription = require("../models/VipSubscription");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");
const VipPackageManager = require("../utils/VipPackageManager"); // SINGLETON
const { VipStrategyContext } = require("../utils/VipStrategy"); // STRATEGY
const { VipDecoratorFactory } = require("../utils/VipDecorator"); // DECORATOR

/**
 * GET /api/vip-packages - Lấy danh sách gói VIP
 * Sử dụng Singleton Pattern
 */
router.get("/", async (req, res) => {
  try {
    // Sử dụng Singleton để lấy cấu hình
    const packageManager = VipPackageManager.getInstance();
    const packages = packageManager.getAllPackages();

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    console.error("Error fetching VIP packages:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tải danh sách gói VIP",
    });
  }
});

/**
 * GET /api/vip-packages/:name - Lấy chi tiết gói VIP
 * Sử dụng Singleton Pattern
 */
router.get("/:name", async (req, res) => {
  try {
    const { name } = req.params;
    
    // Sử dụng Singleton
    const packageManager = VipPackageManager.getInstance();
    const packageInfo = packageManager.getPackage(name);

    if (!packageInfo) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy gói VIP",
      });
    }

    // Sử dụng Strategy để lấy features
    const mockSubscription = { packageName: name };
    const strategy = new VipStrategyContext(mockSubscription);

    res.json({
      success: true,
      data: {
        ...packageInfo,
        features: strategy.getFeaturesList(),
      },
    });
  } catch (error) {
    console.error("Error fetching VIP package:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tải thông tin gói VIP",
    });
  }
});

/**
 * POST /api/vip-packages/subscribe - Đăng ký gói VIP
 */
router.post("/subscribe", authenticateToken, async (req, res) => {
  try {
    const { packageName, paymentMethod } = req.body;
    const userId = req.user._id;

    if (!packageName || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin gói VIP hoặc phương thức thanh toán",
      });
    }

    // Sử dụng Singleton để validate package
    const packageManager = VipPackageManager.getInstance();
    if (!packageManager.isValidPackage(packageName)) {
      return res.status(404).json({
        success: false,
        message: "Gói VIP không tồn tại",
      });
    }

    const packageInfo = packageManager.getPackage(packageName);

    // Check if user already has active subscription
    const existingSubscription = await VipSubscription.findActiveForUser(userId);
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "Bạn đang có gói VIP đang hoạt động",
        data: existingSubscription,
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days

    // Create subscription
    const subscription = new VipSubscription({
      user: userId,
      packageName: packageInfo.name,
      startDate,
      endDate,
      postLimit: packageInfo.postLimit,
      postsUsed: 0,
      postsRemaining: packageInfo.postLimit,
      price: packageInfo.price,
      paymentMethod,
      paymentStatus: "completed",
      status: "active",
    });

    await subscription.save();

    // Update user VIP status
    await User.findByIdAndUpdate(userId, {
      vipStatus: packageName,
      vipExpiry: endDate,
    });

    res.json({
      success: true,
      message: "Đăng ký gói VIP thành công",
      data: subscription,
    });
  } catch (error) {
    console.error("Error subscribing to VIP:", error);
    res.status(500).json({
      success: false,
      message: "Không thể đăng ký gói VIP",
      error: error.message,
    });
  }
});

/**
 * GET /api/vip-packages/my-subscription - Lấy thông tin gói VIP hiện tại
 * Sử dụng Strategy Pattern và Decorator Pattern
 */
router.get("/my-subscription", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const subscription = await VipSubscription.findActiveForUser(userId);

    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: "Bạn chưa có gói VIP nào",
      });
    }

    // Sử dụng Strategy để lấy features
    const strategy = new VipStrategyContext(subscription);

    // Sử dụng Decorator để decorate user info
    const user = await User.findById(userId);
    const decoratedUser = VipDecoratorFactory.decorate(user.toObject(), subscription);

    res.json({
      success: true,
      data: {
        subscription,
        userInfo: decoratedUser.getUserInfo(),
        features: {
          postLimit: strategy.getPostLimit(),
          postDuration: strategy.getPostDuration(),
          hasHighlightPost: strategy.hasHighlightPost(),
          hasBadge: strategy.hasBadge(),
          hasPrioritySupport: strategy.hasPrioritySupport(),
          hasAdvancedFeatures: strategy.hasAdvancedFeatures(),
          hasFastApproval: strategy.hasFastApproval(),
          maxImages: strategy.getMaxImages(),
          approvalTime: strategy.getApprovalTime(),
          featuresList: strategy.getFeaturesList(),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tải thông tin gói VIP",
    });
  }
});

/**
 * POST /api/vip-packages/init - Khởi tạo dữ liệu gói VIP
 * Sử dụng Singleton Pattern
 */
router.post("/init", authenticateToken, async (req, res) => {
  try {
    const existingPackages = await VipPackage.countDocuments();
    if (existingPackages > 0) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu gói VIP đã tồn tại",
      });
    }

    // Sử dụng Singleton để lấy cấu hình
    const packageManager = VipPackageManager.getInstance();
    const packageConfigs = packageManager.getAllPackages();

    const packages = await VipPackage.insertMany(packageConfigs);

    res.json({
      success: true,
      message: "Khởi tạo dữ liệu gói VIP thành công",
      data: packages,
    });
  } catch (error) {
    console.error("Error initializing VIP packages:", error);
    res.status(500).json({
      success: false,
      message: "Không thể khởi tạo dữ liệu gói VIP",
      error: error.message,
    });
  }
});

module.exports = router;
