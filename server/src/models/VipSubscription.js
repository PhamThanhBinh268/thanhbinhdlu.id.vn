const mongoose = require("mongoose");

/**
 * VIP Subscription Model - User's VIP membership records
 */
const vipSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VipPackage",
      required: true,
    },
    packageName: {
      type: String,
      required: true,
      enum: ["basic", "professional", "vip"],
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    postLimit: {
      type: Number,
      required: true,
    },
    postsUsed: {
      type: Number,
      default: 0,
    },
    postsRemaining: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["momo", "zalopay", "banking", "cash"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

vipSubscriptionSchema.index({ user: 1, status: 1 });
vipSubscriptionSchema.index({ endDate: 1, status: 1 });

// Method to check if subscription is still valid
vipSubscriptionSchema.methods.isValid = function () {
  return this.status === "active" && new Date() < this.endDate;
};

// Static method to find active subscription for user
vipSubscriptionSchema.statics.findActiveForUser = async function (userId) {
  return this.findOne({
    user: userId,
    status: "active",
    endDate: { $gt: new Date() },
  })
    .populate("package")
    .sort({ endDate: -1 });
};

module.exports = mongoose.model("VipSubscription", vipSubscriptionSchema);
