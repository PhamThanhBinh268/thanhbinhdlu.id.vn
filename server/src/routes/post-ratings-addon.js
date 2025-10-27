// Code để thêm vào cuối file posts.js

// GET /api/posts/:id/ratings - Lấy danh sách đánh giá cho bài đăng
router.get("/:id/ratings", async (req, res) => {
  try {
    const postId = req.params.id;
    
    // Kiểm tra post tồn tại
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

    // Format lại data cho client
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

    // Validate
    if (!diemDanhGia || diemDanhGia < 1 || diemDanhGia > 5) {
      return res.status(400).json({
        message: "Điểm đánh giá phải từ 1 đến 5 sao",
        code: "INVALID_RATING"
      });
    }

    // Kiểm tra post tồn tại
    const post = await Post.findById(postId).populate("nguoiDang");
    if (!post) {
      return res.status(404).json({
        message: "Không tìm thấy bài đăng",
        code: "POST_NOT_FOUND"
      });
    }

    // Không cho phép tự đánh giá bài đăng của mình
    if (post.nguoiDang._id.toString() === userId.toString()) {
      return res.status(400).json({
        message: "Không thể đánh giá bài đăng của chính mình",
        code: "SELF_RATING_NOT_ALLOWED"
      });
    }

    // Khởi tạo mảng danhGia nếu chưa có
    if (!post.danhGia) {
      post.danhGia = [];
    }

    // Kiểm tra đã đánh giá chưa
    const existingReviewIndex = post.danhGia.findIndex(
      r => r.nguoiDanhGia && r.nguoiDanhGia.toString() === userId.toString()
    );

    const User = require("../models/User");
    const user = await User.findById(userId).select("hoTen avatar");

    if (existingReviewIndex !== -1) {
      // Cập nhật đánh giá cũ
      post.danhGia[existingReviewIndex].diemDanhGia = diemDanhGia;
      post.danhGia[existingReviewIndex].binhLuan = binhLuan || "";
      post.danhGia[existingReviewIndex].ngayDanhGia = new Date();
    } else {
      // Thêm đánh giá mới
      post.danhGia.push({
        nguoiDanhGia: userId,
        diemDanhGia: diemDanhGia,
        binhLuan: binhLuan || "",
        ngayDanhGia: new Date()
      });
    }

    await post.save();

    // Cập nhật điểm uy tín người bán
    const seller = await User.findById(post.nguoiDang._id);
    if (seller) {
      await seller.calculateRating();
    }

    // Lấy review vừa tạo/cập nhật
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
