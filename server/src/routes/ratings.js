const express = require("express");
const Rating = require("../models/Rating");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");
const { validation, handleValidation } = require("../middleware/validation");

const router = express.Router();

// GET /api/ratings - Lấy danh sách đánh giá
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      userId,
      minStars,
      maxStars,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Lọc theo user được đánh giá
    if (userId) {
      query.denNguoiDung = userId;
    }

    // Lọc theo số sao
    if (minStars || maxStars) {
      query.soSao = {};
      if (minStars) query.soSao.$gte = parseInt(minStars);
      if (maxStars) query.soSao.$lte = parseInt(maxStars);
    }

    // Tạo sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    const ratings = await Rating.find(query)
      .populate("tuNguoiDung", "hoTen avatar")
      .populate("denNguoiDung", "hoTen avatar")
      .populate({
        path: "giaoDich",
        populate: {
          path: "baiDang",
          select: "tieuDe hinhAnh gia",
        },
      })
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rating.countDocuments(query);

    res.json({
      message: "Lấy danh sách đánh giá thành công",
      ratings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get ratings error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách đánh giá",
      error: error.message,
    });
  }
});

// GET /api/ratings/:id - Lấy chi tiết đánh giá
router.get("/:id", async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id)
      .populate("tuNguoiDung", "hoTen avatar diemUyTin")
      .populate("denNguoiDung", "hoTen avatar diemUyTin")
      .populate({
        path: "giaoDich",
        populate: {
          path: "baiDang",
          select: "tieuDe hinhAnh gia moTa",
        },
      });

    if (!rating) {
      return res.status(404).json({
        message: "Không tìm thấy đánh giá",
        code: "RATING_NOT_FOUND",
      });
    }

    res.json({
      message: "Lấy chi tiết đánh giá thành công",
      rating,
    });
  } catch (error) {
    console.error("Get rating detail error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy chi tiết đánh giá",
      error: error.message,
    });
  }
});

// POST /api/ratings - Tạo đánh giá mới
router.post(
  "/",
  authenticateToken,
  validation.createRating,
  handleValidation,
  async (req, res) => {
    try {
      const { denNguoiDung, giaoDich, soSao, binhLuan } = req.body;

      const userId = req.user._id;

      // Kiểm tra giao dịch tồn tại và đã hoàn thành
      const transaction = await Transaction.findById(giaoDich)
        .populate("nguoiMua")
        .populate("nguoiBan")
        .populate("baiDang");

      if (!transaction) {
        return res.status(404).json({
          message: "Không tìm thấy giao dịch",
          code: "TRANSACTION_NOT_FOUND",
        });
      }

      if (transaction.trangThai !== "hoan-thanh") {
        return res.status(400).json({
          message: "Chỉ có thể đánh giá sau khi giao dịch hoàn thành",
          code: "TRANSACTION_NOT_COMPLETED",
        });
      }

      // Kiểm tra user có tham gia giao dịch không
      const isParticipant =
        transaction.nguoiMua._id.toString() === userId.toString() ||
        transaction.nguoiBan._id.toString() === userId.toString();

      if (!isParticipant) {
        return res.status(403).json({
          message: "Bạn không tham gia giao dịch này",
          code: "NOT_PARTICIPANT",
        });
      }

      // Kiểm tra người được đánh giá có đúng là đối tác giao dịch không
      let validTarget = false;
      let loaiDanhGia;

      if (
        userId.toString() === transaction.nguoiMua._id.toString() &&
        denNguoiDung === transaction.nguoiBan._id.toString()
      ) {
        validTarget = true;
        loaiDanhGia = "nguoi-ban"; // Người mua đánh giá người bán
      } else if (
        userId.toString() === transaction.nguoiBan._id.toString() &&
        denNguoiDung === transaction.nguoiMua._id.toString()
      ) {
        validTarget = true;
        loaiDanhGia = "nguoi-mua"; // Người bán đánh giá người mua
      }

      if (!validTarget) {
        return res.status(400).json({
          message: "Chỉ có thể đánh giá đối tác trong giao dịch",
          code: "INVALID_TARGET",
        });
      }

      // Kiểm tra đã đánh giá chưa
      const existingRating = await Rating.findOne({
        tuNguoiDung: userId,
        giaoDich: giaoDich,
      });

      if (existingRating) {
        return res.status(400).json({
          message: "Bạn đã đánh giá giao dịch này",
          code: "ALREADY_RATED",
        });
      }

      // Tạo đánh giá mới
      const rating = new Rating({
        tuNguoiDung: userId,
        denNguoiDung,
        giaoDich,
        soSao,
        binhLuan: binhLuan?.trim() || "",
        loaiDanhGia,
      });

      await rating.save();

      // Cập nhật điểm uy tín của người được đánh giá
      const targetUser = await User.findById(denNguoiDung);
      if (targetUser) {
        await targetUser.calculateRating();
      }

      // Populate thông tin để trả về
      await rating.populate("tuNguoiDung", "hoTen avatar");
      await rating.populate("denNguoiDung", "hoTen avatar");
      await rating.populate({
        path: "giaoDich",
        populate: {
          path: "baiDang",
          select: "tieuDe hinhAnh",
        },
      });

      res.status(201).json({
        message: "Tạo đánh giá thành công",
        rating,
      });
    } catch (error) {
      console.error("Create rating error:", error);

      // Xử lý lỗi unique constraint (đã đánh giá)
      if (error.code === 11000) {
        return res.status(400).json({
          message: "Bạn đã đánh giá giao dịch này",
          code: "ALREADY_RATED",
        });
      }

      res.status(500).json({
        message: "Lỗi server khi tạo đánh giá",
        error: error.message,
      });
    }
  }
);

// PUT /api/ratings/:id - Cập nhật đánh giá
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const ratingId = req.params.id;
    const userId = req.user._id;
    const { soSao, binhLuan } = req.body;

    const rating = await Rating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({
        message: "Không tìm thấy đánh giá",
        code: "RATING_NOT_FOUND",
      });
    }

    // Chỉ người tạo đánh giá mới có quyền sửa
    if (rating.tuNguoiDung.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền sửa đánh giá này",
        code: "FORBIDDEN",
      });
    }

    // Cập nhật thông tin
    const updateData = {};
    if (soSao !== undefined) updateData.soSao = soSao;
    if (binhLuan !== undefined) updateData.binhLuan = binhLuan.trim();

    const updatedRating = await Rating.findByIdAndUpdate(ratingId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("tuNguoiDung", "hoTen avatar")
      .populate("denNguoiDung", "hoTen avatar")
      .populate({
        path: "giaoDich",
        populate: {
          path: "baiDang",
          select: "tieuDe hinhAnh",
        },
      });

    // Cập nhật lại điểm uy tín của người được đánh giá
    const targetUser = await User.findById(rating.denNguoiDung);
    if (targetUser) {
      await targetUser.calculateRating();
    }

    res.json({
      message: "Cập nhật đánh giá thành công",
      rating: updatedRating,
    });
  } catch (error) {
    console.error("Update rating error:", error);
    res.status(500).json({
      message: "Lỗi server khi cập nhật đánh giá",
      error: error.message,
    });
  }
});

// DELETE /api/ratings/:id - Xóa đánh giá
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const ratingId = req.params.id;
    const userId = req.user._id;

    const rating = await Rating.findById(ratingId);

    if (!rating) {
      return res.status(404).json({
        message: "Không tìm thấy đánh giá",
        code: "RATING_NOT_FOUND",
      });
    }

    // Chỉ người tạo đánh giá hoặc admin mới có quyền xóa
    if (
      rating.tuNguoiDung.toString() !== userId.toString() &&
      req.user.vaiTro !== "admin"
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa đánh giá này",
        code: "FORBIDDEN",
      });
    }

    const denNguoiDung = rating.denNguoiDung;
    await Rating.findByIdAndDelete(ratingId);

    // Cập nhật lại điểm uy tín của người được đánh giá
    const targetUser = await User.findById(denNguoiDung);
    if (targetUser) {
      await targetUser.calculateRating();
    }

    res.json({
      message: "Xóa đánh giá thành công",
    });
  } catch (error) {
    console.error("Delete rating error:", error);
    res.status(500).json({
      message: "Lỗi server khi xóa đánh giá",
      error: error.message,
    });
  }
});

// GET /api/ratings/stats/:userId - Thống kê đánh giá của user
router.get("/stats/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Kiểm tra user tồn tại
    const user = await User.findById(userId, "hoTen diemUyTin soLuotDanhGia");
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
        code: "USER_NOT_FOUND",
      });
    }

    // Thống kê số sao
    const ratingStats = await Rating.aggregate([
      { $match: { denNguoiDung: user._id } },
      {
        $group: {
          _id: "$soSao",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    // Chuyển thành object dễ sử dụng
    const statsObject = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingStats.forEach((stat) => {
      statsObject[stat._id] = stat.count;
    });

    // Tính tổng và trung bình
    const totalRatings = ratingStats.reduce((sum, stat) => sum + stat.count, 0);
    const totalStars = ratingStats.reduce(
      (sum, stat) => sum + stat._id * stat.count,
      0
    );
    const averageRating =
      totalRatings > 0 ? Math.round((totalStars / totalRatings) * 10) / 10 : 0;

    res.json({
      message: "Lấy thống kê đánh giá thành công",
      user: {
        _id: user._id,
        hoTen: user.hoTen,
        diemUyTin: user.diemUyTin,
        soLuotDanhGia: user.soLuotDanhGia,
      },
      stats: {
        totalRatings,
        averageRating,
        distribution: statsObject,
      },
    });
  } catch (error) {
    console.error("Get rating stats error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy thống kê đánh giá",
      error: error.message,
    });
  }
});

// GET /api/ratings/can-rate/:transactionId - Kiểm tra có thể đánh giá giao dịch không
router.get("/can-rate/:transactionId", authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    const userId = req.user._id;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.json({
        canRate: false,
        reason: "Không tìm thấy giao dịch",
      });
    }

    if (transaction.trangThai !== "hoan-thanh") {
      return res.json({
        canRate: false,
        reason: "Giao dịch chưa hoàn thành",
      });
    }

    // Kiểm tra user có tham gia giao dịch không
    const isParticipant =
      transaction.nguoiMua.toString() === userId.toString() ||
      transaction.nguoiBan.toString() === userId.toString();

    if (!isParticipant) {
      return res.json({
        canRate: false,
        reason: "Bạn không tham gia giao dịch này",
      });
    }

    // Kiểm tra đã đánh giá chưa
    const existingRating = await Rating.findOne({
      tuNguoiDung: userId,
      giaoDich: transactionId,
    });

    if (existingRating) {
      return res.json({
        canRate: false,
        reason: "Bạn đã đánh giá giao dịch này",
        existingRating: {
          _id: existingRating._id,
          soSao: existingRating.soSao,
          binhLuan: existingRating.binhLuan,
        },
      });
    }

    // Xác định đối tác cần đánh giá
    let targetUserId;
    if (userId.toString() === transaction.nguoiMua.toString()) {
      targetUserId = transaction.nguoiBan;
    } else {
      targetUserId = transaction.nguoiMua;
    }

    res.json({
      canRate: true,
      targetUserId,
      transaction: {
        _id: transaction._id,
        giaThanhToan: transaction.giaThanhToan,
      },
    });
  } catch (error) {
    console.error("Check can rate error:", error);
    res.status(500).json({
      message: "Lỗi server khi kiểm tra quyền đánh giá",
      error: error.message,
    });
  }
});

module.exports = router;
