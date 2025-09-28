const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { uploadImageFromBuffer, deleteImage } = require("../utils/cloudinary");

// GET /api/cloudinary/health - kiểm tra biến môi trường và thử upload nhỏ (tùy chọn)
router.get("/health", async (req, res) => {
  const required = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  const envStatus = required.map((k) => ({
    key: k,
    present: !!process.env[k],
  }));

  // Không tự ý upload nếu thiếu env
  if (envStatus.some((e) => !e.present)) {
    return res.status(200).json({
      message: "Cloudinary chưa đủ biến môi trường",
      envStatus,
      ok: false,
    });
  }

  // Test upload 1x1 pixel (base64) để chắc chắn kết nối OK
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
    "base64"
  );
  try {
    const result = await uploadImageFromBuffer(pixel, {
      folder: "oldmarket/healthcheck",
      transformation: [{ width: 1, height: 1, crop: "limit" }],
    });
    // Xoá ngay để không rác
    deleteImage(result.public_id);
    return res.json({
      message: "Cloudinary OK",
      envStatus,
      ok: true,
      sample: { publicId: result.public_id, url: result.url },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Upload test thất bại",
      error: err.message,
      envStatus,
      ok: false,
    });
  }
});

// POST /api/cloudinary/cleanup - Admin xoá một ảnh bất kỳ theo publicId
router.post("/cleanup", authenticateToken, requireAdmin, async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) {
    return res
      .status(400)
      .json({ message: "Thiếu publicId", code: "PUBLIC_ID_REQUIRED" });
  }
  try {
    await deleteImage(publicId);
    res.json({ message: "Đã gửi yêu cầu xoá", publicId });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xoá ảnh", error: err.message });
  }
});

module.exports = router;
