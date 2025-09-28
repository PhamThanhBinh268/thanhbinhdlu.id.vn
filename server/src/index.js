const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    methods: ["GET", "POST"],
  },
});

// Middleware (Security + CSP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // tạm thời cho inline script (login) – sẽ refactor ra file riêng
          // CDN script sources used in pages
          "https://code.jquery.com",
          "https://cdnjs.cloudflare.com",
          "https://stackpath.bootstrapcdn.com",
          "https://cdn.jsdelivr.net",
        ],
        styleSrc: [
          "'self'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
          "https://stackpath.bootstrapcdn.com",
          "'unsafe-inline'", // inline styles (e.g., profile page quick styles)
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        connectSrc: ["'self'", "ws:", "wss:", "https://res.cloudinary.com"], // allow websocket + cloudinary direct calls if any
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false, // avoid blocking socket.io / mixed content
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  })
);

// ================= Improved Rate Limiting =================
// Vấn đề: Trước đây rate limiter áp dụng cho TẤT CẢ request (kể cả tải CSS/JS/IMG),
// khiến lần đầu load trang (nhiều asset) dễ đạt ngưỡng và gây lỗi 429 trên đăng nhập/đăng ký.
// Giải pháp: Chỉ áp dụng limiter cho các API ghi (POST/PUT/PATCH/DELETE) + auth routes.

const apiWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 500, // đủ lớn cho dev/prod bình thường
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.",
  },
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 50, // tránh spam brute-force
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
  },
});

// Áp dụng limiter riêng cho auth (login/register/password...)
app.use("/api/auth", authLimiter);

// Áp dụng limiter cho các phương thức ghi còn lại (không tính GET static / GET API)
app.use("/api", (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return apiWriteLimiter(req, res, next);
  }
  return next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/oldmarket";

    // Configure mongoose for MongoDB Atlas
    await mongoose.connect(mongoURI);

    console.log("✅ Kết nối MongoDB Atlas thành công");

    // Test connection with ping (optional)
    const client = new MongoClient(mongoURI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("🏓 Ping MongoDB Atlas thành công!");
    await client.close();
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error.message);
    process.exit(1);
  }
};

// Static client serving (trước các route /api/*)
const CLIENT_ROOT = path.join(__dirname, "../../client");
app.use(
  express.static(CLIENT_ROOT, {
    extensions: ["html"],
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
    setHeaders: (res) => {
      res.setHeader("X-Powered-By", "oldmarket");
    },
  })
);

// Root -> index.html (giao diện)
app.get("/", (req, res) => {
  res.sendFile(path.join(CLIENT_ROOT, "index.html"));
});

// /api root info (thay cho JSON ở "/")
app.get("/api", (req, res) => {
  res.json({
    message: "🏪 API Website Trao Đổi & Mua Bán Đồ Cũ",
    version: "1.0.0",
    status: "running",
  });
});

// API routes sẽ được thêm ở đây
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/ratings", require("./routes/ratings"));
app.use("/api/cloudinary", require("./routes/cloudinary"));

// Diagnostics route (không lộ secret)
app.get("/api/diagnostics/status", (req, res) => {
  const upTime = process.uptime();
  res.json({
    message: "Diagnostics info",
    process: {
      pid: process.pid,
      uptime_seconds: Math.round(upTime),
      memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      node: process.version,
    },
    cloudinary: {
      configured:
        !!process.env.CLOUDINARY_CLOUD_NAME && !!process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key_suffix: process.env.CLOUDINARY_API_KEY
        ? process.env.CLOUDINARY_API_KEY.slice(-4)
        : undefined,
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
    },
    time: new Date().toISOString(),
  });
});

// Socket.IO - Chat realtime
require("./socket/chatHandler")(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Có lỗi xảy ra!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "API endpoint không tồn tại" });
});

// ===== Dynamic Port Finder (Tránh lỗi EADDRINUSE) =====
const net = require("net");

async function isPortFree(port) {
  return new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once("error", (err) => {
        if (err.code === "EADDRINUSE") resolve(false);
        else reject(err);
      })
      .once("listening", () => {
        tester
          .once("close", () => {
            resolve(true);
          })
          .close();
      })
      .listen(port, "0.0.0.0");
  });
}

async function findAvailablePort(startPort, maxOffset = 10) {
  for (let offset = 0; offset <= maxOffset; offset++) {
    const candidate = startPort + offset;
    /* eslint-disable no-await-in-loop */
    const free = await isPortFree(candidate);
    if (free) return candidate;
  }
  throw new Error(
    `Không tìm được cổng trống trong khoảng ${startPort}-${
      startPort + maxOffset
    }`
  );
}

let BASE_PORT = parseInt(process.env.PORT, 10) || 8080;

server.on("error", (err) => {
  console.error("[SERVER ERROR EVENT]", err);
});

// ================= Process-Level Error Logging =================
process.on("unhandledRejection", (reason, promise) => {
  console.error("[UNHANDLED_REJECTION]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT_EXCEPTION]", err);
});

process.on("exit", (code) => {
  console.log(`[PROCESS_EXIT] code=${code}`);
});

const startServer = async () => {
  console.log("[DEBUG] startServer invoked");
  // Tìm port trống trước khi kết nối DB để fail nhanh nếu không có cổng
  let PORT_TO_USE;
  try {
    PORT_TO_USE = await findAvailablePort(BASE_PORT, 15);
    if (PORT_TO_USE !== BASE_PORT) {
      console.warn(
        `⚠️  Cổng ${BASE_PORT} đang bận. Tự động chuyển sang cổng ${PORT_TO_USE}`
      );
    }
  } catch (e) {
    console.error("❌ Không thể tìm được cổng khả dụng:", e.message);
    process.exit(1);
  }

  await connectDB();
  console.log("[DEBUG] after connectDB, about to listen");
  try {
    server.listen(PORT_TO_USE, () => {
      console.log(`🚀 Server đang chạy trên port ${PORT_TO_USE}`);
      console.log(`🌍 URL: http://localhost:${PORT_TO_USE}`);
      if (PORT_TO_USE !== BASE_PORT) {
        console.log(
          `ℹ️  Bạn có thể export PORT=${PORT_TO_USE} để cố định (PowerShell: $env:PORT=${PORT_TO_USE})`
        );
      }
    });
  } catch (e) {
    console.error("[DEBUG] listen threw synchronously", e);
  }
};

startServer().catch((err) => {
  console.error("[START SERVER CATCH]", err);
});

// Tạm thời: heartbeat log mỗi 30s để xem server có bị kill âm thầm
setInterval(() => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[HEARTBEAT]", new Date().toISOString());
  }
}, 30000);
