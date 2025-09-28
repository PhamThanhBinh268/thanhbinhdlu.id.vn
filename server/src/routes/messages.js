const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");
const { validation, handleValidation } = require("../middleware/validation");

const router = express.Router();

// GET /api/messages/conversations - Lấy danh sách cuộc trò chuyện
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Aggregate để lấy tin nhắn cuối cùng của mỗi cuộc trò chuyện
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ nguoiGui: userId }, { nguoiNhan: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$nguoiGui", userId] }, "$nguoiNhan", "$nguoiGui"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$nguoiNhan", userId] },
                    { $ne: ["$trangThai", "read"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "otherUser",
        },
      },
      {
        $unwind: "$otherUser",
      },
      {
        $lookup: {
          from: "users",
          localField: "lastMessage.nguoiGui",
          foreignField: "_id",
          as: "lastMessage.nguoiGuiInfo",
        },
      },
      {
        $unwind: "$lastMessage.nguoiGuiInfo",
      },
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
      {
        $project: {
          otherUser: {
            _id: 1,
            hoTen: 1,
            avatar: 1,
            diemUyTin: 1,
          },
          lastMessage: {
            _id: 1,
            noiDung: 1,
            createdAt: 1,
            trangThai: 1,
            nguoiGuiInfo: {
              _id: 1,
              hoTen: 1,
            },
          },
          unreadCount: 1,
        },
      },
    ]);

    res.json({
      message: "Lấy danh sách cuộc trò chuyện thành công",
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách cuộc trò chuyện",
      error: error.message,
    });
  }
});

// GET /api/messages/:otherUserId - Lấy tin nhắn với user khác
router.get("/:otherUserId", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const userId = req.user._id;
    const otherUserId = req.params.otherUserId;

    // Kiểm tra user khác tồn tại
    const otherUser = await User.findById(
      otherUserId,
      "hoTen avatar diemUyTin"
    );
    if (!otherUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
        code: "USER_NOT_FOUND",
      });
    }

    // Lấy tin nhắn giữa 2 user
    const messages = await Message.find({
      $or: [
        { nguoiGui: userId, nguoiNhan: otherUserId },
        { nguoiGui: otherUserId, nguoiNhan: userId },
      ],
    })
      .populate("nguoiGui", "hoTen avatar")
      .populate("baiDangLienQuan", "tieuDe hinhAnh gia")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Đánh dấu đã đọc các tin nhắn từ otherUser
    await Message.updateMany(
      {
        nguoiGui: otherUserId,
        nguoiNhan: userId,
        trangThai: { $ne: "read" },
      },
      {
        trangThai: "read",
        thoiGianDoc: new Date(),
      }
    );

    const total = await Message.countDocuments({
      $or: [
        { nguoiGui: userId, nguoiNhan: otherUserId },
        { nguoiGui: otherUserId, nguoiNhan: userId },
      ],
    });

    res.json({
      message: "Lấy tin nhắn thành công",
      messages: messages.reverse(), // Đảo lại để tin nhắn cũ nhất ở đầu
      otherUser,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy tin nhắn",
      error: error.message,
    });
  }
});

// POST /api/messages/send - Gửi tin nhắn (backup cho socket)
router.post(
  "/send",
  authenticateToken,
  validation.sendMessage,
  handleValidation,
  async (req, res) => {
    try {
      const { nguoiNhan, noiDung, baiDangLienQuan } = req.body;

      // Kiểm tra người nhận tồn tại
      const receiver = await User.findById(nguoiNhan);
      if (!receiver) {
        return res.status(404).json({
          message: "Không tìm thấy người nhận",
          code: "RECEIVER_NOT_FOUND",
        });
      }

      // Tạo tin nhắn
      const message = new Message({
        nguoiGui: req.user._id,
        nguoiNhan,
        noiDung: noiDung.trim(),
        baiDangLienQuan,
      });

      await message.save();

      // Populate thông tin
      await message.populate("nguoiGui", "hoTen avatar");
      await message.populate("baiDangLienQuan", "tieuDe hinhAnh");

      res.status(201).json({
        message: "Gửi tin nhắn thành công",
        data: message,
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({
        message: "Lỗi server khi gửi tin nhắn",
        error: error.message,
      });
    }
  }
);

// GET /api/messages/unread/count - Đếm số tin nhắn chưa đọc
router.get("/unread/count", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Message.countDocuments({
      nguoiNhan: userId,
      trangThai: { $ne: "read" },
    });

    res.json({
      message: "Lấy số tin nhắn chưa đọc thành công",
      unreadCount,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      message: "Lỗi server khi đếm tin nhắn chưa đọc",
      error: error.message,
    });
  }
});

// PATCH /api/messages/mark-read/:otherUserId - Đánh dấu đã đọc tin nhắn
router.patch("/mark-read/:otherUserId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.otherUserId;

    const result = await Message.updateMany(
      {
        nguoiGui: otherUserId,
        nguoiNhan: userId,
        trangThai: { $ne: "read" },
      },
      {
        trangThai: "read",
        thoiGianDoc: new Date(),
      }
    );

    res.json({
      message: "Đánh dấu tin nhắn đã đọc thành công",
      readCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark messages read error:", error);
    res.status(500).json({
      message: "Lỗi server khi đánh dấu tin nhắn đã đọc",
      error: error.message,
    });
  }
});

// DELETE /api/messages/:messageId - Xóa tin nhắn
router.delete("/:messageId", authenticateToken, async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        message: "Không tìm thấy tin nhắn",
        code: "MESSAGE_NOT_FOUND",
      });
    }

    // Chỉ người gửi mới có thể xóa tin nhắn
    if (message.nguoiGui.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền xóa tin nhắn này",
        code: "FORBIDDEN",
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({
      message: "Xóa tin nhắn thành công",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      message: "Lỗi server khi xóa tin nhắn",
      error: error.message,
    });
  }
});

module.exports = router;
