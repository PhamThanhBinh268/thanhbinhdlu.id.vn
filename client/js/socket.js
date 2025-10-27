// =============================================================================
// Socket.IO Client Setup - Real-time Chat Functionality
// =============================================================================

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentConversation = null;
    this.messageCallbacks = [];
    this.typingCallbacks = [];
    this.sentCallbacks = [];
  }

  // Kết nối Socket.IO
  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const token = AuthManager.getToken();
    if (!token) {
      return null;
    }

    try {
      const origin = (window.location && window.location.origin) || 'http://localhost:8080';
      this.socket = io(origin, {
        auth: {
          token: token,
        },
      });

      this.setupEventListeners();
      return this.socket;
    } catch (error) {
      console.error("Socket connection failed:", error);
      return null;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    // Server emits snake_case events
    // Cập nhật bài đăng (ví dụ: admin chỉnh sửa tags giảm giá/nổi bật)
    this.socket.on('post_updated', (payload) => {
      try {
        // Phát tiếp một CustomEvent để các trang như shop/index có thể tự refresh
        window.dispatchEvent(new CustomEvent('post:updated', { detail: payload }));
      } catch (e) {
      }
    });

    this.socket.on("new_message", (payload) => {
      // payload: { message, fromUser }
      const msg = payload?.message || payload;
      try { } catch(_) {}
      this.handleNewMessage(msg);
    });

    // When server confirms message saved for sender: forward to sent callbacks (UI layer will dedupe).
    this.socket.on("message_sent", (payload) => {
      const msg = payload?.message || payload;
      try { } catch(_) {}
      this.sentCallbacks.forEach(cb => { try { cb(msg, payload?.tempId); } catch(_) {} });
    });

    this.socket.on("user_status", (data) => {
      const { userId, status } = data || {};
      if (userId) this.updateUserStatus(userId, status === 'online');
    });

    this.socket.on('user_typing', (data) => {
      this.typingCallbacks.forEach(cb => {
        try { cb({ userId: data?.userId, typing: true, userName: data?.userName }); } catch(_) {}
      });
    });
    this.socket.on('user_stop_typing', (data) => {
      this.typingCallbacks.forEach(cb => {
        try { cb({ userId: data?.userId, typing: false }); } catch(_) {}
      });
    });
  }

  // Xử lý tin nhắn mới
  handleNewMessage(message) {

    // Gọi tất cả callbacks đã đăng ký
    this.messageCallbacks.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error("Error in message callback:", error);
      }
    });

    // Do not render here; page-level code (messages.js) will handle DOM updates via registered callbacks

    // Hiển thị notification nếu không phải tin nhắn từ user hiện tại
    const currentUser = AuthManager.getUser();
    if (currentUser && message.nguoiGui._id !== currentUser._id) {
      this.showMessageNotification(message);
    }
  }

  // Đăng ký callback cho tin nhắn mới
  onMessage(callback) {
    this.messageCallbacks.push(callback);
  }

  // Hủy đăng ký callback
  offMessage(callback) {
    this.messageCallbacks = this.messageCallbacks.filter(
      (cb) => cb !== callback
    );
  }

  // Đăng ký callback cho trạng thái đang nhập
  onTypingStatus(callback) {
    this.typingCallbacks.push(callback);
  }
  offTypingStatus(callback) {
    this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
  }

  // Đăng ký callback cho sự kiện message_sent (tin đã lưu thành công)
  onMessageSent(callback) {
    this.sentCallbacks.push(callback);
  }
  offMessageSent(callback) {
    this.sentCallbacks = this.sentCallbacks.filter(cb => cb !== callback);
  }

  // Gửi tin nhắn
  sendMessage(receiverId, content, type = "text", postId = null) {
    if (!this.socket || !this.isConnected) {
      throw new Error("Socket not connected");
    }

    const messageData = {
      receiverId,
      content,
      type,
      postId,
      tempId: Math.random().toString(36).slice(2)
    };

    return new Promise((resolve, reject) => {
      this.socket.emit("send_message", messageData);
      // Optimistic resolve; server also echoes message via new_message
      resolve();
    });
  }

  // Join conversation room
  joinConversation(userId) {
    if (!this.socket || !this.isConnected) return;

    // Leave previous room (if any)
    if (this.currentConversation) {
      this.socket.emit("leaveConversation", this.currentConversation);
    }
    this.currentConversation = userId;
    // Use per-user room as server does (user_<id>) for delivery alignment
    this.socket.emit("joinConversation", userId);
  }

  // Leave conversation room
  leaveConversation() {
    if (!this.socket || !this.isConnected) return;

    if (this.currentConversation) {
      this.socket.emit("leaveConversation", this.currentConversation);
      this.currentConversation = null;
    }
  }

  // Cập nhật trạng thái online/offline của user
  updateUserStatus(userId, isOnline) {
    // Update any element that has exact id or data-user-id reference
    const statusElements = [
      ...document.querySelectorAll(`[data-user-id="${userId}"] .user-status`),
      ...document.querySelectorAll(`#currentUserStatus[data-user-id="${userId}"]`)
    ];
    statusElements.forEach((element) => {
      element.classList.toggle("online", isOnline);
      element.classList.toggle("offline", !isOnline);
    });
  }

  // Hiển thị tin nhắn trong UI
  displayMessage(message) {
    const chatContainer = document.querySelector(".chat-messages");
    if (!chatContainer) return;

    const messageElement = this.createMessageElement(message);
    chatContainer.appendChild(messageElement);

    // Scroll xuống cuối
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Tạo element cho tin nhắn
  createMessageElement(message) {
    const currentUser = AuthManager.getUser();
    const isOwnMessage =
      currentUser && message.nguoiGui._id === currentUser._id;

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${
      isOwnMessage ? "own-message" : "other-message"
    }`;

    messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <strong>${message.nguoiGui.hoTen}</strong>
                    <small class="text-muted">${Utils.formatDateTime(
                      message.thoiGianGui
                    )}</small>
                </div>
                <div class="message-body">
                    ${this.formatMessageContent(message)}
                </div>
            </div>
        `;

    return messageDiv;
  }

  // Format nội dung tin nhắn
  formatMessageContent(message) {
    switch (message.loaiTinNhan) {
      case "text":
        return `<p>${message.noiDung}</p>`;
      case "image":
        return `<img src="${message.noiDung}" alt="Image" class="message-image">`;
      case "offer":
        const offer = JSON.parse(message.noiDung);
        return `
                    <div class="offer-message">
                        <i class="fas fa-handshake text-primary"></i>
                        <strong>Đề xuất giá:</strong> ${Utils.formatCurrency(
                          offer.price
                        )}
                        <small class="d-block text-muted">Cho bài đăng: ${
                          offer.postTitle
                        }</small>
                    </div>
                `;
      default:
        return `<p>${message.noiDung}</p>`;
    }
  }

  // Hiển thị notification cho tin nhắn mới
  showMessageNotification(message) {
    // Chỉ hiển thị notification nếu không đang ở trang chat
    if (window.location.pathname.includes("messages.html")) return;

    Utils.showToast(
      `<strong>Tin nhắn mới từ ${
        message.nguoiGui.hoTen
      }:</strong><br>${Utils.truncateText(message.noiDung, 50)}`,
      "info"
    );

    // Cập nhật badge số lượng tin nhắn chưa đọc
    this.updateUnreadMessagesBadge();
  }

  // Cập nhật badge tin nhắn chưa đọc
  async updateUnreadMessagesBadge() {
    try {
      const response = await ApiService.get("/messages/unread/count");
      const count = response.unreadCount ?? response.data?.unreadCount ?? 0;

      const badge = document.querySelector(".messages-badge");
      if (badge) {
        if (count > 0) {
          badge.textContent = count > 99 ? "99+" : count;
          badge.style.display = "inline";
        } else {
          badge.style.display = "none";
        }
      }
    } catch (error) {
      console.error("Error updating unread messages badge:", error);
    }
  }

  // Ngắt kết nối
  disconnect() {
    if (this.socket) {
      this.leaveConversation();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.messageCallbacks = [];
    }
  }
}

// =============================================================================
// Chat UI Helper Functions
// =============================================================================
class ChatUI {
  constructor(socketManager) {
    this.socket = socketManager;
    this.currentChatUserId = null;
    this.setupChatUI();
  }

  setupChatUI() {
    // Setup tin nhắn form submit
    const messageForm = document.querySelector("#message-form");
    if (messageForm) {
      messageForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSendMessage();
      });
    }

    // Setup file upload cho tin nhắn
    const fileInput = document.querySelector("#message-file");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        this.handleFileUpload(e);
      });
    }

    // Setup offer message
    const offerButton = document.querySelector("#send-offer-btn");
    if (offerButton) {
      offerButton.addEventListener("click", () => {
        this.showOfferDialog();
      });
    }
  }

  // Xử lý gửi tin nhắn text
  async handleSendMessage() {
    const messageInput = document.querySelector("#message-input");
    const content = messageInput.value.trim();

    if (!content || !this.currentChatUserId) return;

    try {
      const sendButton = document.querySelector("#send-message-btn");
      Utils.showLoading(sendButton);

      await this.socket.sendMessage(this.currentChatUserId, content, "text");
      messageInput.value = "";
    } catch (error) {
      Utils.showToast("Không thể gửi tin nhắn: " + error.message, "error");
    } finally {
      const sendButton = document.querySelector("#send-message-btn");
      Utils.hideLoading(sendButton);
    }
  }

  // Xử lý upload file
  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file || !this.currentChatUserId) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      Utils.showToast("Đang tải file...", "info");

      const response = await ApiService.uploadFile("/upload", formData);
      await this.socket.sendMessage(
        this.currentChatUserId,
        response.data.url,
        "image"
      );
    } catch (error) {
      Utils.showToast("Không thể gửi file: " + error.message, "error");
    }
  }

  // Hiển thị dialog đề xuất giá
  showOfferDialog() {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Đề xuất giá</h5>
                        <button type="button" class="close" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Giá đề xuất (VNĐ):</label>
                            <input type="number" class="form-control" id="offer-price" min="0">
                        </div>
                        <div class="form-group">
                            <label>Ghi chú:</label>
                            <textarea class="form-control" id="offer-note" rows="3" placeholder="Thêm ghi chú cho đề xuất..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Hủy</button>
                        <button type="button" class="btn btn-primary" onclick="this.sendOffer()">Gửi đề xuất</button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    $(modal).modal("show");

    // Cleanup when modal is hidden
    $(modal).on("hidden.bs.modal", function () {
      modal.remove();
    });
  }

  // Gửi đề xuất giá
  async sendOffer() {
    const price = document.querySelector("#offer-price").value;
    const note = document.querySelector("#offer-note").value;

    if (!price || price <= 0) {
      Utils.showToast("Vui lòng nhập giá hợp lệ", "error");
      return;
    }

    try {
      const offerData = {
        price: parseFloat(price),
        note: note,
        postTitle: "Sản phẩm", // Có thể lấy từ context
      };

      await this.socket.sendMessage(
        this.currentChatUserId,
        JSON.stringify(offerData),
        "offer"
      );

      $(".modal").modal("hide");
      Utils.showToast("Đã gửi đề xuất giá thành công", "success");
    } catch (error) {
      Utils.showToast("Không thể gửi đề xuất: " + error.message, "error");
    }
  }

  // Bắt đầu chat với user
  startChat(userId) {
    this.currentChatUserId = userId;
    this.socket.joinConversation(userId);
    this.loadChatHistory(userId);
  }

  // Tải lịch sử chat
  async loadChatHistory(userId) {
    try {
      const response = await ApiService.get(`/messages/conversation/${userId}`);
      const messages = response.data;

      const chatContainer = document.querySelector(".chat-messages");
      if (chatContainer) {
        chatContainer.innerHTML = "";
        messages.forEach((message) => {
          this.socket.displayMessage(message);
        });
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }
}

// =============================================================================
// Global Socket Instance
// =============================================================================
let socketManager = null;
let chatUI = null;

// Initialize socket when user is logged in
document.addEventListener("DOMContentLoaded", function () {
  if (AuthManager.isLoggedIn()) {
    socketManager = new SocketManager();
    socketManager.connect();

    // Setup chat UI if on messages page
    if (window.location.pathname.includes("messages.html")) {
      chatUI = new ChatUI(socketManager);
    }
  }
});

// Cleanup on page unload
window.addEventListener("beforeunload", function () {
  if (socketManager) {
    socketManager.disconnect();
  }
});

// Export for global use
window.SocketManager = SocketManager;
window.ChatUI = ChatUI;
