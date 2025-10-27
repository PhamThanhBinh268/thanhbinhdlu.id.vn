const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/stats/homepage - Basic counters for homepage
router.get("/homepage", async (req, res) => {
  try {
    const [totalPosts, totalUsers, totalTransactions] = await Promise.all([
      Post.countDocuments({ trangThai: "approved" }),
      User.countDocuments({ trangThai: "active" }),
      Transaction.countDocuments({ trangThai: "hoan-thanh" }),
    ]);

    return res.json({
      success: true,
      data: {
        totalPosts,
        totalUsers,
        totalTransactions,
      },
    });
  } catch (error) {
    console.error("[STATS_HOME_ERROR]", error);
    return res.status(500).json({
      message: "Lỗi server khi lấy thống kê trang chủ",
      error: error.message,
    });
  }
});

module.exports = router;

// =============== Admin Stats ===============
// GET /api/stats/admin - Tổng hợp số liệu cho dashboard admin
router.get("/admin", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalPosts,
      totalUsers,
      totalTransactions,
      postsByStatusAgg,
      transactionsByStatusAgg,
      recentPosts,
      recentUsers,
    ] = await Promise.all([
      Post.countDocuments({}),
      User.countDocuments({}),
      Transaction.countDocuments({}),
      Post.aggregate([
        { $group: { _id: "$trangThai", count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $group: { _id: "$trangThai", count: { $sum: 1 } } },
      ]),
      Post.find({})
        .select("tieuDe trangThai createdAt")
        .sort({ createdAt: -1 })
        .limit(5),
      User.find({})
        .select("hoTen email vaiTro createdAt")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const postsByStatus = postsByStatusAgg.reduce((m, i) => {
      m[i._id || "unknown"] = i.count;
      return m;
    }, {});
    const transactionsByStatus = transactionsByStatusAgg.reduce((m, i) => {
      m[i._id || "unknown"] = i.count;
      return m;
    }, {});

    res.json({
      success: true,
      data: {
        totals: { totalPosts, totalUsers, totalTransactions },
        postsByStatus,
        transactionsByStatus,
        recentPosts,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("[STATS_ADMIN_ERROR]", error);
    res.status(500).json({ message: "Lỗi thống kê admin", error: error.message });
  }
});
