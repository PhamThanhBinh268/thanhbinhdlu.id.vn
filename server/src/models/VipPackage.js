const mongoose = require("mongoose");

/**
 * VIP Package Model
 * Định nghĩa các gói VIP
 */
const vipPackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["basic", "professional", "vip"],
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    postLimit: {
      type: Number, // Số tin đăng được phép
      required: true,
    },
    postDuration: {
      type: Number, // Số ngày tin đăng hiển thị
      default: 15,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

vipPackageSchema.index({ name: 1, isActive: 1 });

module.exports = mongoose.model("VipPackage", vipPackageSchema);
