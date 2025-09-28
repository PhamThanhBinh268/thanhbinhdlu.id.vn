const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validation, handleValidation } = require("../middleware/validation");

const router = express.Router();

// Tạo JWT token
const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// POST /api/auth/register - Đăng ký tài khoản
router.post(
  "/register",
  validation.register,
  handleValidation,
  async (req, res) => {
    try {
      const { hoTen, email, matKhau, soDienThoai, diaChi } = req.body;

      // Kiểm tra email đã tồn tại
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          message: "Email đã được sử dụng",
          code: "EMAIL_EXISTS",
        });
      }

      // Tạo user mới
      const user = new User({
        hoTen,
        email,
        matKhau,
        soDienThoai,
        diaChi,
      });

      await user.save();

      // Tạo token
      const token = createToken(user._id);

      res.status(201).json({
        message: "Đăng ký thành công",
        user,
        token,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({
        message: "Lỗi server khi đăng ký",
        error: error.message,
      });
    }
  }
);

// POST /api/auth/login - Đăng nhập
router.post("/login", validation.login, handleValidation, async (req, res) => {
  try {
    const { email, soDienThoai, matKhau } = req.body;
    console.log("[LOGIN_ATTEMPT] payload=", {
      email,
      soDienThoaiExists: !!soDienThoai,
    });

    // Xây điều kiện tìm kiếm linh hoạt
    const query = email ? { email } : { soDienThoai };
    console.log("[LOGIN_ATTEMPT] query=", query);
    const user = await User.findOne(query).select("+matKhau");
    if (!user) {
      console.warn("[LOGIN_FAIL_NOT_FOUND]", query);
      return res.status(400).json({
        message: "Thông tin đăng nhập không chính xác",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Kiểm tra trạng thái tài khoản
    if (user.trangThai !== "active") {
      return res.status(400).json({
        message: "Tài khoản đã bị khóa hoặc vô hiệu hóa",
        code: "ACCOUNT_BLOCKED",
      });
    }

    // So sánh mật khẩu
    const isMatch = await user.comparePassword(matKhau);
    if (!isMatch) {
      console.warn("[LOGIN_FAIL_PASSWORD] userId=", user._id);
      return res.status(400).json({
        message: "Thông tin đăng nhập không chính xác",
        code: "INVALID_CREDENTIALS",
      });
    }

    // Tạo token
    const token = createToken(user._id);

    // Loại bỏ password khỏi response
    const userResponse = user.toJSON();

    res.json({
      message: "Đăng nhập thành công",
      user: userResponse,
      token,
    });
    console.log("[LOGIN_SUCCESS] userId=", user._id);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Lỗi server khi đăng nhập",
      error: error.message,
    });
  }
});

// GET /api/auth/me - Lấy thông tin user hiện tại
router.get(
  "/me",
  require("../middleware/auth").authenticateToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      res.json({
        message: "Lấy thông tin thành công",
        user,
      });
    } catch (error) {
      console.error("Get user info error:", error);
      res.status(500).json({
        message: "Lỗi server khi lấy thông tin user",
        error: error.message,
      });
    }
  }
);

// POST /api/auth/refresh - Làm mới token
router.post(
  "/refresh",
  require("../middleware/auth").authenticateToken,
  async (req, res) => {
    try {
      const newToken = createToken(req.user._id);
      res.json({
        message: "Làm mới token thành công",
        token: newToken,
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({
        message: "Lỗi server khi làm mới token",
        error: error.message,
      });
    }
  }
);

module.exports = router;
