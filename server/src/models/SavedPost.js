const mongoose = require("mongoose");

const savedPostSchema = new mongoose.Schema(
  {
    nguoiDung: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    baiDang: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Đảm bảo không lưu trùng bài đăng
savedPostSchema.index(
  {
    nguoiDung: 1,
    baiDang: 1,
  },
  { unique: true }
);

module.exports = mongoose.model("SavedPost", savedPostSchema);
