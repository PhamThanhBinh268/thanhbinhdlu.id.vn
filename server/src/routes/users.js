const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const Transaction = require("../models/Transaction");
const Rating = require("../models/Rating");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/users - Lấy danh sách users (Admin only)
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, trangThai } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { hoTen: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (trangThai) {
      query.trangThai = trangThai;
    }

    const users = await User.find(query)
      .select("-matKhau")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      message: "Lấy danh sách users thành công",
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách users",
      error: error.message,
    });
  }
});

// GET /api/users/:id - Lấy thông tin user theo ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy user",
        code: "USER_NOT_FOUND",
      });
    }

    // Thống kê của user
    const stats = await Promise.all([
      Post.countDocuments({ nguoiDang: user._id, trangThai: "approved" }),
      Transaction.countDocuments({
        $or: [{ nguoiMua: user._id }, { nguoiBan: user._id }],
        trangThai: "hoan-thanh",
      }),
      Rating.countDocuments({ denNguoiDung: user._id }),
    ]);

    res.json({
      message: "Lấy thông tin user thành công",
      user,
      stats: {
        totalPosts: stats[0],
        totalTransactions: stats[1],
        totalRatings: stats[2],
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy thông tin user",
      error: error.message,
    });
  }
});

// PUT /api/users/:id - Cập nhật thông tin user
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // Chỉ cho phép user cập nhật thông tin của chính mình hoặc admin
    if (req.user._id.toString() !== userId && req.user.vaiTro !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật thông tin này",
        code: "FORBIDDEN",
      });
    }

    const updateData = {};
    const allowedFields = ["hoTen", "soDienThoai", "diaChi", "avatar"];

    // Chỉ admin mới được cập nhật trangThai và vaiTro
    if (req.user.vaiTro === "admin") {
      allowedFields.push("trangThai", "vaiTro");
    }

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy user",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({
      message: "Cập nhật thông tin thành công",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      message: "Lỗi server khi cập nhật thông tin user",
      error: error.message,
    });
  }
});

// GET /api/users/:id/posts - Lấy bài đăng của user
router.get("/:id/posts", async (req, res) => {
  try {
    const { page = 1, limit = 12, trangThai } = req.query;
    const userId = req.params.id;

    const query = { nguoiDang: userId };

    if (trangThai) {
      query.trangThai = trangThai;
    } else {
      // Mặc định chỉ hiển thị bài đã duyệt
      query.trangThai = "approved";
    }

    const posts = await Post.find(query)
      .populate("danhMuc", "tenDanhMuc")
      .populate("nguoiDang", "hoTen avatar diemUyTin")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
      message: "Lấy bài đăng của user thành công",
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy bài đăng của user",
      error: error.message,
    });
  }
});

// GET /api/users/:id/ratings - Lấy đánh giá của user
router.get("/:id/ratings", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.params.id;

    const ratings = await Rating.find({ denNguoiDung: userId })
      .populate("tuNguoiDung", "hoTen avatar")
      .populate({
        path: "giaoDich",
        populate: {
          path: "baiDang",
          select: "tieuDe hinhAnh",
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rating.countDocuments({ denNguoiDung: userId });

    res.json({
      message: "Lấy đánh giá của user thành công",
      ratings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get user ratings error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy đánh giá của user",
      error: error.message,
    });
  }
});

// PUT /api/users/profile - Cập nhật hồ sơ cá nhân
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const {
      hoTen,
      soDienThoai,
      diaChi,
      ngaySinh,
      gioiThieu,
      lienKetMangXaHoi,
      matKhauHienTai,
      matKhauMoi,
    } = req.body;

    const user = await User.findById(req.user.id).select("+matKhau");
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy user",
        code: "USER_NOT_FOUND",
      });
    }

    // Kiểm tra số điện thoại đã tồn tại (ngoại trừ user hiện tại)
    if (soDienThoai && soDienThoai !== user.soDienThoai) {
      const existingUser = await User.findOne({
        soDienThoai,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res.status(400).json({
          message: "Số điện thoại đã được sử dụng",
          code: "PHONE_EXISTS",
        });
      }
    }

    // Cập nhật thông tin cơ bản
    if (hoTen) user.hoTen = hoTen;
    if (soDienThoai) user.soDienThoai = soDienThoai;
    if (diaChi) user.diaChi = diaChi;
    if (ngaySinh) user.ngaySinh = new Date(ngaySinh);
    if (gioiThieu) user.gioiThieu = gioiThieu;
    if (lienKetMangXaHoi) user.lienKetMangXaHoi = lienKetMangXaHoi;

    // Xử lý đổi mật khẩu
    if (matKhauHienTai && matKhauMoi) {
      const isValidPassword = await user.comparePassword(matKhauHienTai);
      if (!isValidPassword) {
        return res.status(400).json({
          message: "Mật khẩu hiện tại không đúng",
          code: "INVALID_PASSWORD",
        });
      }
      user.matKhau = matKhauMoi;
    }

    await user.save();

    // Trả về user không có mật khẩu
    const userResponse = user.toJSON();
    delete userResponse.matKhau;

    res.json({
      message: "Cập nhật hồ sơ thành công",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      message: "Lỗi server khi cập nhật hồ sơ",
      error: error.message,
    });
  }
});

// POST /api/users/avatar - Upload avatar
router.post("/avatar", authenticateToken, async (req, res) => {
  try {
    const multer = require("multer");
    const {
      uploadImageFromBuffer,
      deleteImage,
    } = require("../utils/cloudinary");

    // Multer configuration cho avatar
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
          cb(null, true);
        } else {
          cb(new Error("Chỉ chấp nhận file ảnh"), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }).single("avatar");

    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          message: "Lỗi upload file: " + err.message,
          code: "UPLOAD_ERROR",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Vui lòng chọn file ảnh",
          code: "NO_FILE",
        });
      }

      try {
        console.log(
          `[Avatar] Nhận file: name=${req.file.originalname} size=${req.file.size} type=${req.file.mimetype}`
        );
        console.log(
          `[Avatar] Cloudinary ENV check cloud_name=${
            process.env.CLOUDINARY_CLOUD_NAME
          } key_suffix=${(process.env.CLOUDINARY_API_KEY || "").slice(
            -4
          )} secure=${process.env.CLOUDINARY_SECURE}`
        );
        const result = await uploadImageFromBuffer(req.file.buffer, {
          folder: "oldmarket/avatars",
          transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "face" },
            { quality: "auto" },
          ],
        });

        const user = await User.findById(req.user.id);
        // Xoá avatar cũ nếu có publicId
        if (user.avatarPublicId) {
          deleteImage(user.avatarPublicId);
        }
        user.avatar = result.url;
        user.avatarPublicId = result.public_id;
        await user.save();

        console.log(
          `[Avatar] Upload thành công public_id=${result.public_id} url=${result.url}`
        );
        res.json({
          message: "Cập nhật avatar thành công",
          user: {
            ...user.toJSON(),
            matKhau: undefined,
          },
        });
      } catch (cloudErr) {
        console.error("Cloudinary upload error:", cloudErr);
        return res.status(500).json({
          message: "Lỗi upload ảnh lên cloud",
          error: cloudErr.message,
          details: {
            name: cloudErr.name,
            http_code: cloudErr.http_code,
            stack:
              process.env.NODE_ENV === "development"
                ? cloudErr.stack
                : undefined,
          },
        });
      }
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({
      message: "Lỗi server khi upload avatar",
      error: error.message,
    });
  }
});

// DELETE /api/users/avatar - Reset avatar về mặc định
router.delete("/avatar", authenticateToken, async (req, res) => {
  try {
    const { deleteImage } = require("../utils/cloudinary");
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy user", code: "USER_NOT_FOUND" });
    }
    if (user.avatarPublicId) {
      deleteImage(user.avatarPublicId);
    }
    user.avatar = undefined; // Frontend sẽ hiển thị avatar mặc định
    user.avatarPublicId = undefined;
    await user.save();
    res.json({
      message: "Đã reset avatar",
      user: { ...user.toJSON(), matKhau: undefined },
    });
  } catch (e) {
    console.error("Reset avatar error:", e);
    res
      .status(500)
      .json({ message: "Lỗi server khi reset avatar", error: e.message });
  }
});

// DELETE /api/users/account - Xóa tài khoản
router.delete("/account", authenticateToken, async (req, res) => {
  try {
    const { matKhau } = req.body;

    if (!matKhau) {
      return res.status(400).json({
        message: "Vui lòng nhập mật khẩu để xác nhận",
        code: "PASSWORD_REQUIRED",
      });
    }

    const user = await User.findById(req.user.id).select("+matKhau");
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy user",
        code: "USER_NOT_FOUND",
      });
    }

    const isValidPassword = await user.comparePassword(matKhau);
    if (!isValidPassword) {
      return res.status(400).json({
        message: "Mật khẩu không đúng",
        code: "INVALID_PASSWORD",
      });
    }

    // Xóa tất cả bài đăng của user
    await Post.deleteMany({ nguoiDang: user._id });

    // Xóa tất cả đánh giá liên quan
    await Rating.deleteMany({
      $or: [{ nguoiDanhGia: user._id }, { denNguoiDung: user._id }],
    });

    // Xóa tất cả giao dịch
    await Transaction.deleteMany({
      $or: [{ nguoiMua: user._id }, { nguoiBan: user._id }],
    });

    // Xóa user
    await User.findByIdAndDelete(user._id);

    res.json({
      message: "Xóa tài khoản thành công",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      message: "Lỗi server khi xóa tài khoản",
      error: error.message,
    });
  }
});

module.exports = router;
