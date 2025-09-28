const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { uploadMultipleImages, deleteImage } = require("../utils/cloudinary");
const Post = require("../models/Post");
const SavedPost = require("../models/SavedPost");
const Category = require("../models/Category");
const {
  authenticateToken,
  optionalAuth,
  requireAdmin,
} = require("../middleware/auth");
const { validation, handleValidation } = require("../middleware/validation");

const router = express.Router();

// Cloudinary config moved to util ensureInit (utils/cloudinary)

// Cấu hình multer để upload ảnh
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh"), false);
    }
  },
});

// GET /api/posts - Lấy danh sách bài đăng (có phân trang & lọc)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      danhMuc,
      minPrice,
      maxPrice,
      loaiGia,
      tinhTrang,
      diaDiem,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Xây dựng query filter
    const filter = { trangThai: "approved" };

    // Tìm kiếm theo từ khóa
    if (search) {
      filter.$text = { $search: search };
    }

    // Lọc theo danh mục
    if (danhMuc) {
      filter.danhMuc = danhMuc;
    }

    // Lọc theo giá
    if (minPrice || maxPrice) {
      filter.gia = {};
      if (minPrice) filter.gia.$gte = parseInt(minPrice);
      if (maxPrice) filter.gia.$lte = parseInt(maxPrice);
    }

    // Lọc theo loại giá
    if (loaiGia) {
      filter.loaiGia = loaiGia;
    }

    // Lọc theo tình trạng
    if (tinhTrang) {
      filter.tinhTrang = tinhTrang;
    }

    // Lọc theo địa điểm
    if (diaDiem) {
      filter.diaDiem = { $regex: diaDiem, $options: "i" };
    }

    // Xây dựng sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    const posts = await Post.find(filter)
      .populate("danhMuc", "tenDanhMuc icon")
      .populate("nguoiDang", "hoTen avatar diemUyTin")
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(filter);

    res.json({
      message: "Lấy danh sách bài đăng thành công",
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách bài đăng",
      error: error.message,
    });
  }
});

// GET /api/posts/:id - Lấy chi tiết bài đăng
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    // Kiểm tra xem id có phải là ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "ID bài đăng không hợp lệ",
        code: "INVALID_POST_ID",
      });
    }

    const post = await Post.findById(req.params.id)
      .populate("danhMuc", "tenDanhMuc icon")
      .populate("nguoiDang", "hoTen avatar diemUyTin soDienThoai createdAt");

    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài đăng",
        code: "POST_NOT_FOUND",
      });
    }

    // Tăng lượt xem nếu bài đăng được duyệt
    if (post.trangThai === "approved") {
      await post.increaseViews();
    }

    // Kiểm tra xem user hiện tại có lưu bài này không
    let isSaved = false;
    if (req.user) {
      const savedPost = await SavedPost.findOne({
        nguoiDung: req.user._id,
        baiDang: post._id,
      });
      isSaved = !!savedPost;
    }

    res.json({
      message: "Lấy chi tiết bài đăng thành công",
      post: {
        ...post.toObject(),
        isSaved,
      },
    });
  } catch (error) {
    console.error("Get post detail error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy chi tiết bài đăng",
      error: error.message,
    });
  }
});

// POST /api/posts - Tạo bài đăng mới
router.post(
  "/",
  authenticateToken,
  upload.array("hinhAnh", 5),
  validation.createPost,
  handleValidation,
  async (req, res) => {
    try {
      const { tieuDe, moTa, gia, danhMuc, diaDiem, loaiGia, tinhTrang, tags } =
        req.body;

      // Kiểm tra danh mục tồn tại
      const category = await Category.findById(danhMuc);
      if (!category) {
        return res.status(400).json({
          message: "Danh mục không tồn tại",
          code: "CATEGORY_NOT_FOUND",
        });
      }

      // Upload ảnh lên Cloudinary (sử dụng utils)
      let uploaded = [];
      if (req.files && req.files.length > 0) {
        uploaded = await uploadMultipleImages(req.files, {
          folder: "oldmarket/posts",
          transformation: [
            { width: 800, height: 600, crop: "limit" },
            { quality: "auto" },
          ],
        });
      }

      if (uploaded.length === 0) {
        return res.status(400).json({
          message: "Cần ít nhất một hình ảnh cho bài đăng",
          code: "NO_IMAGES",
        });
      }

      // Tạo bài đăng
      const post = new Post({
        tieuDe,
        moTa,
        gia: parseFloat(gia),
        hinhAnh: uploaded.map((i) => i.url),
        hinhAnhChiTiet: uploaded.map((i) => ({
          url: i.url,
          publicId: i.public_id,
        })),
        danhMuc,
        nguoiDang: req.user._id,
        diaDiem,
        loaiGia: loaiGia || "ban",
        tinhTrang: tinhTrang || "tot",
        tags: tags
          ? tags.split(",").map((tag) => tag.trim().toLowerCase())
          : [],
      });

      await post.save();

      // Populate để trả về đầy đủ thông tin
      await post.populate("danhMuc", "tenDanhMuc icon");
      await post.populate("nguoiDang", "hoTen avatar");

      res.status(201).json({
        message: "Tạo bài đăng thành công. Bài đăng đang chờ duyệt.",
        post,
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({
        message: "Lỗi server khi tạo bài đăng",
        error: error.message,
      });
    }
  }
);

// PUT /api/posts/:id - Cập nhật bài đăng
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài đăng",
        code: "POST_NOT_FOUND",
      });
    }

    // Chỉ cho phép chủ bài đăng hoặc admin cập nhật
    if (
      post.nguoiDang.toString() !== req.user._id.toString() &&
      req.user.vaiTro !== "admin"
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật bài đăng này",
        code: "FORBIDDEN",
      });
    }

    const updateData = {};
    const allowedFields = ["tieuDe", "moTa", "gia", "diaDiem", "tinhTrang"];

    // Admin có thể cập nhật thêm các trường khác
    if (req.user.vaiTro === "admin") {
      allowedFields.push("trangThai", "lyDoTuChoi");
    }

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Nếu user thường cập nhật thì chuyển về trạng thái pending
    if (req.user.vaiTro !== "admin" && Object.keys(updateData).length > 0) {
      updateData.trangThai = "pending";
    }

    const updatedPost = await Post.findByIdAndUpdate(postId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("danhMuc", "tenDanhMuc icon")
      .populate("nguoiDang", "hoTen avatar");

    res.json({
      message: "Cập nhật bài đăng thành công",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({
      message: "Lỗi server khi cập nhật bài đăng",
      error: error.message,
    });
  }
});

// DELETE /api/posts/:id - Xóa bài đăng
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài đăng",
        code: "POST_NOT_FOUND",
      });
    }

    // Chỉ cho phép chủ bài đăng hoặc admin xóa
    if (
      post.nguoiDang.toString() !== req.user._id.toString() &&
      req.user.vaiTro !== "admin"
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa bài đăng này",
        code: "FORBIDDEN",
      });
    }

    // Xoá ảnh trên Cloudinary nếu có publicId
    if (post.hinhAnhChiTiet && post.hinhAnhChiTiet.length) {
      for (const img of post.hinhAnhChiTiet) {
        if (img.publicId) {
          deleteImage(img.publicId); // không chờ để nhanh hơn
        }
      }
    }

    await Post.findByIdAndDelete(postId);
    await SavedPost.deleteMany({ baiDang: postId }); // Xóa các saved post liên quan

    res.json({
      message: "Xóa bài đăng thành công",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      message: "Lỗi server khi xóa bài đăng",
      error: error.message,
    });
  }
});

// POST /api/posts/:id/save - Lưu/Bỏ lưu bài đăng
router.post("/:id/save", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài đăng",
        code: "POST_NOT_FOUND",
      });
    }

    // Kiểm tra đã lưu chưa
    const existingSave = await SavedPost.findOne({
      nguoiDung: userId,
      baiDang: postId,
    });

    if (existingSave) {
      // Nếu đã lưu thì bỏ lưu
      await SavedPost.findByIdAndDelete(existingSave._id);
      res.json({
        message: "Đã bỏ lưu bài đăng",
        saved: false,
      });
    } else {
      // Nếu chưa lưu thì lưu
      const savedPost = new SavedPost({
        nguoiDung: userId,
        baiDang: postId,
      });
      await savedPost.save();

      res.json({
        message: "Đã lưu bài đăng",
        saved: true,
      });
    }
  } catch (error) {
    console.error("Save post error:", error);
    res.status(500).json({
      message: "Lỗi server khi lưu bài đăng",
      error: error.message,
    });
  }
});

// GET /api/posts/saved/me - Lấy danh sách bài đăng đã lưu
router.get("/saved/me", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const userId = req.user._id;

    const savedPosts = await SavedPost.find({ nguoiDung: userId })
      .populate({
        path: "baiDang",
        populate: [
          { path: "danhMuc", select: "tenDanhMuc icon" },
          { path: "nguoiDang", select: "hoTen avatar diemUyTin" },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SavedPost.countDocuments({ nguoiDung: userId });

    // Lọc ra các bài đăng còn tồn tại và được duyệt
    const validPosts = savedPosts
      .filter((item) => item.baiDang && item.baiDang.trangThai === "approved")
      .map((item) => ({
        ...item.baiDang.toObject(),
        savedAt: item.createdAt,
      }));

    res.json({
      message: "Lấy danh sách bài đăng đã lưu thành công",
      posts: validPosts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get saved posts error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách bài đăng đã lưu",
      error: error.message,
    });
  }
});

// PATCH /api/posts/:id/approve - Duyệt bài đăng (Admin only)
router.patch(
  "/:id/approve",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const postId = req.params.id;
      const { lyDoTuChoi } = req.body;

      const post = await Post.findByIdAndUpdate(
        postId,
        {
          trangThai: "approved",
          lyDoTuChoi: undefined, // Xóa lý do từ chối nếu có
        },
        { new: true }
      )
        .populate("danhMuc", "tenDanhMuc")
        .populate("nguoiDang", "hoTen avatar");

      if (!post) {
        return res.status(404).json({
          message: "Không tìm thấy bài đăng",
          code: "POST_NOT_FOUND",
        });
      }

      res.json({
        message: "Duyệt bài đăng thành công",
        post,
      });
    } catch (error) {
      console.error("Approve post error:", error);
      res.status(500).json({
        message: "Lỗi server khi duyệt bài đăng",
        error: error.message,
      });
    }
  }
);

// PATCH /api/posts/:id/reject - Từ chối bài đăng (Admin only)
router.patch(
  "/:id/reject",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const postId = req.params.id;
      const { lyDoTuChoi } = req.body;

      if (!lyDoTuChoi) {
        return res.status(400).json({
          message: "Cần cung cấp lý do từ chối",
          code: "REASON_REQUIRED",
        });
      }

      const post = await Post.findByIdAndUpdate(
        postId,
        {
          trangThai: "rejected",
          lyDoTuChoi,
        },
        { new: true }
      )
        .populate("danhMuc", "tenDanhMuc")
        .populate("nguoiDang", "hoTen avatar");

      if (!post) {
        return res.status(404).json({
          message: "Không tìm thấy bài đăng",
          code: "POST_NOT_FOUND",
        });
      }

      res.json({
        message: "Từ chối bài đăng thành công",
        post,
      });
    } catch (error) {
      console.error("Reject post error:", error);
      res.status(500).json({
        message: "Lỗi server khi từ chối bài đăng",
        error: error.message,
      });
    }
  }
);

module.exports = router;
// --- Image management routes (add/remove/reorder) ---
// POST /api/posts/:id/images - thêm ảnh mới (tối đa 5 tổng)
router.post(
  ":id/images",
  authenticateToken,
  upload.array("hinhAnh", 5),
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy bài đăng", code: "POST_NOT_FOUND" });
      }
      if (
        post.nguoiDang.toString() !== req.user._id.toString() &&
        req.user.vaiTro !== "admin"
      ) {
        return res
          .status(403)
          .json({ message: "Không có quyền", code: "FORBIDDEN" });
      }
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ message: "Chưa chọn ảnh", code: "NO_FILES" });
      }
      const currentCount = post.hinhAnhChiTiet?.length || 0;
      const remain = 8 - currentCount; // giới hạn tổng 8 ảnh
      if (remain <= 0) {
        return res
          .status(400)
          .json({ message: "Đã đạt giới hạn 8 ảnh", code: "LIMIT_REACHED" });
      }
      const slice = req.files.slice(0, remain);
      const uploaded = await uploadMultipleImages(slice, {
        folder: "oldmarket/posts",
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto" },
        ],
      });
      if (!uploaded.length) {
        return res
          .status(500)
          .json({ message: "Upload ảnh thất bại", code: "UPLOAD_FAILED" });
      }
      for (const img of uploaded) {
        post.hinhAnhChiTiet.push({ url: img.url, publicId: img.public_id });
        post.hinhAnh.push(img.url);
      }
      // User thường cập nhật -> quay lại pending (nếu đang approved)
      if (req.user.vaiTro !== "admin" && post.trangThai === "approved") {
        post.trangThai = "pending";
      }
      await post.save();
      res.json({ message: "Thêm ảnh thành công", post });
    } catch (e) {
      console.error("Add images error:", e);
      res
        .status(500)
        .json({ message: "Lỗi server khi thêm ảnh", error: e.message });
    }
  }
);

// DELETE /api/posts/:id/images/:publicId - xoá 1 ảnh
router.delete(":id/images/:publicId", authenticateToken, async (req, res) => {
  try {
    const { id, publicId } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy bài đăng", code: "POST_NOT_FOUND" });
    }
    if (
      post.nguoiDang.toString() !== req.user._id.toString() &&
      req.user.vaiTro !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Không có quyền", code: "FORBIDDEN" });
    }
    const before = post.hinhAnhChiTiet.length;
    post.hinhAnhChiTiet = post.hinhAnhChiTiet.filter(
      (img) => img.publicId !== publicId
    );
    if (post.hinhAnhChiTiet.length === before) {
      return res
        .status(404)
        .json({ message: "Ảnh không tồn tại", code: "IMAGE_NOT_FOUND" });
    }
    post.hinhAnh = post.hinhAnhChiTiet.map((i) => i.url);
    // Xoá trên Cloudinary (không await để phản hồi nhanh)
    deleteImage(publicId);
    if (req.user.vaiTro !== "admin" && post.trangThai === "approved") {
      post.trangThai = "pending";
    }
    await post.save();
    res.json({ message: "Xoá ảnh thành công", post });
  } catch (e) {
    console.error("Delete image error:", e);
    res
      .status(500)
      .json({ message: "Lỗi server khi xoá ảnh", error: e.message });
  }
});

// PATCH /api/posts/:id/images/reorder - sắp xếp lại thứ tự ảnh
router.patch(":id/images/reorder", authenticateToken, async (req, res) => {
  try {
    const { order } = req.body; // array các publicId theo thứ tự mới
    if (!Array.isArray(order) || !order.length) {
      return res
        .status(400)
        .json({ message: "Thiếu mảng order", code: "ORDER_REQUIRED" });
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy bài đăng", code: "POST_NOT_FOUND" });
    }
    if (
      post.nguoiDang.toString() !== req.user._id.toString() &&
      req.user.vaiTro !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Không có quyền", code: "FORBIDDEN" });
    }
    const map = new Map(post.hinhAnhChiTiet.map((img) => [img.publicId, img]));
    const newArr = [];
    for (const pid of order) {
      if (map.has(pid)) newArr.push(map.get(pid));
    }
    // Thêm các ảnh chưa nằm trong order vào cuối
    for (const img of post.hinhAnhChiTiet) {
      if (!order.includes(img.publicId)) newArr.push(img);
    }
    post.hinhAnhChiTiet = newArr;
    post.hinhAnh = newArr.map((i) => i.url);
    if (req.user.vaiTro !== "admin" && post.trangThai === "approved") {
      post.trangThai = "pending";
    }
    await post.save();
    res.json({ message: "Sắp xếp ảnh thành công", post });
  } catch (e) {
    console.error("Reorder images error:", e);
    res
      .status(500)
      .json({ message: "Lỗi server khi sắp xếp ảnh", error: e.message });
  }
});
