const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    nguoiGui: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nguoiNhan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    noiDung: {
      type: String,
      required: [true, "Nội dung tin nhắn là bắt buộc"],
      trim: true,
      maxlength: [1000, "Tin nhắn không được quá 1000 ký tự"],
    },
    loaiTinNhan: {
      type: String,
      enum: ["text", "image", "system"],
      default: "text",
    },
    baiDangLienQuan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    trangThai: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    thoiGianDoc: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index để query nhanh
messageSchema.index({ nguoiGui: 1, nguoiNhan: 1, createdAt: -1 });
messageSchema.index({ trangThai: 1 });

// Đánh dấu tin nhắn đã đọc
messageSchema.methods.markAsRead = async function () {
  if (this.trangThai !== "read") {
    this.trangThai = "read";
    this.thoiGianDoc = new Date();
    await this.save();
  }
};

module.exports = mongoose.model("Message", messageSchema);
