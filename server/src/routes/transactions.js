const express = require("express");
const Transaction = require("../models/Transaction");
const Post = require("../models/Post");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// GET /api/transactions - Lấy danh sách giao dịch của user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, type = "all", trangThai } = req.query;
    const userId = req.user._id;

    let query = {};

    // Lọc theo loại giao dịch
    if (type === "selling") {
      query.nguoiBan = userId;
    } else if (type === "buying") {
      query.nguoiMua = userId;
    } else {
      query.$or = [{ nguoiMua: userId }, { nguoiBan: userId }];
    }

    // Lọc theo trạng thái
    if (trangThai) {
      query.trangThai = trangThai;
    }

    const transactions = await Transaction.find(query)
      .populate("baiDang", "tieuDe hinhAnh gia")
      .populate("nguoiMua", "hoTen avatar diemUyTin")
      .populate("nguoiBan", "hoTen avatar diemUyTin")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      message: "Lấy danh sách giao dịch thành công",
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách giao dịch",
      error: error.message,
    });
  }
});

// GET /api/transactions/:id - Lấy chi tiết giao dịch
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user._id;

    const transaction = await Transaction.findById(transactionId)
      .populate("baiDang", "tieuDe hinhAnh gia moTa")
      .populate("nguoiMua", "hoTen avatar diemUyTin soDienThoai")
      .populate("nguoiBan", "hoTen avatar diemUyTin soDienThoai");

    if (!transaction) {
      return res.status(404).json({
        message: "Không tìm thấy giao dịch",
        code: "TRANSACTION_NOT_FOUND",
      });
    }

    // Chỉ người mua hoặc người bán mới xem được chi tiết
    if (
      transaction.nguoiMua._id.toString() !== userId.toString() &&
      transaction.nguoiBan._id.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền xem giao dịch này",
        code: "FORBIDDEN",
      });
    }

    res.json({
      message: "Lấy chi tiết giao dịch thành công",
      transaction,
    });
  } catch (error) {
    console.error("Get transaction detail error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy chi tiết giao dịch",
      error: error.message,
    });
  }
});

// POST /api/transactions - Tạo giao dịch mới (người mua tạo)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      baiDang,
      giaThanhToan,
      phuongThucThanhToan = "tien-mat",
      diaDiemGiaoDich,
      thoiGianGiaoDich,
      ghiChu,
    } = req.body;

    const userId = req.user._id;

    // Kiểm tra bài đăng tồn tại và có thể mua
    const post = await Post.findById(baiDang).populate("nguoiDang", "hoTen");

    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài đăng",
        code: "POST_NOT_FOUND",
      });
    }

    if (post.trangThai !== "approved") {
      return res.status(400).json({
        message: "Bài đăng chưa được duyệt",
        code: "POST_NOT_APPROVED",
      });
    }

    // Không thể mua bài đăng của chính mình
    if (post.nguoiDang._id.toString() === userId.toString()) {
      return res.status(400).json({
        message: "Không thể mua bài đăng của chính mình",
        code: "CANNOT_BUY_OWN_POST",
      });
    }

    // Kiểm tra có giao dịch đang thỏa thuận nào không
    const existingTransaction = await Transaction.findOne({
      baiDang,
      nguoiMua: userId,
      trangThai: { $in: ["dang-thoa-thuan", "da-dong-y"] },
    });

    if (existingTransaction) {
      return res.status(400).json({
        message: "Đã có giao dịch đang thỏa thuận cho bài đăng này",
        code: "TRANSACTION_EXISTS",
      });
    }

    // Tạo giao dịch mới
    const transaction = new Transaction({
      baiDang,
      nguoiMua: userId,
      nguoiBan: post.nguoiDang._id,
      giaThanhToan,
      phuongThucThanhToan,
      diaDiemGiaoDich,
      thoiGianGiaoDich: thoiGianGiaoDich
        ? new Date(thoiGianGiaoDich)
        : undefined,
      ghiChu,
    });

    await transaction.save();

    // Populate để trả về đầy đủ thông tin
    await transaction.populate("baiDang", "tieuDe hinhAnh gia");
    await transaction.populate("nguoiMua", "hoTen avatar");
    await transaction.populate("nguoiBan", "hoTen avatar");

    res.status(201).json({
      message: "Tạo giao dịch thành công",
      transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    res.status(500).json({
      message: "Lỗi server khi tạo giao dịch",
      error: error.message,
    });
  }
});

// PATCH /api/transactions/:id/accept - Chấp nhận giao dịch (người bán)
router.patch("/:id/accept", authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user._id;

    const transaction = await Transaction.findById(transactionId)
      .populate("baiDang", "tieuDe")
      .populate("nguoiMua", "hoTen")
      .populate("nguoiBan", "hoTen");

    if (!transaction) {
      return res.status(404).json({
        message: "Không tìm thấy giao dịch",
        code: "TRANSACTION_NOT_FOUND",
      });
    }

    // Chỉ người bán mới có quyền chấp nhận
    if (transaction.nguoiBan._id.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền chấp nhận giao dịch này",
        code: "FORBIDDEN",
      });
    }

    // Chỉ chấp nhận giao dịch đang thỏa thuận
    if (transaction.trangThai !== "dang-thoa-thuan") {
      return res.status(400).json({
        message: "Giao dịch không ở trạng thái có thể chấp nhận",
        code: "INVALID_TRANSACTION_STATUS",
      });
    }

    // Cập nhật trạng thái
    transaction.trangThai = "da-dong-y";
    await transaction.save();

    res.json({
      message: "Chấp nhận giao dịch thành công",
      transaction,
    });
  } catch (error) {
    console.error("Accept transaction error:", error);
    res.status(500).json({
      message: "Lỗi server khi chấp nhận giao dịch",
      error: error.message,
    });
  }
});

// PATCH /api/transactions/:id/complete - Hoàn thành giao dịch
router.patch("/:id/complete", authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user._id;

    const transaction = await Transaction.findById(transactionId)
      .populate("baiDang")
      .populate("nguoiMua", "hoTen")
      .populate("nguoiBan", "hoTen");

    if (!transaction) {
      return res.status(404).json({
        message: "Không tìm thấy giao dịch",
        code: "TRANSACTION_NOT_FOUND",
      });
    }

    // Chỉ người mua hoặc người bán mới có quyền đánh dấu hoàn thành
    const isParticipant =
      transaction.nguoiMua._id.toString() === userId.toString() ||
      transaction.nguoiBan._id.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        message: "Bạn không có quyền thao tác với giao dịch này",
        code: "FORBIDDEN",
      });
    }

    // Chỉ hoàn thành giao dịch đã được đồng ý
    if (transaction.trangThai !== "da-dong-y") {
      return res.status(400).json({
        message: "Giao dịch chưa được đồng ý",
        code: "TRANSACTION_NOT_AGREED",
      });
    }

    // Cập nhật trạng thái giao dịch
    transaction.trangThai = "hoan-thanh";
    await transaction.save();

    // Cập nhật trạng thái bài đăng thành 'sold'
    await Post.findByIdAndUpdate(transaction.baiDang._id, {
      trangThai: "sold",
    });

    res.json({
      message: "Hoàn thành giao dịch thành công",
      transaction,
    });
  } catch (error) {
    console.error("Complete transaction error:", error);
    res.status(500).json({
      message: "Lỗi server khi hoàn thành giao dịch",
      error: error.message,
    });
  }
});

// PATCH /api/transactions/:id/cancel - Hủy giao dịch
router.patch("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user._id;
    const { lyDoHuy } = req.body;

    const transaction = await Transaction.findById(transactionId)
      .populate("nguoiMua", "hoTen")
      .populate("nguoiBan", "hoTen");

    if (!transaction) {
      return res.status(404).json({
        message: "Không tìm thấy giao dịch",
        code: "TRANSACTION_NOT_FOUND",
      });
    }

    // Chỉ người mua hoặc người bán mới có quyền hủy
    const isParticipant =
      transaction.nguoiMua._id.toString() === userId.toString() ||
      transaction.nguoiBan._id.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        message: "Bạn không có quyền hủy giao dịch này",
        code: "FORBIDDEN",
      });
    }

    // Không thể hủy giao dịch đã hoàn thành
    if (transaction.trangThai === "hoan-thanh") {
      return res.status(400).json({
        message: "Không thể hủy giao dịch đã hoàn thành",
        code: "CANNOT_CANCEL_COMPLETED",
      });
    }

    // Cập nhật trạng thái
    transaction.trangThai = "huy-bo";
    transaction.lyDoHuy = lyDoHuy || "Không có lý do";
    await transaction.save();

    res.json({
      message: "Hủy giao dịch thành công",
      transaction,
    });
  } catch (error) {
    console.error("Cancel transaction error:", error);
    res.status(500).json({
      message: "Lỗi server khi hủy giao dịch",
      error: error.message,
    });
  }
});

// PUT /api/transactions/:id - Cập nhật thông tin giao dịch
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user._id;
    const {
      giaThanhToan,
      phuongThucThanhToan,
      diaDiemGiaoDich,
      thoiGianGiaoDich,
      ghiChu,
    } = req.body;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        message: "Không tìm thấy giao dịch",
        code: "TRANSACTION_NOT_FOUND",
      });
    }

    // Chỉ người mua hoặc người bán mới có quyền cập nhật
    const isParticipant =
      transaction.nguoiMua.toString() === userId.toString() ||
      transaction.nguoiBan.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật giao dịch này",
        code: "FORBIDDEN",
      });
    }

    // Chỉ cập nhật giao dịch đang thỏa thuận hoặc đã đồng ý
    if (!["dang-thoa-thuan", "da-dong-y"].includes(transaction.trangThai)) {
      return res.status(400).json({
        message: "Không thể cập nhật giao dịch ở trạng thái hiện tại",
        code: "CANNOT_UPDATE_TRANSACTION",
      });
    }

    // Cập nhật thông tin
    const updateData = {};
    if (giaThanhToan !== undefined) updateData.giaThanhToan = giaThanhToan;
    if (phuongThucThanhToan)
      updateData.phuongThucThanhToan = phuongThucThanhToan;
    if (diaDiemGiaoDich) updateData.diaDiemGiaoDich = diaDiemGiaoDich;
    if (thoiGianGiaoDich)
      updateData.thoiGianGiaoDich = new Date(thoiGianGiaoDich);
    if (ghiChu !== undefined) updateData.ghiChu = ghiChu;

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      transactionId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("baiDang", "tieuDe hinhAnh")
      .populate("nguoiMua", "hoTen avatar")
      .populate("nguoiBan", "hoTen avatar");

    res.json({
      message: "Cập nhật giao dịch thành công",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({
      message: "Lỗi server khi cập nhật giao dịch",
      error: error.message,
    });
  }
});

module.exports = router;
