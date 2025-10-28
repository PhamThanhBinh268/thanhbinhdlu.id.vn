const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // Loại giao dịch: mua bán thông thường, trao đổi, hoặc cho miễn phí
    loaiGiaoDich: {
      type: String,
      enum: ["mua", "trao-doi", "mien-phi"],
      required: true,
      default: "mua",
    },
    
    // Bài đăng được đề nghị (bài của người bán)
    baiDang: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    
    // Người đề nghị (người mua/người muốn trao đổi/người xin miễn phí)
    nguoiDeNghi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Chủ bài đăng (người bán/người cho trao đổi)
    nguoiBan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Giá đề xuất (cho trường hợp mua)
    giaDeXuat: {
      type: Number,
      min: 0,
    },
    
    // Bài đăng của người đề nghị (cho trường hợp trao đổi)
    baiDangTraoDoi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    
    // Tiền bù (cho trường hợp trao đổi có chênh lệch giá)
    tienBu: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Lời nhắn từ người đề nghị
    loiNhan: {
      type: String,
      trim: true,
      maxlength: [500, "Lời nhắn không được quá 500 ký tự"],
    },
    
    // Giá thanh toán cuối cùng (sau khi đồng ý)
    giaThanhToan: {
      type: Number,
      min: 0,
    },
    
    phuongThucThanhToan: {
      type: String,
      enum: ["tien-mat", "chuyen-khoan", "trao-doi", "mien-phi"],
    },
    
    diaDiemGiaoDich: {
      type: String,
      trim: true,
      maxlength: [200, "Địa điểm giao dịch không được quá 200 ký tự"],
    },
    
    thoiGianGiaoDich: {
      type: Date,
    },
    
    // Trạng thái giao dịch (cập nhật để support full workflow)
    trangThai: {
      type: String,
      enum: [
        "cho-duyet",              // Đang chờ người bán xem xét
        "da-dong-y",              // Người bán đồng ý - chờ setup thanh toán & giao hàng
        "cho-thanh-toan",         // Chờ thanh toán (nếu có tiền)
        "da-thanh-toan",          // Đã thanh toán - chờ xác nhận
        "xac-nhan-thanh-toan",    // Đã xác nhận nhận tiền - sẵn sàng giao hàng
        "dang-giao-hang",         // Đang giao hàng
        "da-nhan-hang",           // Người mua đã nhận hàng
        "hoan-thanh",             // Giao dịch hoàn thành
        "tu-choi",                // Người bán từ chối
        "huy-bo"                  // Hủy bỏ
      ],
      default: "cho-duyet",
    },
    
    // ===== THÔNG TIN THANH TOÁN =====
    
    // Phương thức thanh toán
    phuongThucThanhToan: {
      type: String,
      enum: ["tien-mat", "chuyen-khoan", "momo", "zalopay", "khong-can-thanh-toan"],
    },
    
    // Thông tin tài khoản người nhận tiền
    thongTinThanhToan: {
      tenNganHang: String,        // VCB, ACB, Techcombank...
      soTaiKhoan: String,
      tenTaiKhoan: String,
      soDienThoaiMomo: String,    // Nếu dùng Momo
      soDienThoaiZalo: String,    // Nếu dùng ZaloPay
    },
    
    // Bằng chứng thanh toán (ảnh chuyển khoản)
    anhChuyenKhoan: {
      type: String,  // URL ảnh trên Cloudinary
    },
    
    // Thời gian thanh toán
    thoiGianThanhToan: {
      type: Date,
    },
    
    // ===== THÔNG TIN GIAO HÀNG =====
    
    // Hình thức giao hàng
    hinhThucGiaoHang: {
      type: String,
      enum: ["gap-truc-tiep", "giao-hang-tan-noi"],
    },
    
    // Địa điểm gặp (nếu gặp trực tiếp)
    diaDiemGap: {
      type: String,
      trim: true,
      maxlength: [200, "Địa điểm không được quá 200 ký tự"],
    },
    
    // Địa chỉ giao hàng (nếu ship)
    diaChiGiaoHang: {
      hoTen: String,
      soDienThoai: String,
      diaChiChiTiet: String,
      phuongXa: String,
      quanHuyen: String,
      tinhThanh: String,
    },
    
    // Phí ship
    phiShip: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Ai trả phí ship
    nguoiTraShip: {
      type: String,
      enum: ["nguoi-mua", "nguoi-ban", "chia-doi"],
    },
    
    // Mã vận đơn (tracking number)
    maVanDon: {
      type: String,
      trim: true,
    },
    
    // Đơn vị vận chuyển
    donViVanChuyen: {
      type: String,
      enum: ["ghn", "ghtk", "j&t", "viettel-post", "vnpost", "khac"],
    },
    
    // Thời gian giao hàng dự kiến
    thoiGianGiaoHangDuKien: {
      type: Date,
    },
    
    // Thời gian giao hàng thực tế
    thoiGianGiaoHangThucTe: {
      type: Date,
    },
    
    // ===== NOTES & REASONS =====
    
    ghiChu: {
      type: String,
      trim: true,
      maxlength: [500, "Ghi chú không được quá 500 ký tự"],
    },
    
    lyDoTuChoi: {
      type: String,
      trim: true,
      maxlength: [200, "Lý do từ chối không được quá 200 ký tự"],
    },
    
    lyDoHuy: {
      type: String,
      trim: true,
      maxlength: [200, "Lý do hủy không được quá 200 ký tự"],
    },
  },
  {
    timestamps: true,
  }
);

// Index để query nhanh
transactionSchema.index({ nguoiDeNghi: 1, trangThai: 1 });
transactionSchema.index({ nguoiBan: 1, trangThai: 1 });
transactionSchema.index({ baiDang: 1, trangThai: 1 });
transactionSchema.index({ loaiGiaoDich: 1 });
transactionSchema.index({ createdAt: -1 });

// Virtual field for backward compatibility (nguoiMua = nguoiDeNghi)
transactionSchema.virtual('nguoiMua').get(function() {
  return this.nguoiDeNghi;
});

// Ensure virtuals are included when converting to JSON
transactionSchema.set('toJSON', { virtuals: true });
transactionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Transaction", transactionSchema);
