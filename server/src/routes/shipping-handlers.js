const Transaction = require("../models/Transaction");

/**
 * PATCH /api/transactions/:id/start-shipping
 * Người bán bắt đầu giao hàng (nhập mã vận đơn)
 * Chuyển trạng thái: xac-nhan-thanh-toan → dang-giao-hang
 */
exports.startShipping = async (req, res) => {
  try {
    const { id } = req.params;
    const { maVanDon, donViVanChuyen, thoiGianGiaoHangDuKien } = req.body;

    // 1. Tìm transaction
    const transaction = await Transaction.findById(id)
      .populate("nguoiDeNghi", "hoTen email")
      .populate("nguoiBan", "hoTen email")
      .populate("baiDang", "tenSanPham");

    if (!transaction) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    }

    // 2. Kiểm tra quyền: Chỉ người bán
    if (transaction.nguoiBan._id.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Chỉ người bán mới có quyền bắt đầu giao hàng",
      });
    }

    // 3. Kiểm tra trạng thái
    if (transaction.trangThai !== "xac-nhan-thanh-toan") {
      return res.status(400).json({
        message: "Giao dịch phải ở trạng thái 'Xác nhận thanh toán'",
        trangThaiHienTai: transaction.trangThai,
      });
    }

    // 4. Nếu là giao hàng tận nơi → cần mã vận đơn
    if (transaction.hinhThucGiaoHang === "giao-hang-tan-noi") {
      if (!maVanDon || maVanDon.trim() === "") {
        return res.status(400).json({
          message: "Vui lòng cung cấp mã vận đơn",
        });
      }

      const validCarriers = ["ghn", "ghtk", "j&t", "viettel-post", "vnpost", "khac"];
      if (!validCarriers.includes(donViVanChuyen)) {
        return res.status(400).json({
          message: "Đơn vị vận chuyển không hợp lệ",
          valid: validCarriers,
        });
      }

      transaction.maVanDon = maVanDon;
      transaction.donViVanChuyen = donViVanChuyen;
      transaction.thoiGianGiaoHangDuKien = thoiGianGiaoHangDuKien
        ? new Date(thoiGianGiaoHangDuKien)
        : null;
    }
    // Nếu là gặp trực tiếp → không cần mã vận đơn, chỉ xác nhận đã hẹn

    // 5. Cập nhật trạng thái
    transaction.trangThai = "dang-giao-hang";

    await transaction.save();

    // 6. Populate lại
    await transaction.populate("baiDang", "tenSanPham hinhAnh");

    res.json({
      message:
        transaction.hinhThucGiaoHang === "gap-truc-tiep"
          ? "Đã xác nhận hẹn gặp. Chờ người mua xác nhận đã nhận hàng."
          : "Đã bắt đầu giao hàng. Chờ người mua xác nhận đã nhận hàng.",
      transaction,
    });
  } catch (error) {
    console.error("Error in startShipping:", error);
    res.status(500).json({
      message: "Lỗi khi bắt đầu giao hàng",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/transactions/:id/confirm-delivery
 * Người mua xác nhận đã nhận hàng
 * Chuyển trạng thái: dang-giao-hang → da-nhan-hang
 */
exports.confirmDelivery = async (req, res) => {
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

    // 2. Kiểm tra quyền: Chỉ người mua
    if (transaction.nguoiDeNghi._id.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Chỉ người mua mới có quyền xác nhận đã nhận hàng",
      });
    }

    // 3. Kiểm tra trạng thái
    if (transaction.trangThai !== "dang-giao-hang") {
      return res.status(400).json({
        message: "Giao dịch phải ở trạng thái 'Đang giao hàng'",
        trangThaiHienTai: transaction.trangThai,
      });
    }

    // 4. Cập nhật transaction
    transaction.trangThai = "da-nhan-hang";
    transaction.thoiGianGiaoHangThucTe = new Date();

    await transaction.save();

    // 5. Populate lại
    await transaction.populate("baiDang", "tenSanPham hinhAnh");

    res.json({
      message: "Xác nhận đã nhận hàng thành công. Vui lòng đánh giá giao dịch.",
      transaction,
      nextStep: "Đánh giá người bán để hoàn thành giao dịch",
    });
  } catch (error) {
    console.error("Error in confirmDelivery:", error);
    res.status(500).json({
      message: "Lỗi khi xác nhận nhận hàng",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/transactions/:id/complete
 * Hoàn thành giao dịch (sau khi đánh giá)
 * Chuyển trạng thái: da-nhan-hang → hoan-thanh
 */
exports.completeTransaction = async (req, res) => {
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

    // 2. Kiểm tra quyền: Người mua hoặc người bán
    const userId = req.user.userId;
    if (
      transaction.nguoiDeNghi._id.toString() !== userId &&
      transaction.nguoiBan._id.toString() !== userId
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền hoàn thành giao dịch này",
      });
    }

    // 3. Kiểm tra trạng thái
    if (transaction.trangThai !== "da-nhan-hang") {
      return res.status(400).json({
        message: "Giao dịch phải ở trạng thái 'Đã nhận hàng'",
        trangThaiHienTai: transaction.trangThai,
      });
    }

    // 4. Cập nhật trạng thái
    transaction.trangThai = "hoan-thanh";

    await transaction.save();

    // 5. Populate lại
    await transaction.populate("baiDang", "tenSanPham hinhAnh");

    res.json({
      message: "Giao dịch đã hoàn thành",
      transaction,
    });
  } catch (error) {
    console.error("Error in completeTransaction:", error);
    res.status(500).json({
      message: "Lỗi khi hoàn thành giao dịch",
      error: error.message,
    });
  }
};
