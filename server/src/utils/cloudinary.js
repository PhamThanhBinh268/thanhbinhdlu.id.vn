const cloudinary = require("cloudinary").v2;
const crypto = require("crypto");

// Khởi tạo Cloudinary cấu hình từ biến môi trường
// Yêu cầu trong .env phải có: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// Tuỳ chọn: CLOUDINARY_SECURE=true
function initCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn("[Cloudinary] Thiếu CLOUDINARY_CLOUD_NAME trong .env");
  }
  if (!process.env.CLOUDINARY_API_KEY) {
    console.warn("[Cloudinary] Thiếu CLOUDINARY_API_KEY trong .env");
  }
  if (!process.env.CLOUDINARY_API_SECRET) {
    console.warn("[Cloudinary] Thiếu CLOUDINARY_API_SECRET trong .env");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: process.env.CLOUDINARY_SECURE !== "false", // mặc định true
  });

  if (process.env.DEBUG_CLOUDINARY === "1") {
    console.log(
      "[Cloudinary] Đã khởi tạo config:",
      JSON.stringify(
        {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key_suffix: process.env.CLOUDINARY_API_KEY
            ? process.env.CLOUDINARY_API_KEY.slice(-4)
            : undefined,
          secure: process.env.CLOUDINARY_SECURE !== "false",
        },
        null,
        2
      )
    );
  }
}

let initialized = false;

function ensureInit() {
  if (!initialized) {
    initCloudinary();
    initialized = true;
  }
}

/**
 * Upload một ảnh từ buffer
 * @param {Buffer} buffer - dữ liệu file
 * @param {Object} options - tuỳ chọn upload
 *  - folder (string) thư mục lưu
 *  - transformation (array) các transform
 *  - resource_type (string)
 * @returns {Promise<{url: string, public_id: string}>}
 */
async function uploadImageFromBuffer(buffer, options = {}) {
  ensureInit();
  const traceId = crypto.randomBytes(4).toString("hex");
  const started = Date.now();
  if (process.env.DEBUG_CLOUDINARY === "1") {
    console.log(
      `[Cloudinary][${traceId}] Bắt đầu upload buffer size=${
        buffer?.length
      } folder=${options.folder || "oldmarket/others"}`
    );
  }

  return new Promise((resolve, reject) => {
    let finished = false;
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: options.resource_type || "image",
        folder: options.folder || "oldmarket/others",
        transformation: options.transformation || [{ quality: "auto" }],
      },
      (error, result) => {
        finished = true;
        if (error) {
          console.error(
            `[Cloudinary][${traceId}] Lỗi upload after ${
              Date.now() - started
            }ms: code=${error.http_code || error.name} message=${error.message}`
          );
          return reject(error);
        }
        if (process.env.DEBUG_CLOUDINARY === "1") {
          console.log(
            `[Cloudinary][${traceId}] Thành công after ${
              Date.now() - started
            }ms public_id=${result.public_id}`
          );
        }
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );

    uploadStream.on("error", (streamErr) => {
      if (!finished) {
        console.error(
          `[Cloudinary][${traceId}] stream error: ${streamErr.message}`
        );
        reject(streamErr);
      }
    });

    try {
      uploadStream.end(buffer);
    } catch (e) {
      console.error(`[Cloudinary][${traceId}] exception end():`, e.message);
      reject(e);
    }
  });
}

/**
 * Upload nhiều ảnh (array multer files)
 * @param {Array} files
 * @param {Object} options
 * @returns {Promise<Array<{url:string, public_id:string}>>}
 */
async function uploadMultipleImages(files = [], options = {}) {
  if (process.env.DEBUG_CLOUDINARY === "1") {
    console.log(`[Cloudinary] Upload nhiều ảnh count=${files.length}`);
  }
  const results = [];
  for (const file of files) {
    try {
      if (process.env.DEBUG_CLOUDINARY === "1") {
        console.log(
          `[Cloudinary] -> file name=${file.originalname} size=${file.size} type=${file.mimetype}`
        );
      }
      const r = await uploadImageFromBuffer(file.buffer, options);
      results.push(r);
    } catch (err) {
      console.error("[Cloudinary] Lỗi upload một file:", err.message);
    }
  }
  return results;
}

/**
 * Xoá ảnh khỏi Cloudinary bằng public_id
 * @param {string} publicId
 */
async function deleteImage(publicId) {
  ensureInit();
  if (!publicId) return;
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    if (process.env.DEBUG_CLOUDINARY === "1") {
      console.log(
        `[Cloudinary] Xoá ảnh public_id=${publicId} result=${res?.result}`
      );
    }
  } catch (err) {
    console.error("[Cloudinary] Lỗi xoá ảnh:", publicId, err.message);
  }
}

module.exports = {
  cloudinary,
  uploadImageFromBuffer,
  uploadMultipleImages,
  deleteImage,
};
