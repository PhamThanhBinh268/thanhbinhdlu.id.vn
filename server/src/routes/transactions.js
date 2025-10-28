const express = require("express");
const Transaction = require("../models/Transaction");
const Post = require("../models/Post");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

// Import payment & shipping handlers
const paymentHandlers = require("./payment-handlers");
const shippingHandlers = require("./shipping-handlers");

const router = express.Router();

// helper: build list query from req
async function listTransactions(req) {
  const { page = 1, limit = 10, type = "all", trangThai, loaiGiaoDich } = req.query;
  const userId = req.user._id;

  let query = {};
  if (type === "selling") {
    query.nguoiBan = userId;
  } else if (type === "buying") {
    query.nguoiDeNghi = userId;
  } else {
    query.$or = [{ nguoiDeNghi: userId }, { nguoiBan: userId }];
  }
  if (trangThai) query.trangThai = trangThai;
  if (loaiGiaoDich) query.loaiGiaoDich = loaiGiaoDich;

  const transactions = await Transaction.find(query)
    .populate("baiDang", "tieuDe hinhAnh gia loaiGia")
    .populate("baiDangTraoDoi", "tieuDe hinhAnh gia loaiGia")
    .populate("nguoiDeNghi", "hoTen avatar diemUyTin")
    .populate("nguoiBan", "hoTen avatar diemUyTin")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Transaction.countDocuments(query);
  return {
    transactions,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    },
  };
}

// GET /api/transactions - Lấy danh sách giao dịch của user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await listTransactions(req);
    res.json({
      message: "Lấy danh sách giao dịch thành công",
      ...result,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách giao dịch",
      error: error.message,
    });
  }
});

// GET /api/transactions/my - alias cho list theo user hiện tại
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const result = await listTransactions(req);
    res.json({
      message: "Lấy giao dịch của tôi thành công",
      ...result,
    });
  } catch (error) {
    console.error("Get my transactions error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy giao dịch của tôi",
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
      transaction.nguoiDeNghi._id.toString() !== userId.toString() &&
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

// POST /api/transactions/propose-buy - Gửi đề nghị mua
router.post("/propose-buy", authenticateToken, async (req, res) => {
  try {
    const { 
      baiDangId, 
      giaDeXuat, 
      loiNhan,
      phuongThucThanhToan,
      hinhThucGiaoHang,
      diaDiemGap,
      diaChiGiaoHang
    } = req.body;
    const userId = req.user._id;

    // Kiểm tra bài đăng
    const post = await Post.findById(baiDangId).populate("nguoiDang", "hoTen");
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

    // Không thể mua bài của chính mình
    if (post.nguoiDang._id.toString() === userId.toString()) {
      return res.status(400).json({
        message: "Không thể mua bài đăng của chính mình",
        code: "CANNOT_BUY_OWN_POST",
      });
    }

    // Kiểm tra loại giao dịch phù hợp
    if (post.loaiGia !== "ban") {
      return res.status(400).json({
        message: "Bài đăng này không phải để bán",
        code: "INVALID_POST_TYPE",
      });
    }

    // Validate payment & shipping info
    if (!phuongThucThanhToan) {
      return res.status(400).json({
        message: "Vui lòng chọn phương thức thanh toán",
        code: "MISSING_PAYMENT_METHOD",
      });
    }

    if (!hinhThucGiaoHang) {
      return res.status(400).json({
        message: "Vui lòng chọn hình thức giao hàng",
        code: "MISSING_SHIPPING_METHOD",
      });
    }

    if (hinhThucGiaoHang === "gap-truc-tiep" && !diaDiemGap) {
      return res.status(400).json({
        message: "Vui lòng cung cấp địa điểm gặp",
        code: "MISSING_MEETING_LOCATION",
      });
    }

    if (hinhThucGiaoHang === "giao-hang-tan-noi" && !diaChiGiaoHang) {
      return res.status(400).json({
        message: "Vui lòng cung cấp địa chỉ giao hàng",
        code: "MISSING_DELIVERY_ADDRESS",
      });
    }

    // Tạo đề nghị mua với payment & shipping info
    const transaction = new Transaction({
      loaiGiaoDich: "mua",
      baiDang: baiDangId,
      nguoiDeNghi: userId,
      nguoiBan: post.nguoiDang._id,
      giaDeXuat: giaDeXuat || post.gia,
      loiNhan,
      trangThai: "cho-duyet",
      phuongThucThanhToan,
      hinhThucGiaoHang,
      diaDiemGap: hinhThucGiaoHang === "gap-truc-tiep" ? diaDiemGap : undefined,
      diaChiGiaoHang: hinhThucGiaoHang === "giao-hang-tan-noi" ? diaChiGiaoHang : undefined,
    });

    await transaction.save();
    await transaction.populate("baiDang", "tieuDe hinhAnh gia");
    await transaction.populate("nguoiDeNghi", "hoTen avatar");
    await transaction.populate("nguoiBan", "hoTen avatar");

    res.status(201).json({
      message: "Gửi đề nghị mua thành công",
      transaction,
    });
  } catch (error) {
    console.error("Propose buy error:", error);
    res.status(500).json({
      message: "Lỗi server khi gửi đề nghị mua",
      error: error.message,
    });
  }
});

// POST /api/transactions/propose-swap - Gửi đề nghị trao đổi
router.post("/propose-swap", authenticateToken, async (req, res) => {
  try {
    const { 
      baiDangId, 
      baiDangTraoDoiId, 
      tienBu = 0, 
      loiNhan,
      phuongThucThanhToan,
      hinhThucGiaoHang,
      diaDiemGap,
      diaChiGiaoHang
    } = req.body;
    const userId = req.user._id;

    // Kiểm tra bài đăng muốn lấy
    const postTarget = await Post.findById(baiDangId).populate("nguoiDang", "hoTen");
    if (!postTarget) {
      return res.status(404).json({
        message: "Không tìm thấy bài đăng muốn trao đổi",
        code: "POST_NOT_FOUND",
      });
    }

    if (postTarget.trangThai !== "approved") {
      return res.status(400).json({
        message: "Bài đăng chưa được duyệt",
        code: "POST_NOT_APPROVED",
      });
    }

    // Kiểm tra bài đăng của mình để trao đổi
    const postOffer = await Post.findById(baiDangTraoDoiId);
    if (!postOffer) {
      return res.status(404).json({
        message: "Không tìm thấy bài đăng của bạn",
        code: "OWN_POST_NOT_FOUND",
      });
    }

    // Phải là bài của chính mình
    if (postOffer.nguoiDang.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Bài đăng trao đổi phải là của bạn",
        code: "NOT_YOUR_POST",
      });
    }

    // Không thể trao đổi với chính mình
    if (postTarget.nguoiDang._id.toString() === userId.toString()) {
      return res.status(400).json({
        message: "Không thể trao đổi với bài đăng của chính mình",
        code: "CANNOT_SWAP_OWN_POST",
      });
    }

    // Cho phép trao đổi với bài "bán" hoặc "trao-doi", không cho phép với "cho"
    if (postTarget.loaiGia === "cho") {
      return res.status(400).json({
        message: "Không thể trao đổi với bài đăng cho miễn phí",
        code: "INVALID_POST_TYPE",
      });
    }

    // Validate payment & shipping info
    if (!phuongThucThanhToan) {
      return res.status(400).json({
        message: "Vui lòng chọn phương thức thanh toán",
        code: "MISSING_PAYMENT_METHOD",
      });
    }

    if (!hinhThucGiaoHang) {
      return res.status(400).json({
        message: "Vui lòng chọn hình thức giao hàng",
        code: "MISSING_SHIPPING_METHOD",
      });
    }

    if (hinhThucGiaoHang === "gap-truc-tiep" && !diaDiemGap) {
      return res.status(400).json({
        message: "Vui lòng cung cấp địa điểm gặp",
        code: "MISSING_MEETING_LOCATION",
      });
    }

    if (hinhThucGiaoHang === "giao-hang-tan-noi" && !diaChiGiaoHang) {
      return res.status(400).json({
        message: "Vui lòng cung cấp địa chỉ giao hàng",
        code: "MISSING_DELIVERY_ADDRESS",
      });
    }

    // Tạo đề nghị trao đổi với payment & shipping info
    const transaction = new Transaction({
      loaiGiaoDich: "trao-doi",
      baiDang: baiDangId,
      baiDangTraoDoi: baiDangTraoDoiId,
      nguoiDeNghi: userId,
      nguoiBan: postTarget.nguoiDang._id,
      tienBu: tienBu || 0,
      loiNhan,
      trangThai: "cho-duyet",
      phuongThucThanhToan,
      hinhThucGiaoHang,
      diaDiemGap: hinhThucGiaoHang === "gap-truc-tiep" ? diaDiemGap : undefined,
      diaChiGiaoHang: hinhThucGiaoHang === "giao-hang-tan-noi" ? diaChiGiaoHang : undefined,
    });

    await transaction.save();
    await transaction.populate("baiDang", "tieuDe hinhAnh gia");
    await transaction.populate("baiDangTraoDoi", "tieuDe hinhAnh gia");
    await transaction.populate("nguoiDeNghi", "hoTen avatar");
    await transaction.populate("nguoiBan", "hoTen avatar");

    res.status(201).json({
      message: "Gửi đề nghị trao đổi thành công",
      transaction,
    });
  } catch (error) {
    console.error("Propose swap error:", error);
    res.status(500).json({
      message: "Lỗi server khi gửi đề nghị trao đổi",
      error: error.message,
    });
  }
});

// POST /api/transactions/request-free - Gửi yêu cầu nhận miễn phí
router.post("/request-free", authenticateToken, async (req, res) => {
  try {
    const { 
      baiDangId, 
      loiNhan,
      hinhThucGiaoHang,
      diaDiemGap,
      diaChiGiaoHang
    } = req.body;
    const userId = req.user._id;

    // Kiểm tra bài đăng
    const post = await Post.findById(baiDangId).populate("nguoiDang", "hoTen");
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

    // Không thể nhận từ chính mình
    if (post.nguoiDang._id.toString() === userId.toString()) {
      return res.status(400).json({
        message: "Không thể nhận bài đăng của chính mình",
        code: "CANNOT_REQUEST_OWN_POST",
      });
    }

    // Kiểm tra loại giao dịch phù hợp
    if (post.loaiGia !== "cho-mien-phi") {
      return res.status(400).json({
        message: "Bài đăng này không phải để cho miễn phí",
        code: "INVALID_POST_TYPE",
      });
    }

    // Validate shipping info (không cần payment cho miễn phí)
    if (!hinhThucGiaoHang) {
      return res.status(400).json({
        message: "Vui lòng chọn hình thức giao hàng",
        code: "MISSING_SHIPPING_METHOD",
      });
    }

    if (hinhThucGiaoHang === "gap-truc-tiep" && !diaDiemGap) {
      return res.status(400).json({
        message: "Vui lòng cung cấp địa điểm gặp",
        code: "MISSING_MEETING_LOCATION",
      });
    }

    if (hinhThucGiaoHang === "giao-hang-tan-noi" && !diaChiGiaoHang) {
      return res.status(400).json({
        message: "Vui lòng cung cấp địa chỉ giao hàng",
        code: "MISSING_DELIVERY_ADDRESS",
      });
    }

    // Tạo yêu cầu miễn phí với shipping info
    const transaction = new Transaction({
      loaiGiaoDich: "mien-phi",
      baiDang: baiDangId,
      nguoiDeNghi: userId,
      nguoiBan: post.nguoiDang._id,
      loiNhan,
      trangThai: "cho-duyet",
      hinhThucGiaoHang,
      diaDiemGap: hinhThucGiaoHang === "gap-truc-tiep" ? diaDiemGap : undefined,
      diaChiGiaoHang: hinhThucGiaoHang === "giao-hang-tan-noi" ? diaChiGiaoHang : undefined,
    });

    await transaction.save();
    await transaction.populate("baiDang", "tieuDe hinhAnh gia");
    await transaction.populate("nguoiDeNghi", "hoTen avatar");
    await transaction.populate("nguoiBan", "hoTen avatar");

    res.status(201).json({
      message: "Gửi yêu cầu nhận miễn phí thành công",
      transaction,
    });
  } catch (error) {
    console.error("Request free error:", error);
    res.status(500).json({
      message: "Lỗi server khi gửi yêu cầu miễn phí",
      error: error.message,
    });
  }
});

// POST /api/transactions - Tạo giao dịch mới (người mua tạo) - GIỮ LẠI ĐỂ BACKWARD COMPATIBLE
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

// PATCH /api/transactions/:id/accept - Chấp nhận đề nghị (người bán)
router.patch("/:id/accept", authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user._id;

    const transaction = await Transaction.findById(transactionId)
      .populate("baiDang", "tieuDe")
      .populate("baiDangTraoDoi", "tieuDe")
      .populate("nguoiDeNghi", "hoTen")
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

    // Chỉ chấp nhận giao dịch đang chờ duyệt
    if (transaction.trangThai !== "cho-duyet") {
      return res.status(400).json({
        message: "Giao dịch không ở trạng thái có thể chấp nhận",
        code: "INVALID_TRANSACTION_STATUS",
      });
    }

    // Cập nhật trạng thái
    transaction.trangThai = "da-dong-y";
    
    // Với giao dịch mua, lưu giá thanh toán
    if (transaction.loaiGiaoDich === "mua") {
      transaction.giaThanhToan = transaction.giaDeXuat;
      transaction.phuongThucThanhToan = "tien-mat";
    }
    
    // Với giao dịch trao đổi
    if (transaction.loaiGiaoDich === "trao-doi") {
      transaction.phuongThucThanhToan = "trao-doi";
      transaction.giaThanhToan = transaction.tienBu || 0;
    }
    
    // Với giao dịch miễn phí
    if (transaction.loaiGiaoDich === "mien-phi") {
      transaction.phuongThucThanhToan = "mien-phi";
      transaction.giaThanhToan = 0;
    }
    
    await transaction.save();

    res.json({
      message: "Chấp nhận đề nghị thành công",
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

// PATCH /api/transactions/:id/reject - Từ chối đề nghị (người bán)
router.patch("/:id/reject", authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user._id;
    const { lyDoTuChoi } = req.body;

    const transaction = await Transaction.findById(transactionId)
      .populate("baiDang", "tieuDe")
      .populate("nguoiDeNghi", "hoTen")
      .populate("nguoiBan", "hoTen");

    if (!transaction) {
      return res.status(404).json({
        message: "Không tìm thấy giao dịch",
        code: "TRANSACTION_NOT_FOUND",
      });
    }

    // Chỉ người bán mới có quyền từ chối
    if (transaction.nguoiBan._id.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền từ chối giao dịch này",
        code: "FORBIDDEN",
      });
    }

    // Chỉ từ chối giao dịch đang chờ duyệt
    if (transaction.trangThai !== "cho-duyet") {
      return res.status(400).json({
        message: "Giao dịch không ở trạng thái có thể từ chối",
        code: "INVALID_TRANSACTION_STATUS",
      });
    }

    // Cập nhật trạng thái
    transaction.trangThai = "tu-choi";
    transaction.lyDoTuChoi = lyDoTuChoi || "Không phù hợp";
    await transaction.save();

    res.json({
      message: "Từ chối đề nghị thành công",
      transaction,
    });
  } catch (error) {
    console.error("Reject transaction error:", error);
    res.status(500).json({
      message: "Lỗi server khi từ chối giao dịch",
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

    // Chỉ người mua hoặc người bán mới có quyền thao tác với giao dịch này
    const isParticipant =
      transaction.nguoiDeNghi._id.toString() === userId.toString() ||
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
      transaction.nguoiDeNghi._id.toString() === userId.toString() ||
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
      transaction.nguoiDeNghi.toString() === userId.toString() ||
      transaction.nguoiBan.toString() === userId.toString();

    if (!isParticipant) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật giao dịch này",
        code: "FORBIDDEN",
      });
    }

    // Chỉ cập nhật giao dịch đang chờ duyệt hoặc đã đồng ý
    if (!["cho-duyet", "da-dong-y"].includes(transaction.trangThai)) {
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

// ==================== PAYMENT & SHIPPING ROUTES ====================

// PATCH /api/transactions/:id/setup-payment - Thiết lập thanh toán & giao hàng
router.patch("/:id/setup-payment", authenticateToken, paymentHandlers.setupPayment);

// PATCH /api/transactions/:id/upload-payment-proof - Upload ảnh chuyển khoản
router.patch("/:id/upload-payment-proof", authenticateToken, paymentHandlers.uploadPaymentProof);

// PATCH /api/transactions/:id/confirm-payment - Người bán xác nhận đã nhận tiền
router.patch("/:id/confirm-payment", authenticateToken, paymentHandlers.confirmPayment);

// PATCH /api/transactions/:id/start-shipping - Bắt đầu giao hàng
router.patch("/:id/start-shipping", authenticateToken, shippingHandlers.startShipping);

// PATCH /api/transactions/:id/confirm-delivery - Xác nhận đã nhận hàng
router.patch("/:id/confirm-delivery", authenticateToken, shippingHandlers.confirmDelivery);

// PATCH /api/transactions/:id/complete - Hoàn thành giao dịch
router.patch("/:id/complete", authenticateToken, shippingHandlers.completeTransaction);

module.exports = router;
