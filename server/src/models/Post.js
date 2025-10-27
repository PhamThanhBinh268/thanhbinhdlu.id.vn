const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    tieuDe: {
      type: String,
      required: [true, "Tiêu đề là bắt buộc"],
      trim: true,
      maxlength: [200, "Tiêu đề không được quá 200 ký tự"],
    },
    moTa: {
      type: String,
      required: [true, "Mô tả là bắt buộc"],
      trim: true,
      maxlength: [2000, "Mô tả không được quá 2000 ký tự"],
    },
    gia: {
      type: Number,
      required: [true, "Giá là bắt buộc"],
      min: [0, "Giá không được âm"],
    },
    giaGoc: {
      type: Number, // Giá gốc (trước khi giảm) - người bán tự set
      min: [0, "Giá gốc không được âm"],
    },
    tyLeGiamGia: {
      type: Number, // % giảm giá (0-100) - người bán tự set
      min: [0, "Tỷ lệ giảm giá không được âm"],
      max: [100, "Tỷ lệ giảm giá không được quá 100%"],
      default: 0,
    },
    loaiGia: {
      type: String,
      enum: ["ban", "trao-doi", "cho-mien-phi"],
      default: "ban",
    },
    hinhAnh: [
      {
        type: String, // URL của ảnh trên Cloudinary
        required: true,
      },
    ],
    // Lưu thêm chi tiết để có thể xoá ảnh trên Cloudinary khi cần
    hinhAnhChiTiet: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        _id: false,
      },
    ],
    danhMuc: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Danh mục là bắt buộc"],
    },
    nguoiDang: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    diaDiem: {
      type: String,
      trim: true,
      maxlength: [100, "Địa điểm không được quá 100 ký tự"],
    },
    tinhTrang: {
      type: String,
      enum: ["moi", "nhu-moi", "tot", "can-sua-chua"],
      default: "tot",
    },
    trangThai: {
      type: String,
      enum: ["pending", "approved", "rejected", "sold", "hidden"],
      default: "pending",
    },
    lyDoTuChoi: {
      type: String,
      trim: true,
    },
    luotXem: {
      type: Number,
      default: 0,
    },
    luotThich: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    // Tính năng dịch vụ trả phí
    tinhNangDichVu: {
      noiBat: { // Admin đánh dấu nổi bật (featured)
        type: Boolean,
        default: false,
      },
      tinVip: { // Người bán mua gói VIP
        type: Boolean,
        default: false,
        expireAt: Date, // Thời gian hết hạn VIP
      },
      dayTin: { // Người bán mua gói đẩy tin (boost)
        type: Boolean,
        default: false,
        expireAt: Date,
        boostCount: { type: Number, default: 0 }, // Số lần đẩy còn lại
      },
    },
    danhGia: [
      {
        nguoiDanhGia: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        diemDanhGia: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        binhLuan: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        ngayDanhGia: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm nhanh
postSchema.index({ tieuDe: "text", moTa: "text", tags: "text" });
postSchema.index({ danhMuc: 1, trangThai: 1 });
postSchema.index({ nguoiDang: 1, trangThai: 1 });
postSchema.index({ gia: 1 });
postSchema.index({ createdAt: -1 });

// Tăng lượt xem
postSchema.methods.increaseViews = async function () {
  this.luotXem += 1;
  await this.save();
};

module.exports = mongoose.model("Post", postSchema);
