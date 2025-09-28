const { body, validationResult } = require("express-validator");

// Validation rules
const validation = {
  // Đăng ký user
  register: [
    body("hoTen")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Họ tên phải từ 2-100 ký tự"),

    body("email").isEmail().normalizeEmail().withMessage("Email không hợp lệ"),

    body("matKhau")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),

    body("soDienThoai")
      .optional()
      .matches(/^[0-9]{10,11}$/)
      .withMessage("Số điện thoại không hợp lệ"),
  ],

  // Đăng nhập
  // Đăng nhập: chấp nhận email HOẶC soDienThoai + mật khẩu
  login: [
    body("email")
      .optional({ nullable: true, checkFalsy: true })
      .isEmail()
      .withMessage("Email không hợp lệ"),
    body("soDienThoai")
      .optional({ nullable: true, checkFalsy: true })
      .matches(/^[0-9]{10,11}$/)
      .withMessage("Số điện thoại không hợp lệ"),
    body("matKhau").notEmpty().withMessage("Mật khẩu là bắt buộc"),
    // Ít nhất phải có email hoặc số điện thoại
    (req, res, next) => {
      if (!req.body.email && !req.body.soDienThoai) {
        return res.status(400).json({
          message: "Vui lòng nhập email hoặc số điện thoại",
          code: "LOGIN_IDENTIFIER_REQUIRED",
        });
      }
      next();
    },
  ],

  // Tạo bài đăng
  createPost: [
    body("tieuDe")
      .trim()
      .isLength({ min: 10, max: 200 })
      .withMessage("Tiêu đề phải từ 10-200 ký tự"),

    body("moTa")
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage("Mô tả phải từ 20-2000 ký tự"),

    body("gia").isFloat({ min: 0 }).withMessage("Giá phải là số không âm"),

    body("danhMuc").isMongoId().withMessage("ID danh mục không hợp lệ"),

    body("loaiGia")
      .optional()
      .isIn(["ban", "trao-doi", "cho-mien-phi"])
      .withMessage("Loại giá không hợp lệ"),

    body("tinhTrang")
      .optional()
      .isIn(["moi", "nhu-moi", "tot", "can-sua-chua"])
      .withMessage("Tình trạng không hợp lệ"),
  ],

  // Gửi tin nhắn
  sendMessage: [
    body("nguoiNhan").isMongoId().withMessage("ID người nhận không hợp lệ"),

    body("noiDung")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Nội dung tin nhắn phải từ 1-1000 ký tự"),

    body("baiDangLienQuan")
      .optional()
      .isMongoId()
      .withMessage("ID bài đăng không hợp lệ"),
  ],

  // Đánh giá
  createRating: [
    body("denNguoiDung")
      .isMongoId()
      .withMessage("ID người được đánh giá không hợp lệ"),

    body("giaoDich").isMongoId().withMessage("ID giao dịch không hợp lệ"),

    body("soSao").isInt({ min: 1, max: 5 }).withMessage("Số sao phải từ 1-5"),

    body("binhLuan")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Bình luận không được quá 500 ký tự"),
  ],
};

// Middleware kiểm tra validation
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

module.exports = {
  validation,
  handleValidation,
};
