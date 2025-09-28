const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    baiDang: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    nguoiMua: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nguoiBan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    giaThanhToan: {
      type: Number,
      required: true,
      min: 0,
    },
    phuongThucThanhToan: {
      type: String,
      enum: ["tien-mat", "chuyen-khoan", "trao-doi", "mien-phi"],
      default: "tien-mat",
    },
    diaDiemGiaoDich: {
      type: String,
      trim: true,
      maxlength: [200, "Địa điểm giao dịch không được quá 200 ký tự"],
    },
    thoiGianGiaoDich: {
      type: Date,
    },
    trangThai: {
      type: String,
      enum: ["dang-thoa-thuan", "da-dong-y", "hoan-thanh", "huy-bo"],
      default: "dang-thoa-thuan",
    },
    ghiChu: {
      type: String,
      trim: true,
      maxlength: [500, "Ghi chú không được quá 500 ký tự"],
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
transactionSchema.index({ nguoiMua: 1, trangThai: 1 });
transactionSchema.index({ nguoiBan: 1, trangThai: 1 });
transactionSchema.index({ baiDang: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
