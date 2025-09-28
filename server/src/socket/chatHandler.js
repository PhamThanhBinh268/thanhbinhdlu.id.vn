const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");

module.exports = (io) => {
  // Map để lưu user_id -> socket_id
  const onlineUsers = new Map();

  // Middleware xác thực socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user || user.trangThai !== "active") {
        return next(new Error("Invalid user"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.user.hoTen} connected: ${socket.id}`);

    // Lưu user online
    onlineUsers.set(socket.user._id.toString(), socket.id);

    // Emit danh sách user online cho tất cả clients
    io.emit("user_status", {
      userId: socket.user._id,
      status: "online",
      onlineUsers: Array.from(onlineUsers.keys()),
    });

    // Join room cá nhân của user (để nhận tin nhắn)
    socket.join(`user_${socket.user._id}`);

    // Xử lý gửi tin nhắn
    socket.on("send_message", async (data) => {
      try {
        const { receiverId, content, postId } = data;

        // Validate dữ liệu
        if (!receiverId || !content || content.trim().length === 0) {
          socket.emit("error", { message: "Dữ liệu tin nhắn không hợp lệ" });
          return;
        }

        // Kiểm tra người nhận tồn tại
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit("error", { message: "Người nhận không tồn tại" });
          return;
        }

        // Tạo tin nhắn mới
        const message = new Message({
          nguoiGui: socket.user._id,
          nguoiNhan: receiverId,
          noiDung: content.trim(),
          baiDangLienQuan: postId || null,
        });

        await message.save();

        // Populate thông tin người gửi
        await message.populate("nguoiGui", "hoTen avatar");
        await message.populate("baiDangLienQuan", "tieuDe hinhAnh");

        // Gửi cho người nhận (nếu online)
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("new_message", {
            message: message,
            fromUser: {
              _id: socket.user._id,
              hoTen: socket.user.hoTen,
              avatar: socket.user.avatar,
            },
          });
        }

        // Xác nhận cho người gửi
        socket.emit("message_sent", {
          message: message,
          tempId: data.tempId, // Client có thể gửi kèm tempId để track
        });

        console.log(`Message from ${socket.user.hoTen} to ${receiver.hoTen}`);
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", {
          message: "Không thể gửi tin nhắn",
          error: error.message,
        });
      }
    });

    // Xử lý đánh dấu tin nhắn đã đọc
    socket.on("mark_messages_read", async (data) => {
      try {
        const { senderId } = data;

        if (!senderId) {
          socket.emit("error", { message: "Thiếu ID người gửi" });
          return;
        }

        // Cập nhật tất cả tin nhắn chưa đọc từ senderId
        const result = await Message.updateMany(
          {
            nguoiGui: senderId,
            nguoiNhan: socket.user._id,
            trangThai: { $ne: "read" },
          },
          {
            trangThai: "read",
            thoiGianDoc: new Date(),
          }
        );

        // Thông báo cho người gửi biết tin nhắn đã được đọc
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages_read", {
            readerId: socket.user._id,
            readCount: result.modifiedCount,
          });
        }

        socket.emit("marked_read", {
          senderId,
          readCount: result.modifiedCount,
        });

        console.log(
          `${socket.user.hoTen} marked ${result.modifiedCount} messages as read`
        );
      } catch (error) {
        console.error("Mark messages read error:", error);
        socket.emit("error", {
          message: "Không thể đánh dấu tin nhắn đã đọc",
          error: error.message,
        });
      }
    });

    // Xử lý typing indicator
    socket.on("typing_start", (data) => {
      const { receiverId } = data;
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", {
          userId: socket.user._id,
          userName: socket.user.hoTen,
        });
      }
    });

    socket.on("typing_stop", (data) => {
      const { receiverId } = data;
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_stop_typing", {
          userId: socket.user._id,
        });
      }
    });

    // Xử lý khi user disconnect
    socket.on("disconnect", (reason) => {
      console.log(`User ${socket.user.hoTen} disconnected: ${reason}`);

      // Xóa khỏi danh sách online
      onlineUsers.delete(socket.user._id.toString());

      // Thông báo user offline
      io.emit("user_status", {
        userId: socket.user._id,
        status: "offline",
        onlineUsers: Array.from(onlineUsers.keys()),
      });
    });

    // Xử lý lỗi socket
    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.user.hoTen}:`, error);
    });
  });

  // Hàm tiện ích để gửi thông báo cho user cụ thể
  const sendNotificationToUser = (userId, notification) => {
    const userSocketId = onlineUsers.get(userId.toString());
    if (userSocketId) {
      io.to(userSocketId).emit("notification", notification);
    }
  };

  // Export để sử dụng trong các route khác
  io.sendNotificationToUser = sendNotificationToUser;
  io.onlineUsers = onlineUsers;
};
