const express = require("express");
const Category = require("../models/Category");
const Post = require("../models/Post");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// GET /api/categories - Lấy danh sách danh mục
router.get("/", async (req, res) => {
  try {
    const { includeStats = false } = req.query;

    const categories = await Category.find({ trangThai: "active" }).sort({
      tenDanhMuc: 1,
    });

    // Nếu cần thống kê số bài đăng
    if (includeStats === "true") {
      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          const postCount = await Post.countDocuments({
            danhMuc: category._id,
            trangThai: "approved",
          });

          return {
            ...category.toObject(),
            postCount,
          };
        })
      );

      return res.json({
        message: "Lấy danh sách danh mục thành công",
        categories: categoriesWithStats,
      });
    }

    res.json({
      message: "Lấy danh sách danh mục thành công",
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách danh mục",
      error: error.message,
    });
  }
});

// POST /api/categories - Tạo danh mục mới (Admin only)
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { tenDanhMuc, moTa, icon } = req.body;

    // Kiểm tra tên danh mục đã tồn tại
    const existingCategory = await Category.findOne({
      tenDanhMuc: { $regex: new RegExp(`^${tenDanhMuc}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        message: "Tên danh mục đã tồn tại",
        code: "CATEGORY_EXISTS",
      });
    }

    const category = new Category({
      tenDanhMuc,
      moTa,
      icon: icon || "fas fa-box",
    });

    await category.save();

    res.status(201).json({
      message: "Tạo danh mục thành công",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      message: "Lỗi server khi tạo danh mục",
      error: error.message,
    });
  }
});

// PUT /api/categories/:id - Cập nhật danh mục (Admin only)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { tenDanhMuc, moTa, icon, trangThai } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { tenDanhMuc, moTa, icon, trangThai },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        message: "Không tìm thấy danh mục",
        code: "CATEGORY_NOT_FOUND",
      });
    }

    res.json({
      message: "Cập nhật danh mục thành công",
      category,
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({
      message: "Lỗi server khi cập nhật danh mục",
      error: error.message,
    });
  }
});

// DELETE /api/categories/:id - Xóa danh mục (Admin only)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Kiểm tra có bài đăng nào đang sử dụng danh mục này không
    const postCount = await Post.countDocuments({ danhMuc: categoryId });

    if (postCount > 0) {
      return res.status(400).json({
        message: `Không thể xóa danh mục vì còn ${postCount} bài đăng đang sử dụng`,
        code: "CATEGORY_IN_USE",
      });
    }

    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json({
        message: "Không tìm thấy danh mục",
        code: "CATEGORY_NOT_FOUND",
      });
    }

    res.json({
      message: "Xóa danh mục thành công",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      message: "Lỗi server khi xóa danh mục",
      error: error.message,
    });
  }
});

// GET /api/categories/:id - Lấy thông tin danh mục theo ID
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Không tìm thấy danh mục",
        code: "CATEGORY_NOT_FOUND",
      });
    }

    // Lấy số bài đăng trong danh mục
    const postCount = await Post.countDocuments({
      danhMuc: category._id,
      trangThai: "approved",
    });

    res.json({
      message: "Lấy thông tin danh mục thành công",
      category: {
        ...category.toObject(),
        postCount,
      },
    });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy thông tin danh mục",
      error: error.message,
    });
  }
});

module.exports = router;
