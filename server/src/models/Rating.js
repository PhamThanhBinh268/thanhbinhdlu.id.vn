const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    tuNguoiDung: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    denNguoiDung: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    giaoDich: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    soSao: {
      type: Number,
      required: [true, "Số sao đánh giá là bắt buộc"],
      min: [1, "Đánh giá tối thiểu 1 sao"],
      max: [5, "Đánh giá tối đa 5 sao"],
    },
    binhLuan: {
      type: String,
      trim: true,
      maxlength: [500, "Bình luận không được quá 500 ký tự"],
    },
    loaiDanhGia: {
      type: String,
      enum: ["nguoi-ban", "nguoi-mua"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Đảm bảo mỗi giao dịch chỉ được đánh giá 1 lần bởi mỗi người
ratingSchema.index(
  {
    tuNguoiDung: 1,
    giaoDich: 1,
  },
  { unique: true }
);

ratingSchema.index({ denNguoiDung: 1, createdAt: -1 });

module.exports = mongoose.model("Rating", ratingSchema);
