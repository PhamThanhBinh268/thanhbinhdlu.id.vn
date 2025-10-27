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

// GET /api/posts/admin - Danh sách bài đăng cho Admin (mọi trạng thái)
router.get("/admin", authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log("🔧 GET /api/posts/admin - Admin posts request");
    console.log("👤 User:", req.user?.email, "Role:", req.user?.vaiTro);
    console.log("📊 Query params:", req.query);
    
    const {
      page = 1,
      limit = 20,
      search,
      danhMuc,
      nguoiDang,
      trangThai, // pending | approved | rejected | sold | hidden
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    // Tìm kiếm theo từ khóa (bỏ qua nếu là 'undefined' string)
    if (search && search !== 'undefined' && search.trim()) {
      filter.$or = [
        { tieuDe: { $regex: search, $options: "i" } },
        { moTa: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }
    if (danhMuc && danhMuc !== 'undefined') filter.danhMuc = danhMuc;
    if (nguoiDang && nguoiDang !== 'undefined') filter.nguoiDang = nguoiDang;
    if (trangThai && trangThai !== 'undefined') filter.trangThai = trangThai;

    console.log("🎯 Final filter:", filter);

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [items, total] = await Promise.all([
      Post.find(filter)
        .populate("danhMuc", "tenDanhMuc icon")
        .populate("nguoiDang", "hoTen email avatar")
        .sort(sort)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Post.countDocuments(filter),
    ]);

    res.json({
      message: "Lấy danh sách bài đăng (admin) thành công",
      data: items,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Admin get posts error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách bài đăng (admin)",
      error: error.message,
    });
  }
});

// GET /api/posts/search - Search bài đăng (alias cho GET /)
router.get("/search", optionalAuth, async (req, res) => {
  try {
    console.log("🔍 GET /api/posts/search - Search request");
    console.log("📊 Query params:", req.query);

    const {
      page = 1,
      limit = 12,
      search,
      category,
      danhMuc,
      minPrice,
      maxPrice,
      loaiGia,
      tinhTrang,
      condition,
      diaDiem,
      location,
      nguoiDang,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Xây dựng query filter
    const filter = { trangThai: "approved" };
    console.log("🎯 Base filter:", filter);

    // Lọc theo người đăng
    if (nguoiDang) {
      filter.nguoiDang = nguoiDang;
      console.log("👤 Added user filter:", nguoiDang);
    }

    // Tìm kiếm theo từ khóa
    if (search) {
      filter.$or = [
        { tieuDe: { $regex: search, $options: "i" } },
        { moTa: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
      console.log("🔎 Added search filter for:", search);
    }

    // Lọc theo danh mục (hỗ trợ cả 'category' và 'danhMuc')
    const categoryId = category || danhMuc;
    if (categoryId) {
      filter.danhMuc = categoryId;
      console.log("📂 Added category filter:", categoryId);
    }

    // Lọc theo giá
    if (minPrice || maxPrice) {
      filter.gia = {};
      if (minPrice) filter.gia.$gte = parseInt(minPrice);
      if (maxPrice) filter.gia.$lte = parseInt(maxPrice);
      console.log("💰 Added price filter:", filter.gia);
    }

    // Lọc theo loại giá
    if (loaiGia) {
      filter.loaiGia = loaiGia;
      console.log("🏷️ Added price type filter:", loaiGia);
    }

    // Lọc theo tình trạng (hỗ trợ cả 'condition' và 'tinhTrang')
    const conditionValue = condition || tinhTrang;
    if (conditionValue) {
      filter.tinhTrang = conditionValue;
      console.log("⚙️ Added condition filter:", conditionValue);
    }

    // Lọc theo địa điểm (hỗ trợ cả 'location' và 'diaDiem')
    const locationValue = location || diaDiem;
    if (locationValue) {
      filter.diaDiem = { $regex: locationValue, $options: "i" };
      console.log("📍 Added location filter:", locationValue);
    }

    console.log("🎯 Final filter:", filter);

    // Xây dựng sort object (Strategy pattern dạng map)
    const sortStrategies = {
      newest: () => ({ createdAt: -1 }),
      oldest: () => ({ createdAt: 1 }),
      price_low: () => ({ gia: 1 }),
      price_high: () => ({ gia: -1 }),
      default: () => ({ [sortBy]: sortOrder === "asc" ? 1 : -1 }),
    };
    const resolveSort = sortStrategies[sortBy] || sortStrategies.default;
    const sortObj = resolveSort();
    console.log("📊 Sort order:", sortObj);

    const posts = await Post.find(filter)
      .populate("danhMuc", "tenDanhMuc icon")
      .populate("nguoiDang", "hoTen avatar diemUyTin")
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    console.log(`✅ Found ${posts.length} posts (${total} total)`);

    res.json({
      message: "Tìm kiếm bài đăng thành công",
      data: {
        posts,
        totalPages,
        currentPage: parseInt(page),
        totalPosts: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("❌ Search posts error:", error);
    res.status(500).json({
      message: "Lỗi server khi tìm kiếm bài đăng",
      error: error.message,
    });
  }
});

// GET /api/posts/featured - Top sản phẩm nổi bật theo số và điểm đánh giá
router.get("/featured", optionalAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Chỉ lấy bài đăng đã duyệt, loại giá là 'ban' (không lấy trao đổi/cho miễn phí)
    const match = { trangThai: "approved", loaiGia: "ban" };

    const pipeline = [
      { $match: match },
      {
        $addFields: {
          ratingCount: { $size: { $ifNull: ["$danhGia", []] } },
          avgRating: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$danhGia", []] } }, 0] },
              { $avg: "$danhGia.diemDanhGia" },
              0,
            ],
          },
          // Ưu tiên bài được admin đánh dấu nổi bật
          isNoiBat: { $ifNull: ["$tinhNangDichVu.noiBat", false] }
        },
      },
      {
        $sort: {
          isNoiBat: -1,        // Ưu tiên bài nổi bật lên đầu
          ratingCount: -1,
          avgRating: -1,
          createdAt: -1,
        },
      },
      { $limit: Number(limit) },
    ];

    let items = await Post.aggregate(pipeline);
    // Populate references after aggregation
    items = await Post.populate(items, [
      { path: "danhMuc", select: "tenDanhMuc icon" },
      { path: "nguoiDang", select: "hoTen avatar diemUyTin" },
    ]);

    res.json({
      message: "Lấy sản phẩm nổi bật thành công",
      data: { posts: items, total: items.length, limit: Number(limit) },
    });
  } catch (error) {
    console.error("Get featured posts error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy sản phẩm nổi bật",
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
      console.log("🚀 POST /api/posts - Received request");
      console.log("📝 Request body:", req.body);
      console.log("📁 Files:", req.files?.length || 0);
      console.log("👤 User:", req.user?.id);

      const { tieuDe, moTa, gia, danhMuc, diaDiem, loaiGia, tinhTrang, tags } =
        req.body;

      // Kiểm tra danh mục tồn tại  
      console.log("🔍 Checking category:", danhMuc);
      const category = await Category.findById(danhMuc);
      if (!category) {
        console.log("❌ Category not found:", danhMuc);
        return res.status(400).json({
          message: "Danh mục không tồn tại",
          code: "CATEGORY_NOT_FOUND",
        });
      }
      console.log("✅ Category found:", category.tenDanhMuc);

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
      console.log("📝 Creating post with data:");
      const postData = {
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
        // Mặc định chờ duyệt; nếu người tạo là admin thì tự duyệt
        trangThai: req.user?.vaiTro === "admin" ? "approved" : "pending",
        tags: tags
          ? tags.split(",").map((tag) => tag.trim().toLowerCase())
          : [],
      };
      console.log("📊 Post data:", postData);

      const post = new Post(postData);
      console.log("💾 Saving post to MongoDB...");
      await post.save();
      console.log("✅ Post saved successfully with ID:", post._id);

      // Populate để trả về đầy đủ thông tin
      await post.populate("danhMuc", "tenDanhMuc icon");
      await post.populate("nguoiDang", "hoTen avatar");

      res.status(201).json({
        message:
          post.trangThai === "approved"
            ? "Tạo bài đăng thành công và đã được duyệt!"
            : "Tạo bài đăng thành công, đang chờ duyệt",
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
      // Cho phép admin cập nhật trạng thái, lý do từ chối và tags (để cấu hình discount/highlight)
      allowedFields.push("trangThai", "lyDoTuChoi", "tags");
      
      // Admin có thể cập nhật tinhNangDichVu.noiBat (đánh dấu nổi bật)
      if (req.body['tinhNangDichVu.noiBat'] !== undefined) {
        updateData['tinhNangDichVu.noiBat'] = req.body['tinhNangDichVu.noiBat'];
      }
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

    // Phát sự kiện realtime khi admin cập nhật tags, trạng thái hoặc nổi bật
    try {
      const io = req.app && req.app.get && req.app.get('io');
      if (io && (updateData.tags || updateData.trangThai || updateData.gia || updateData.tieuDe || updateData['tinhNangDichVu.noiBat'] !== undefined)) {
        io.emit('post_updated', {
          id: String(postId),
          tags: updatedPost?.tags || [],
          trangThai: updatedPost?.trangThai,
          gia: updatedPost?.gia,
          tieuDe: updatedPost?.tieuDe,
          noiBat: updatedPost?.tinhNangDichVu?.noiBat || false
        });
        console.log('🔔 Socket event emitted: post_updated', { 
          id: String(postId), 
          noiBat: updatedPost?.tinhNangDichVu?.noiBat 
        });
      }
    } catch (_) { /* noop */ }

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

// GET /api/posts/mine - Bài đăng của tôi (mọi trạng thái)
router.get("/mine", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 12, trangThai } = req.query;
    const filter = { nguoiDang: req.user._id };
    if (trangThai) filter.trangThai = trangThai;

    const [items, total] = await Promise.all([
      Post.find(filter)
        .populate("danhMuc", "tenDanhMuc icon")
        .populate("nguoiDang", "hoTen avatar diemUyTin")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
      Post.countDocuments(filter),
    ]);

    res.json({
      message: "Lấy bài đăng của tôi thành công",
      data: items,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
        limit: Number(limit),
      },
    });
  } catch (e) {
    console.error("Get my posts error:", e);
    res.status(500).json({ message: "Lỗi server khi lấy bài đăng của tôi", error: e.message });
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

// ==================== RATING/REVIEW ENDPOINTS ====================

// GET /api/posts/:id/ratings - Lấy danh sách đánh giá cho bài đăng
router.get("/:id/ratings", async (req, res) => {
  try {
    const postId = req.params.id;
    
    const post = await Post.findById(postId).populate({
      path: "danhGia.nguoiDanhGia",
      select: "hoTen avatar"
    });
    
    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài đăng",
        code: "POST_NOT_FOUND"
      });
    }

    const formattedRatings = (post.danhGia || []).map(rating => ({
      _id: rating._id,
      nguoiDanhGia: rating.nguoiDanhGia,
      diemDanhGia: rating.diemDanhGia,
      binhLuan: rating.binhLuan,
      ngayDanhGia: rating.ngayDanhGia
    }));

    res.json({
      message: "Lấy danh sách đánh giá thành công",
      data: formattedRatings
    });
    
  } catch (error) {
    console.error("Get post ratings error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy đánh giá",
      error: error.message
    });
  }
});

// POST /api/posts/:id/ratings - Tạo đánh giá cho sản phẩm
router.post("/:id/ratings", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const { diemDanhGia, binhLuan } = req.body;
    const userId = req.user._id;

    if (!diemDanhGia || diemDanhGia < 1 || diemDanhGia > 5) {
      return res.status(400).json({
        message: "Điểm đánh giá phải từ 1 đến 5 sao",
        code: "INVALID_RATING"
      });
    }

    const post = await Post.findById(postId).populate("nguoiDang");
    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài đăng",
        code: "POST_NOT_FOUND"
      });
    }

    // Kiểm tra post có người đăng không
    if (!post.nguoiDang) {
      return res.status(400).json({
        message: "Bài đăng này không hợp lệ (không có người đăng)",
        code: "INVALID_POST"
      });
    }

    if (post.nguoiDang._id.toString() === userId.toString()) {
      return res.status(400).json({
        message: "Không thể đánh giá bài đăng của chính mình",
        code: "SELF_RATING_NOT_ALLOWED"
      });
    }

    if (!post.danhGia) {
      post.danhGia = [];
    }

    const existingReviewIndex = post.danhGia.findIndex(
      r => r.nguoiDanhGia && r.nguoiDanhGia.toString() === userId.toString()
    );

    const User = require("../models/User");
    const user = await User.findById(userId).select("hoTen avatar");

    if (existingReviewIndex !== -1) {
      post.danhGia[existingReviewIndex].diemDanhGia = diemDanhGia;
      post.danhGia[existingReviewIndex].binhLuan = binhLuan || "";
      post.danhGia[existingReviewIndex].ngayDanhGia = new Date();
    } else {
      post.danhGia.push({
        nguoiDanhGia: userId,
        diemDanhGia: diemDanhGia,
        binhLuan: binhLuan || "",
        ngayDanhGia: new Date()
      });
    }

    await post.save();

    // Cập nhật điểm uy tín người bán (nếu có)
    if (post.nguoiDang && post.nguoiDang._id) {
      const seller = await User.findById(post.nguoiDang._id);
      if (seller) {
        await seller.calculateRating();
      }
    }

    const reviewIndex = existingReviewIndex !== -1 ? existingReviewIndex : post.danhGia.length - 1;
    const review = post.danhGia[reviewIndex];

    res.status(201).json({
      message: "Đánh giá thành công",
      data: {
        _id: review._id,
        nguoiDanhGia: user,
        diemDanhGia: review.diemDanhGia,
        binhLuan: review.binhLuan,
        ngayDanhGia: review.ngayDanhGia
      }
    });

  } catch (error) {
    console.error("Create post rating error:", error);
    res.status(500).json({
      message: "Lỗi server khi tạo đánh giá",
      error: error.message
    });
  }
});

module.exports = router;

