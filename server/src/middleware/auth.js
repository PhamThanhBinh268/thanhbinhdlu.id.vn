const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware xác thực JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: "Access token không được cung cấp",
        code: "NO_TOKEN",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra user còn tồn tại và active
    const user = await User.findById(decoded.userId);
    if (!user || user.trangThai !== "active") {
      return res.status(401).json({
        message: "Token không hợp lệ hoặc user đã bị khóa",
        code: "INVALID_TOKEN",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token đã hết hạn",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Token không hợp lệ",
        code: "INVALID_TOKEN",
      });
    }

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      message: "Lỗi xác thực",
      code: "AUTH_ERROR",
    });
  }
};

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  console.log("🔐 requireAdmin middleware - User:", req.user?.email, "Role:", req.user?.vaiTro);
  
  if (req.user && req.user.vaiTro === "admin") {
    console.log("✅ User is admin, proceeding...");
    next();
  } else {
    console.log("❌ User is NOT admin or not authenticated");
    return res.status(403).json({
      message: "Bạn không có quyền truy cập tính năng này",
      code: "FORBIDDEN",
    });
  }
};

// Middleware tùy chọn (không bắt buộc đăng nhập)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (user && user.trangThai === "active") {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Không làm gì, chỉ đi tiếp mà không có user
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
};
