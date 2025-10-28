// =============================================================================
// Messages Page - Quản lý tin nhắn và chat real-time
// =============================================================================

document.addEventListener("DOMContentLoaded", function () {
  // Kiểm tra đăng nhập
  if (!AuthManager.isLoggedIn()) {
    Utils.showToast(
      "Vui lòng đăng nhập để sử dụng tính năng tin nhắn",
      "warning"
    );
    window.location.href = "login.html";
    return;
  }

  initializeMessagesPage();
});

let currentConversationId = null;
let currentChatUser = null;
let conversations = [];
const renderedMessageIds = new Set();

async function initializeMessagesPage() {
  // Setup Socket.IO connection
  setupSocketConnection();

  // Setup event listeners
  setupEventListeners();

  // Load conversations
  await loadConversations();

  // Check if user specified in URL
  const targetUserId = Utils.getQueryParam("user");
  if (targetUserId) {
    localStorage.setItem('messages:lastUserId', targetUserId);
    await startOrFindConversation(targetUserId);
  } else {
    // fallback: open last user if exists
    const lastUserId = localStorage.getItem('messages:lastUserId');
    if (lastUserId) {
      await startOrFindConversation(lastUserId);
    }
  }
}

function setupSocketConnection() {
  // Reuse global socket if available to avoid duplicate connections
  if (window.socketManager) {
    socketManager = window.socketManager;
    if (!socketManager.isConnected) socketManager.connect();
  } else {
    socketManager = new SocketManager();
    socketManager.connect();
    window.socketManager = socketManager;
  }

  // Initialize or reuse Chat UI
  if (window.chatUI) {
    chatUI = window.chatUI;
  } else {
    chatUI = new ChatUI(socketManager);
    window.chatUI = chatUI;
  }

  // Always (re)bind a fresh messages-page handler to avoid stale closures
  if (window._messagesOnMessageHandler) {
    try { socketManager.offMessage(window._messagesOnMessageHandler); } catch(_) {}
  }
  window._messagesOnMessageHandler = (message) => {
    handleNewMessage(message);
    // Refresh conversation list to update last message and unread badge
    loadConversations();
  };
  socketManager.onMessage(window._messagesOnMessageHandler);

  // Also listen for 'message_sent' to optimistically render own message
  if (window._messagesOnSentHandler) {
    try { socketManager.offMessageSent(window._messagesOnSentHandler); } catch(_) {}
  }
  window._messagesOnSentHandler = (message) => {
    const currentUser = AuthManager.getUser();
    const senderId = typeof message.nguoiGui === 'string' ? message.nguoiGui : message.nguoiGui?._id;
    if (!currentChatUser || senderId !== currentUser._id) return;
    // Forward to same flow; de-dup will block duplicates if new_message arrives
    handleNewMessage(message);
  };
  socketManager.onMessageSent(window._messagesOnSentHandler);
}

function setupEventListeners() {
  // Message form
  const messageForm = document.getElementById("messageForm");
  if (messageForm) {
    messageForm.addEventListener("submit", handleSendMessage);
  }

  // File upload
  const fileUploadBtn = document.getElementById("fileUploadBtn");
  const fileInput = document.getElementById("messageFile");

  if (fileUploadBtn && fileInput) {
    fileUploadBtn.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", handleFileUpload);
  }

  // Send offer button
  const sendOfferBtn = document.getElementById("sendOfferBtn");
  if (sendOfferBtn) {
    sendOfferBtn.addEventListener("click", handleSendOffer);
  }

  // Toggle sidebar on mobile
  const toggleSidebar = document.getElementById("toggleSidebar");
  if (toggleSidebar) {
    toggleSidebar.addEventListener("click", () => {
      const sidebar = document.querySelector(".chat-sidebar");
      sidebar.classList.toggle("show");
    });
  }

  // Auto-resize message input
  const messageInput = document.getElementById("messageInput");
  if (messageInput) {
    let typingTimer;
    const TYPING_DEBOUNCE = 1200;
    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const form = document.getElementById('messageForm');
        form && form.dispatchEvent(new Event('submit'));
      }
      // Emit typing start
      if (socketManager && currentChatUser) {
        try { socketManager.socket.emit('typing_start', { receiverId: currentChatUser._id }); } catch(_) {}
      }
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        if (socketManager && currentChatUser) {
          try { socketManager.socket.emit('typing_stop', { receiverId: currentChatUser._id }); } catch(_) {}
        }
      }, TYPING_DEBOUNCE);
    });
  }
}

async function loadConversations() {
  try {
  const response = await ApiService.get("/messages/conversations");
  conversations = response.conversations || response.data || [];

    displayConversations(conversations);
  } catch (error) {
    console.error("Error loading conversations:", error);
    Utils.showToast("Không thể tải danh sách cuộc trò chuyện", "error");

    // Show empty state
    const conversationsList = document.getElementById("conversationsList");
    if (conversationsList) {
      conversationsList.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-comment-slash fa-3x text-muted mb-3"></i>
                    <h6 class="text-muted">Chưa có cuộc trò chuyện nào</h6>
                    <p class="text-muted small">Bắt đầu trò chuyện bằng cách liên hệ với người bán từ trang sản phẩm</p>
                </div>
            `;
    }
  }
}

function displayConversations(conversations) {
  const conversationsList = document.getElementById("conversationsList");
  if (!conversationsList) return;

  if (conversations.length === 0) {
    conversationsList.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-comment-slash fa-3x text-muted mb-3"></i>
                <h6 class="text-muted">Chưa có cuộc trò chuyện nào</h6>
                <p class="text-muted small">Bắt đầu trò chuyện bằng cách liên hệ với người bán từ trang sản phẩm</p>
            </div>
        `;
    return;
  }

  let html = "";
  conversations.forEach((conversation) => {
    const otherUser = conversation.otherUser || conversation.nguoiThamGia?.find((u) => u._id !== AuthManager.getUser()._id);
    if (!otherUser) return;

    const lastMessage = conversation.lastMessage || conversation.tinNhanCuoi;
    const unreadCount = conversation.unreadCount || conversation.soTinNhanChuaDoc || 0;
    const isActive = conversation._id === currentConversationId ? "active" : "";

    html += `
            <div class="conversation-item ${isActive}" data-conversation-id="${
      conversation._id
    }" data-user-id="${otherUser._id}">
                <div class="d-flex align-items-center">
                    <div class="flex-shrink-0">
                        <div class="d-flex align-items-center">
                            <strong class="small">${otherUser.hoTen}</strong>
                            <span class="user-status ml-1" data-user-id="${
                              otherUser._id
                            }"></span>
                        </div>
                        <small class="text-muted">${otherUser.diaChi}</small>
                    </div>
                    <div class="flex-grow-1"></div>
                    ${
                      unreadCount > 0
                        ? `<span class="badge badge-primary">${
                            unreadCount > 99 ? "99+" : unreadCount
                          }</span>`
                        : ""
                    }
                </div>
                <div class="mt-1">
                    <p class="small text-muted mb-0">
                        ${
                          lastMessage
                            ? Utils.truncateText(lastMessage.noiDung, 40)
                            : "Bắt đầu cuộc trò chuyện"
                        }
                    </p>
                    ${
                      lastMessage
                        ? `<small class="text-muted">${Utils.formatRelativeTime(
                            lastMessage.createdAt || lastMessage.thoiGianGui
                          )}</small>`
                        : ""
                    }
                </div>
            </div>
        `;
  });

  // Typing indicator
  const typingEl = document.createElement('div');
  typingEl.id = 'typingIndicator';
  typingEl.className = 'small text-light mt-1';
  typingEl.style.display = 'none';
  const header = document.getElementById('chatHeader');
  if (header) header.appendChild(typingEl);
  if (socketManager && !socketManager._typingListenerBound) {
    socketManager.onTypingStatus(({ userId, typing }) => {
      if (!currentChatUser || userId !== currentChatUser._id) return;
      typingEl.textContent = typing ? 'Đang nhập…' : '';
      typingEl.style.display = typing ? 'block' : 'none';
    });
    socketManager._typingListenerBound = true;
  }

  conversationsList.innerHTML = html;

  // Add click listeners
  conversationsList.querySelectorAll(".conversation-item").forEach((item) => {
    item.addEventListener("click", function () {
      const conversationId = this.getAttribute("data-conversation-id");
      const userId = this.getAttribute("data-user-id");
      // Reset de-dup cache for new thread
      try { renderedMessageIds.clear(); } catch(_) {}
      openConversation(conversationId, userId);
    });
  });
}

async function openConversation(conversationId, userId) {
  try {
    // Update UI state
    currentConversationId = conversationId;
    if (userId) {
      try { localStorage.setItem('messages:lastUserId', userId); } catch(_) {}
    }

    // Update active conversation in sidebar
    document.querySelectorAll(".conversation-item").forEach((item) => {
      item.classList.remove("active");
    });
    if (conversationId) {
      document
        .querySelector(`[data-conversation-id="${conversationId}"]`)
        ?.classList.add("active");
    } else if (userId) {
      // find the conversation item by user-id if id is not known yet
      document
        .querySelector(`[data-user-id="${userId}"]`)
        ?.classList.add("active");
    }

    // Get user info
  const userResponse = await ApiService.get(`/users/${userId}`);
  currentChatUser = userResponse.user || userResponse.data;

    // Update chat header
    updateChatHeader(currentChatUser);

    // Show chat input
    const chatInputContainer = document.getElementById("chatInputContainer");
    if (chatInputContainer) {
      chatInputContainer.style.display = "block";
    }

    // Join conversation room
    if (socketManager) {
      socketManager.joinConversation(userId);
        if (chatUI) chatUI.currentChatUserId = userId;
    }

    // Reflect current chat user in URL (no reload)
    try {
      const url = new URL(window.location);
      url.searchParams.set('user', userId);
      window.history.replaceState({}, '', url);
    } catch(_) {}

    // Load message history
  await loadMessageHistory(userId);

    // Mark messages as read
  await markMessagesAsRead(userId);

    // Hide sidebar on mobile after selecting conversation
    if (window.innerWidth < 768) {
      document.querySelector(".chat-sidebar")?.classList.remove("show");
    }
  } catch (error) {
    console.error("Error opening conversation:", error);
    Utils.showToast("Không thể mở cuộc trò chuyện", "error");
  }
}

async function startOrFindConversation(userId) {
  try {
    // Try to find existing conversation
    let conversation = conversations.find((conv) => {
      const other = conv.otherUser || conv.nguoiThamGia?.find((u) => u._id !== AuthManager.getUser()._id);
      return other && other._id === userId;
    });

    if (conversation) {
      // Open existing conversation
      await openConversation(conversation._id, userId);
    } else {
      // Start new conversation
      const userResponse = await ApiService.get(`/users/${userId}`);
      currentChatUser = userResponse.user || userResponse.data;

      if (!currentChatUser || !currentChatUser._id) {
        throw new Error("Không lấy được thông tin người dùng");
      }

      updateChatHeader(currentChatUser);

      // Show chat input
      const chatInputContainer = document.getElementById("chatInputContainer");
      if (chatInputContainer) {
        chatInputContainer.style.display = "block";
      }

      // Join conversation room
      if (socketManager) {
        socketManager.joinConversation(userId);
        chatUI.currentChatUserId = userId;
      }

      // Clear messages area
      const chatMessages = document.getElementById("chatMessages");
      if (chatMessages) {
        chatMessages.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-comment fa-3x text-primary mb-3"></i>
                        <h5 class="text-primary">Cuộc trò chuyện mới</h5>
                        <p class="text-muted">Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện với ${currentChatUser.hoTen}</p>
                    </div>
                `;
      }
    }
    try { localStorage.setItem('messages:lastUserId', userId); } catch(_) {}
  } catch (error) {
    console.error("Error starting conversation:", error);
    Utils.showToast("Không thể bắt đầu cuộc trò chuyện", "error");
  }
}

function updateChatHeader(user) {
  if (!user) return;
  const currentChatUser = document.getElementById("currentChatUser");
  const currentUserStatus = document.getElementById("currentUserStatus");

  if (currentChatUser) {
    currentChatUser.textContent = user.hoTen || "Người dùng";
  }

  if (currentUserStatus && user._id) {
    currentUserStatus.setAttribute("data-user-id", user._id);
    // Status will be updated by socket events
  }
}

async function loadMessageHistory(otherUserId) {
  try {
    const response = await ApiService.get(`/messages/${otherUserId}`);
    const messages = response.messages || response.data || [];

    displayMessages(messages);
    scrollToBottom();
  } catch (error) {
    console.error("Error loading message history:", error);
    Utils.showToast("Không thể tải lịch sử tin nhắn", "error");
  }
}

function displayMessages(messages) {
  const chatMessages = document.getElementById("chatMessages");
  if (!chatMessages) return;

  if (messages.length === 0) {
    chatMessages.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-comment fa-3x text-primary mb-3"></i>
                <h5 class="text-primary">Bắt đầu cuộc trò chuyện</h5>
                <p class="text-muted">Gửi tin nhắn đầu tiên</p>
            </div>
        `;
    return;
  }

  let html = "";
  const currentUser = AuthManager.getUser();

  messages.forEach((message) => {
    const senderId = typeof message.nguoiGui === 'string' ? message.nguoiGui : message.nguoiGui?._id;
    const isOwnMessage = senderId === currentUser._id;
    html += createMessageHTML(message, isOwnMessage);
    if (message._id) renderedMessageIds.add(message._id);
  });

  chatMessages.innerHTML = html;
}

function createMessageHTML(message, isOwnMessage) {
  const messageClass = isOwnMessage ? "message own-message" : "message";

  let messageContent = "";

  switch (message.loaiTinNhan) {
    case "text":
      messageContent = `<p class="mb-0">${message.noiDung}</p>`;
      break;

    case "image":
      messageContent = `<img src="${message.noiDung}" alt="Image" class="message-image">`;
      break;

    case "offer":
      try {
        const offer = JSON.parse(message.noiDung);
        messageContent = `
                    <div class="offer-message">
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-handshake text-success mr-2"></i>
                            <strong>Đề xuất ${
                              offer.type === "buy" ? "mua" : "trao đổi"
                            }</strong>
                        </div>
                        ${
                          offer.price
                            ? `<p class="mb-1"><strong>Giá:</strong> ${Utils.formatCurrency(
                                offer.price
                              )}</p>`
                            : ""
                        }
                        ${
                          offer.exchangeItem
                            ? `<p class="mb-1"><strong>Trao đổi:</strong> ${offer.exchangeItem}</p>`
                            : ""
                        }
                        ${
                          offer.note
                            ? `<p class="mb-1"><strong>Ghi chú:</strong> ${offer.note}</p>`
                            : ""
                        }
                        <small class="text-muted">Sản phẩm: ${
                          offer.postTitle
                        }</small>
                    </div>
                `;
      } catch (e) {
        messageContent = `<p class="mb-0">${message.noiDung}</p>`;
      }
      break;

    default:
      messageContent = `<p class="mb-0">${message.noiDung}</p>`;
  }

  return `
        <div class="${messageClass}">
            <div class="message-content">
                ${messageContent}
                <div class="message-time">
          ${Utils.formatDateTime(message.thoiGianGui || message.createdAt)}
                </div>
            </div>
        </div>
    `;
}

function handleNewMessage(message) {
  try { } catch(_) {}
  // If message is for current conversation, display it
  if (
    currentChatUser &&
    ((message.nguoiGui?._id || message.nguoiGui) === currentChatUser._id ||
      (message.nguoiNhan?._id || message.nguoiNhan) === currentChatUser._id)
  ) {
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages) {
      // Clear empty-state if present
      if (chatMessages.innerHTML.includes("text-center")) {
        chatMessages.innerHTML = "";
      }
      if (message._id && renderedMessageIds.has(message._id)) {
        return; // already rendered
      }
      const currentUser = AuthManager.getUser();
      const senderId = typeof message.nguoiGui === 'string' ? message.nguoiGui : message.nguoiGui?._id;
      const isOwnMessage = senderId === currentUser._id;
      chatMessages.innerHTML += createMessageHTML(message, isOwnMessage);
      if (message._id) renderedMessageIds.add(message._id);
      scrollToBottom();
    }
  }

  // If chat user not set yet but URL targets this conversation, open it to fetch full history
  if (!currentChatUser) {
    const targetUserId = Utils.getQueryParam("user");
    const currentUser = AuthManager.getUser();
    const senderId = (message.nguoiGui?._id || message.nguoiGui);
    const receiverId = (message.nguoiNhan?._id || message.nguoiNhan);
    const otherUserId = senderId === currentUser._id ? receiverId : senderId;
    if (targetUserId && otherUserId === targetUserId) {
      openConversation(null, targetUserId);
      return;
    }
  }

  // Update unread count for other conversations
  updateUnreadCounts();
}

async function handleSendMessage(e) {
  e.preventDefault();

  const messageInput = document.getElementById("messageInput");
  const content = messageInput.value.trim();

  if (!content) return;
  if (!currentChatUser || !currentChatUser._id) {
    Utils.showToast("Chưa chọn cuộc trò chuyện", "warning");
    return;
  }

  try {
    const sendBtn = document.getElementById("sendMessageBtn");
    Utils.showLoading(sendBtn);

    // Send via Socket.IO
    if (socketManager) {
      await socketManager.sendMessage(currentChatUser._id, content, "text");
      messageInput.value = "";
    }
  } catch (error) {
    Utils.showToast("Không thể gửi tin nhắn: " + error.message, "error");
  } finally {
    const sendBtn = document.getElementById("sendMessageBtn");
    Utils.hideLoading(sendBtn);
  }
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file || !currentChatUser) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    Utils.showToast("Chỉ cho phép tải lên hình ảnh", "error");
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    Utils.showToast("Kích thước file không được vượt quá 5MB", "error");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    Utils.showToast("Đang tải file lên...", "info");

    // Upload file
  const uploadResponse = await ApiService.uploadFile("/cloudinary/upload", formData);

    // Send image message via Socket.IO
    if (socketManager) {
      await socketManager.sendMessage(
        currentChatUser._id,
        (uploadResponse.data?.url || uploadResponse.data?.data?.url),
        "image"
      );
    }

    // Clear file input
    event.target.value = "";
  } catch (error) {
    Utils.showToast("Không thể gửi hình ảnh: " + error.message, "error");
  }
}

function handleSendOffer() {
  if (!currentChatUser) {
    Utils.showToast("Chưa chọn cuộc trò chuyện", "error");
    return;
  }

  // Show offer modal (from socket.js)
  if (chatUI) {
    chatUI.showOfferDialog();
  }
}

async function markMessagesAsRead(otherUserId) {
  try {
    await ApiService.patch(`/messages/mark-read/${otherUserId}`);

    // Update UI - remove unread badges
    const conversationItem = document.querySelector(
      `[data-conversation-id="${currentConversationId}"]`
    );
    if (conversationItem) {
      const badge = conversationItem.querySelector(".badge");
      if (badge) {
        badge.remove();
      }
    }

    // Refresh global unread badge (header)
    if (window.socketManager && socketManager.updateUnreadMessagesBadge) {
      socketManager.updateUnreadMessagesBadge();
    } else if (window.dispatchEvent) {
      // Trigger layout to refresh (in case it has a refresher)
      window.dispatchEvent(new CustomEvent('user:updated', { detail: { user: AuthManager.getUser() } }));
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}

function updateUnreadCounts() {
  // This would typically be called to refresh the unread message counts
  // Implementation depends on your API structure
}

function scrollToBottom() {
  const chatMessages = document.getElementById("chatMessages");
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Auto-update conversations list periodically
setInterval(() => {
  if (document.visibilityState === "visible") {
    loadConversations();
  }
}, 30000); // Every 30 seconds

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && currentConversationId) {
    // Mark messages as read when user comes back to the page
    markMessagesAsRead(currentConversationId);
  }
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (socketManager) {
    socketManager.leaveConversation();
  }
});
