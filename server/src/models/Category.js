const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    tenDanhMuc: {
      type: String,
      required: [true, "Tên danh mục là bắt buộc"],
      unique: true,
      trim: true,
      maxlength: [50, "Tên danh mục không được quá 50 ký tự"],
    },
    moTa: {
      type: String,
      trim: true,
      maxlength: [200, "Mô tả không được quá 200 ký tự"],
    },
    icon: {
      type: String,
      default: "fas fa-box", // Font Awesome icon class
    },
    trangThai: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
