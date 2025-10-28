const Transaction = require("../models/Transaction");
const User = require("../models/User");
const cloudinary = require("../utils/cloudinary");

/**
 * PATCH /api/transactions/:id/setup-payment
 * Người mua thiết lập phương thức thanh toán và giao hàng
 * Chuyển trạng thái: da-dong-y → cho-thanh-toan
 */
exports.setupPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      phuongThucThanhToan,
      thongTinThanhToan,
      hinhThucGiaoHang,
      diaDiemGap,
      diaChiGiaoHang,
      phiShip,
      nguoiTraShip,
    } = req.body;

    // 1. Tìm transaction
    const transaction = await Transaction.findById(id)
      .populate("nguoiDeNghi", "hoTen email")
      .populate("nguoiBan", "hoTen email")
      .populate("baiDang", "tenSanPham loaiGia");

    if (!transaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    }

    // 2. Kiểm tra quyền: Chỉ người mua mới được setup payment
    if (transaction.nguoiDeNghi._id.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Chỉ người mua mới có quyền thiết lập thanh toán",
      });
    }

    // 3. Kiểm tra trạng thái: Phải ở trạng thái "da-dong-y"
    if (transaction.trangThai !== "da-dong-y") {
      return res.status(400).json({
        message: "Giao dịch phải ở trạng thái 'Đã đồng ý' mới có thể thiết lập thanh toán",
        trangThaiHienTai: transaction.trangThai,
      });
    }

    // 4. Validate phương thức thanh toán
    const validPaymentMethods = [
      "tien-mat",
      "chuyen-khoan",
      "momo",
      "zalopay",
      "khong-can-thanh-toan",
    ];
    if (!validPaymentMethods.includes(phuongThucThanhToan)) {
      return res.status(400).json({
        message: "Phương thức thanh toán không hợp lệ",
        valid: validPaymentMethods,
      });
    }

    // 5. Validate hình thức giao hàng
    const validShippingMethods = ["gap-truc-tiep", "giao-hang-tan-noi"];
    if (!validShippingMethods.includes(hinhThucGiaoHang)) {
      return res.status(400).json({
        message: "Hình thức giao hàng không hợp lệ",
        valid: validShippingMethods,
      });
    }

    // 6. Validate địa điểm gặp / địa chỉ giao hàng
    if (hinhThucGiaoHang === "gap-truc-tiep") {
      if (!diaDiemGap || diaDiemGap.trim() === "") {
        return res.status(400).json({
          message: "Vui lòng cung cấp địa điểm gặp",
        });
      }
    } else if (hinhThucGiaoHang === "giao-hang-tan-noi") {
      if (!diaChiGiaoHang || !diaChiGiaoHang.diaChiChiTiet) {
        return res.status(400).json({
          message: "Vui lòng cung cấp địa chỉ giao hàng đầy đủ",
        });
      }
    }

    // 7. Validate thông tin thanh toán (nếu cần)
    if (phuongThucThanhToan === "chuyen-khoan") {
      if (
        !thongTinThanhToan ||
        !thongTinThanhToan.tenNganHang ||
        !thongTinThanhToan.soTaiKhoan ||
        !thongTinThanhToan.tenTaiKhoan
      ) {
        return res.status(400).json({
          message: "Vui lòng cung cấp đầy đủ thông tin ngân hàng",
        });
      }
    } else if (phuongThucThanhToan === "momo") {
      if (!thongTinThanhToan || !thongTinThanhToan.soDienThoaiMomo) {
        return res.status(400).json({
          message: "Vui lòng cung cấp số điện thoại Momo",
        });
      }
    } else if (phuongThucThanhToan === "zalopay") {
      if (!thongTinThanhToan || !thongTinThanhToan.soDienThoaiZalo) {
        return res.status(400).json({
          message: "Vui lòng cung cấp số điện thoại ZaloPay",
        });
      }
    }

    // 8. Xác định trạng thái tiếp theo
    let nextStatus = "cho-thanh-toan";

    // Nếu là giao dịch miễn phí hoặc trao đổi không có tiền bù → Bỏ qua thanh toán
    if (
      transaction.loaiGiaoDich === "mien-phi" ||
      (transaction.loaiGiaoDich === "trao-doi" && transaction.tienBu === 0) ||
      phuongThucThanhToan === "khong-can-thanh-toan"
    ) {
      nextStatus = "xac-nhan-thanh-toan"; // Bỏ qua bước thanh toán
    }

    // 9. Cập nhật transaction
    transaction.phuongThucThanhToan = phuongThucThanhToan;
    transaction.thongTinThanhToan = thongTinThanhToan || {};
    transaction.hinhThucGiaoHang = hinhThucGiaoHang;
    transaction.diaDiemGap = diaDiemGap || null;
    transaction.diaChiGiaoHang = diaChiGiaoHang || {};
    transaction.phiShip = phiShip || 0;
    transaction.nguoiTraShip = nguoiTraShip || "nguoi-mua";
    transaction.trangThai = nextStatus;

    await transaction.save();

    // 10. Populate lại để trả về đầy đủ
    await transaction.populate("nguoiDeNghi", "hoTen email");
    await transaction.populate("nguoiBan", "hoTen email");
    await transaction.populate("baiDang", "tenSanPham loaiGia hinhAnh");

    res.json({
      message: "Thiết lập thanh toán thành công",
      transaction,
      nextStep:
        nextStatus === "cho-thanh-toan"
          ? "Vui lòng chuyển khoản và upload ảnh chứng minh"
          : "Giao dịch đã sẵn sàng để giao hàng",
    });
  } catch (error) {
    console.error("Error in setupPayment:", error);
    res.status(500).json({
      message: "Lỗi khi thiết lập thanh toán",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/transactions/:id/upload-payment-proof
 * Người mua upload ảnh chứng minh chuyển khoản
 * Chuyển trạng thái: cho-thanh-toan → da-thanh-toan
 */
exports.uploadPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { anhChuyenKhoan } = req.body; // URL từ Cloudinary

    // 1. Tìm transaction
    const transaction = await Transaction.findById(id)
      .populate("nguoiDeNghi", "hoTen email")
      .populate("nguoiBan", "hoTen email");

    if (!transaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    }

    // 2. Kiểm tra quyền
    if (transaction.nguoiDeNghi._id.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Chỉ người mua mới có quyền upload chứng minh thanh toán",
      });
    }

    // 3. Kiểm tra trạng thái
    if (transaction.trangThai !== "cho-thanh-toan") {
      return res.status(400).json({
        message: "Giao dịch phải ở trạng thái 'Chờ thanh toán'",
        trangThaiHienTai: transaction.trangThai,
      });
    }

    // 4. Kiểm tra phương thức thanh toán (không cần ảnh nếu là tiền mặt)
    if (transaction.phuongThucThanhToan === "tien-mat") {
      return res.status(400).json({
        message: "Giao dịch tiền mặt không cần upload ảnh chuyển khoản",
      });
    }

    // 5. Validate URL ảnh
    if (!anhChuyenKhoan || anhChuyenKhoan.trim() === "") {
      return res.status(400).json({
        message: "Vui lòng cung cấp ảnh chứng minh chuyển khoản",
      });
    }

    // 6. Cập nhật transaction
    transaction.anhChuyenKhoan = anhChuyenKhoan;
    transaction.thoiGianThanhToan = new Date();
    transaction.trangThai = "da-thanh-toan";

    await transaction.save();

    // 7. Populate lại
    await transaction.populate("baiDang", "tenSanPham hinhAnh");

    res.json({
      message: "Upload ảnh chuyển khoản thành công. Chờ người bán xác nhận.",
      transaction,
    });
  } catch (error) {
    console.error("Error in uploadPaymentProof:", error);
    res.status(500).json({
      message: "Lỗi khi upload ảnh chuyển khoản",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/transactions/:id/confirm-payment
 * Người bán xác nhận đã nhận tiền
 * Chuyển trạng thái: da-thanh-toan → xac-nhan-thanh-toan
 */
exports.confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Tìm transaction
    const transaction = await Transaction.findById(id)
      .populate("nguoiDeNghi", "hoTen email")
      .populate("nguoiBan", "hoTen email")
      .populate("baiDang", "tenSanPham");

    if (!transaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    }

    // 2. Kiểm tra quyền: Chỉ người bán mới được confirm
    if (transaction.nguoiBan._id.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Chỉ người bán mới có quyền xác nhận thanh toán",
      });
    }

    // 3. Kiểm tra trạng thái
    if (transaction.trangThai !== "da-thanh-toan") {
      return res.status(400).json({
        message: "Giao dịch phải ở trạng thái 'Đã thanh toán'",
        trangThaiHienTai: transaction.trangThai,
      });
    }

    // 4. Cập nhật transaction
    transaction.trangThai = "xac-nhan-thanh-toan";

    await transaction.save();

    // 5. Populate lại
    await transaction.populate("baiDang", "tenSanPham hinhAnh");

    res.json({
      message: "Xác nhận thanh toán thành công. Sẵn sàng giao hàng.",
      transaction,
      nextStep: "Vui lòng cung cấp thông tin vận chuyển",
    });
  } catch (error) {
    console.error("Error in confirmPayment:", error);
    res.status(500).json({
      message: "Lỗi khi xác nhận thanh toán",
      error: error.message,
    });
  }
};
