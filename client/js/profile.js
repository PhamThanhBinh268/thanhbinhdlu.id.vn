// =============================================================================
// Profile Page JavaScript
// =============================================================================

let currentUser = null;
let originalFormData = null;

document.addEventListener("DOMContentLoaded", function () {
  // Kiểm tra đăng nhập
  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Bạn cần đăng nhập để xem hồ sơ", "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
    return;
  }

  // Initialize profile page
  initializeProfilePage();
});

async function initializeProfilePage() {
  try {
    // Load user profile
    await loadUserProfile();

    // Setup form handlers
    setupFormHandlers();

    // Update navigation for logged in user
    updateNavigationForUser();

    // Initialize transactions section if exists
    initTransactionsSection();

    // Initialize saved posts section if exists
    initSavedPostsSection();
  } catch (error) {
    console.error("Initialize profile page error:", error);
    Utils.showToast("Có lỗi khi tải hồ sơ cá nhân", "error");
  }
}

// =============================================================================
// Load User Profile
// =============================================================================
async function loadUserProfile() {
  try {
    const response = await ApiService.get(API_CONFIG.ENDPOINTS.AUTH.ME);
    currentUser = response.user;

    // Update profile display
    updateProfileDisplay();

    // Fill form with current data
    fillProfileForm();

    // Load user stats
    await loadUserStats();
  } catch (error) {
    console.error("Load user profile error:", error);
    throw error;
  }
}

function updateProfileDisplay() {
  // Update avatar
  const avatarImg = document.getElementById("profileAvatar");
  if (currentUser.avatar) {
    avatarImg.src = currentUser.avatar;
  }

  // Update name and email
  document.getElementById("profileName").textContent =
    currentUser.hoTen || "Chưa cập nhật";
  document.getElementById("profileEmail").textContent = currentUser.email || "";

  // Update rating
  document.getElementById("profileRating").textContent =
    currentUser.diemUyTin || 0;

  // Render initial reputation badge (seller badge needs stats)
  try {
    const badgeEl = document.getElementById('profileBadges');
    if (badgeEl && window.UserDecorators) {
      badgeEl.innerHTML = UserDecorators.renderBadges(currentUser, { totalPosts: 0 });
    }
  } catch(_){}
}

function fillProfileForm() {
  const form = document.getElementById("profileForm");

  // Fill basic info
  form.hoTen.value = currentUser.hoTen || "";
  form.email.value = currentUser.email || "";
  form.soDienThoai.value = currentUser.soDienThoai || "";
  form.diaChi.value = currentUser.diaChi || "";

  // Fill optional fields
  if (currentUser.ngaySinh) {
    form.ngaySinh.value = currentUser.ngaySinh.split("T")[0]; // Format date
  }

  form.gioiThieu.value = currentUser.gioiThieu || "";

  // Fill social links
  if (currentUser.lienKetMangXaHoi) {
    form.facebook.value = currentUser.lienKetMangXaHoi.facebook || "";
    form.zalo.value = currentUser.lienKetMangXaHoi.zalo || "";
  }

  // Store original data for reset
  originalFormData = new FormData(form);
}

// =============================================================================
// Load User Stats
// =============================================================================
async function loadUserStats() {
  try {
    // Load user posts count
    const postsResponse = await ApiService.get(
      `${API_CONFIG.ENDPOINTS.POSTS}?nguoiDang=${currentUser._id}`
    );
    const totalPosts = postsResponse.pagination?.total || 0;
    document.getElementById("totalPosts").textContent = totalPosts;

    // Load reviews count
    document.getElementById("totalReviews").textContent =
      currentUser.soLuotDanhGia || 0;

    // Re-render badges with seller info
    try {
      const badgeEl = document.getElementById('profileBadges');
      if (badgeEl && window.UserDecorators) {
        badgeEl.innerHTML = UserDecorators.renderBadges(currentUser, { totalPosts });
      }
    } catch(_){}
  } catch (error) {
    console.error("Load user stats error:", error);
    document.getElementById("totalPosts").textContent = "0";
    document.getElementById("totalReviews").textContent = "0";
  }
}

// =============================================================================
// Form Handlers
// =============================================================================
function setupFormHandlers() {
  const profileForm = document.getElementById("profileForm");

  // Form submit handler
  profileForm.addEventListener("submit", handleProfileUpdate);

  // Avatar change handler is already set in HTML onclick
}

async function handleProfileUpdate(e) {
  e.preventDefault();

  const updateBtn = document.getElementById("updateBtn");

  try {
    // Show loading
    Utils.showLoading(updateBtn);

    // Validate form
    if (!validateProfileForm()) {
      return;
    }

    // Prepare update data
    const formData = new FormData(e.target);
    const updateData = {
      hoTen: formData.get("hoTen").trim(),
      soDienThoai: formData.get("soDienThoai").trim(),
      diaChi: formData.get("diaChi").trim(),
    };

    // Add optional fields
    if (formData.get("ngaySinh")) {
      updateData.ngaySinh = formData.get("ngaySinh");
    }

    if (formData.get("gioiThieu")) {
      updateData.gioiThieu = formData.get("gioiThieu").trim();
    }

    // Social links
    const facebook = formData.get("facebook")?.trim();
    const zalo = formData.get("zalo")?.trim();
    if (facebook || zalo) {
      updateData.lienKetMangXaHoi = {};
      if (facebook) updateData.lienKetMangXaHoi.facebook = facebook;
      if (zalo) updateData.lienKetMangXaHoi.zalo = zalo;
    }

    // Handle password change if provided
    const currentPassword = formData.get("matKhauHienTai")?.trim();
    const newPassword = formData.get("matKhauMoi")?.trim();
    const confirmPassword = formData.get("xacNhanMatKhau")?.trim();

    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        showFieldError(
          document.getElementById("currentPassword"),
          "Vui lòng nhập mật khẩu hiện tại"
        );
        return;
      }
      if (!newPassword) {
        showFieldError(
          document.getElementById("newPassword"),
          "Vui lòng nhập mật khẩu mới"
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        showFieldError(
          document.getElementById("confirmPassword"),
          "Mật khẩu xác nhận không khớp"
        );
        return;
      }
      if (newPassword.length < 6) {
        showFieldError(
          document.getElementById("newPassword"),
          "Mật khẩu mới phải có ít nhất 6 ký tự"
        );
        return;
      }

      updateData.matKhauHienTai = currentPassword;
      updateData.matKhauMoi = newPassword;
    }

    // Update profile
    const response = await ApiService.put(
      `${API_CONFIG.ENDPOINTS.USERS}/profile`,
      updateData
    );

    // Update stored user data
    AuthManager.setUser(response.user);
    currentUser = response.user;

    // Update display
    updateProfileDisplay();

    Utils.showToast("Cập nhật hồ sơ thành công!", "success");

    // Notify other parts (e.g., header) that user data updated
    try {
      window.dispatchEvent(
        new CustomEvent('user:updated', { detail: { user: currentUser } })
      );
    } catch (_) {}

    // Clear password fields
    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.message.includes("Mật khẩu hiện tại không đúng")) {
      showFieldError(
        document.getElementById("currentPassword"),
        "Mật khẩu hiện tại không đúng"
      );
    } else if (error.message.includes("Số điện thoại đã được sử dụng")) {
      showFieldError(
        document.getElementById("phone"),
        "Số điện thoại này đã được sử dụng"
      );
    } else {
      Utils.showToast("Cập nhật hồ sơ thất bại: " + error.message, "error");
    }
  } finally {
    Utils.hideLoading(updateBtn);
  }
}

// =============================================================================
// Avatar Upload
// =============================================================================
function previewAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file
  if (!file.type.startsWith("image/")) {
    Utils.showToast("Vui lòng chọn file ảnh", "error");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    // 5MB
    Utils.showToast("Kích thước ảnh không được vượt quá 5MB", "error");
    return;
  }

  // Preview image (optimistic preview)
  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById("profileAvatar").src = e.target.result;
  };
  reader.readAsDataURL(file);

  // Show loading overlay
  const wrapper = document.querySelector(".avatar-upload");
  if (wrapper) wrapper.classList.add("loading");
  uploadAvatar(file).finally(() => {
    if (wrapper) wrapper.classList.remove("loading");
  });
}

async function uploadAvatar(file) {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await ApiService.uploadFile(
      `${API_CONFIG.ENDPOINTS.USERS}/avatar`,
      formData
    );

    // Update stored user data
    currentUser.avatar = response.user.avatar;
    AuthManager.setUser(currentUser);

    // Cập nhật avatar trên navigation dropdown nếu có
    updateNavigationForUser();

    // Notify layout/header to refresh avatar immediately
    try {
      window.dispatchEvent(
        new CustomEvent('user:updated', { detail: { user: currentUser } })
      );
    } catch (_) {}

    Utils.showToast("Cập nhật avatar thành công!", "success");
  } catch (error) {
    console.error("Upload avatar error:", error);
    Utils.showToast("Cập nhật avatar thất bại: " + error.message, "error");

    // Revert avatar display
    if (currentUser.avatar) {
      document.getElementById("profileAvatar").src = currentUser.avatar;
    } else {
      document.getElementById("profileAvatar").src = "img/user.jpg";
    }
  }
}

// =============================================================================
// Form Validation
// =============================================================================
function validateProfileForm() {
  let isValid = true;

  // Clear previous errors
  document.querySelectorAll(".is-invalid").forEach((element) => {
    element.classList.remove("is-invalid");
  });

  // Validate required fields
  const hoTen = document.getElementById("fullName");
  if (!hoTen.value.trim() || hoTen.value.trim().length < 2) {
    showFieldError(hoTen, "Họ tên phải có ít nhất 2 ký tự");
    isValid = false;
  }

  const soDienThoai = document.getElementById("phone");
  if (
    !soDienThoai.value.trim() ||
    !Utils.isValidPhone(soDienThoai.value.trim())
  ) {
    showFieldError(soDienThoai, "Số điện thoại không hợp lệ");
    isValid = false;
  }

  const diaChi = document.getElementById("address");
  if (!diaChi.value.trim() || diaChi.value.trim().length < 5) {
    showFieldError(diaChi, "Địa chỉ phải có ít nhất 5 ký tự");
    isValid = false;
  }

  // Validate bio length
  const gioiThieu = document.getElementById("bio");
  if (gioiThieu.value && gioiThieu.value.length > 500) {
    showFieldError(gioiThieu, "Giới thiệu không được vượt quá 500 ký tự");
    isValid = false;
  }

  // Validate social links
  const facebook = document.getElementById("facebook");
  if (facebook.value && !isValidUrl(facebook.value)) {
    showFieldError(facebook, "Link Facebook không hợp lệ");
    isValid = false;
  }

  const zalo = document.getElementById("zalo");
  if (zalo.value && !Utils.isValidPhone(zalo.value)) {
    showFieldError(zalo, "Số Zalo không hợp lệ");
    isValid = false;
  }

  return isValid;
}

function showFieldError(field, message) {
  field.classList.add("is-invalid");
  const feedback = field.parentNode.querySelector(".invalid-feedback");
  if (feedback) {
    feedback.textContent = message;
  }
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// =============================================================================
// Utility Functions
// =============================================================================
function resetForm() {
  if (confirm("Bạn có chắc muốn khôi phục thông tin ban đầu?")) {
    fillProfileForm();

    // Clear all validation errors
    document.querySelectorAll(".is-invalid").forEach((element) => {
      element.classList.remove("is-invalid");
    });

    Utils.showToast("Đã khôi phục thông tin ban đầu", "info");
  }
}

function deleteAccount() {
  const confirmed = confirm(
    "⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản?\n\n" +
      "Hành động này sẽ:\n" +
      "- Xóa vĩnh viễn tất cả thông tin cá nhân\n" +
      "- Xóa tất cả bài đăng của bạn\n" +
      "- Xóa lịch sử tin nhắn\n" +
      "- KHÔNG THỂ HOÀN TÁC\n\n" +
      "Nhập 'XÓA TÀI KHOẢN' để xác nhận:"
  );

  if (confirmed) {
    const confirmation = prompt("Nhập chính xác: XÓA TÀI KHOẢN");
    if (confirmation === "XÓA TÀI KHOẢN") {
      performDeleteAccount();
    } else {
      Utils.showToast("Xác nhận không chính xác. Hủy xóa tài khoản.", "info");
    }
  }
}

async function performDeleteAccount() {
  try {
    const password = prompt("Nhập mật khẩu để xác nhận xóa tài khoản:");
    if (!password) return;

    await ApiService.delete(`${API_CONFIG.ENDPOINTS.USERS}/account`, {
      matKhau: password,
    });

    Utils.showToast("Tài khoản đã được xóa thành công", "success");

    // Logout and redirect
    AuthManager.logout();
  } catch (error) {
    console.error("Delete account error:", error);
    Utils.showToast("Xóa tài khoản thất bại: " + error.message, "error");
  }
}

function updateNavigationForUser() {
  const authButtons = document.getElementById("authButtons");
  if (currentUser && authButtons) {
    authButtons.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-sm btn-light dropdown-toggle d-flex align-items-center" type="button" data-toggle="dropdown" style="gap:6px;">
          <img src="${
            currentUser.avatar || "img/user.jpg"
          }" style="width:24px;height:24px;object-fit:cover;border-radius:50%;border:1px solid #ddd;" alt="avatar" />
          <span style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${
            currentUser.hoTen
          }</span>
        </button>
        <div class="dropdown-menu">
          <a class="dropdown-item" href="profile.html">
            <i class="fas fa-user"></i> Hồ sơ
          </a>
          <a class="dropdown-item" href="my-posts.html">
            <i class="fas fa-list"></i> Bài đăng của tôi
          </a>
          <a class="dropdown-item" href="messages.html">
            <i class="fas fa-envelope"></i> Tin nhắn
          </a>
          <a class="dropdown-item" href="create-post.html">
            <i class="fas fa-plus"></i> Đăng bài mới
          </a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" href="#" onclick="AuthManager.logout()">
            <i class="fas fa-sign-out-alt"></i> Đăng xuất
          </a>
        </div>
      </div>
    `;
  }
}

// =============================================================================
// Transactions Section
// =============================================================================
let txState = { page: 1, limit: 10, type: 'all', trangThai: '' };

function initTransactionsSection() {
  const container = document.getElementById('transactionsSection');
  if (!container) return; // page may not include section

  // Wire filters
  document.getElementById('txFilterAll')?.addEventListener('click', () => { txState.type = 'all'; txState.page = 1; loadTransactions(true); });
  document.getElementById('txFilterBuying')?.addEventListener('click', () => { txState.type = 'buying'; txState.page = 1; loadTransactions(true); });
  document.getElementById('txFilterSelling')?.addEventListener('click', () => { txState.type = 'selling'; txState.page = 1; loadTransactions(true); });

  container.querySelectorAll('[data-status]')?.forEach(btn => {
    btn.addEventListener('click', () => { txState.trangThai = btn.getAttribute('data-status') || ''; txState.page = 1; loadTransactions(true); });
  });

  document.getElementById('txLoadMore')?.addEventListener('click', () => { txState.page += 1; loadTransactions(false); });

  // Initial load
  loadTransactions(true);
}

async function loadTransactions(reset) {
  try {
    const params = { page: txState.page, limit: txState.limit, type: txState.type };
    if (txState.trangThai) params.trangThai = txState.trangThai;

    const res = await ApiService.get('/transactions', params);
    const list = res.transactions || res.data || [];
    const total = res.pagination?.total || list.length;
    const pages = res.pagination?.pages || 1;

    renderTransactions(list, reset);

    // Toggle load more
    const loadMoreBtn = document.getElementById('txLoadMore');
    if (loadMoreBtn) {
      const hasMore = txState.page < pages;
      loadMoreBtn.classList.toggle('d-none', !hasMore);
    }
  } catch (e) {
    console.error('[Transactions] load error', e);
    Utils.showToast('Không thể tải danh sách giao dịch', 'error');
  }
}

function renderTransactions(items, reset) {
  const wrap = document.getElementById('transactionsList');
  if (!wrap) return;
  if (reset) wrap.innerHTML = '';

  if (!items.length && reset) {
    wrap.innerHTML = '<div class="col-12"><div class="text-center text-muted py-4">Chưa có giao dịch nào</div></div>';
    return;
  }

  const html = items.map(tx => transactionCard(tx)).join('');
  const temp = document.createElement('div');
  temp.innerHTML = html;
  Array.from(temp.children).forEach(c => wrap.appendChild(c));
}

function transactionCard(tx) {
  const post = tx.baiDang || {};
  const img = (post.hinhAnh && post.hinhAnh[0]) || 'img/product-placeholder.jpg';
  const price = Utils.formatCurrency(tx.giaThanhToan || post.gia || 0);
  const status = humanizeTxStatus(tx.trangThai);
  const otherParty = tx.nguoiBan?._id === currentUser._id ? (tx.nguoiMua?.hoTen || 'Người mua') : (tx.nguoiBan?.hoTen || 'Người bán');
  return `
    <div class="col-md-12">
      <div class="d-flex align-items-center border p-2 mb-2 rounded" style="gap:12px;">
        <img src="${img}" alt="product" style="width:64px;height:64px;object-fit:cover;border-radius:6px;" />
        <div class="flex-fill">
          <div class="d-flex justify-content-between align-items-center">
            <a href="transaction-detail.html?id=${tx._id}" class="font-weight-bold text-dark">${Utils.truncateText(post.tieuDe || 'Sản phẩm', 60)}</a>
            <span class="badge badge-secondary">${status}</span>
          </div>
          <div class="text-muted small mt-1">Đối tác: ${otherParty}</div>
          <div class="text-primary mt-1">${price}</div>
        </div>
        <a class="btn btn-sm btn-outline-primary" href="transaction-detail.html?id=${tx._id}">Xem</a>
      </div>
    </div>
  `;
}

function humanizeTxStatus(s) {
  const map = {
    'dang-thoa-thuan': 'Đang thỏa thuận',
    'da-dong-y': 'Đã đồng ý',
    'hoan-thanh': 'Hoàn thành',
    'huy-bo': 'Hủy bỏ',
  };
  return map[s] || s || '--';
}

// =============================================================================
// Saved Posts Section
// =============================================================================
let savedState = { page: 1, limit: 12 };

function initSavedPostsSection() {
  const container = document.getElementById('savedPostsSection');
  if (!container) return;

  document.getElementById('savedLoadMore')?.addEventListener('click', () => {
    savedState.page += 1;
    loadSavedPosts(false);
  });

  // Initial load
  loadSavedPosts(true);
}

async function loadSavedPosts(reset) {
  try {
    const res = await ApiService.get('/posts/saved/me', {
      page: savedState.page,
      limit: savedState.limit,
    });
    const list = res.posts || res.data || [];
    const pages = res.pagination?.pages || 1;

    renderSavedPosts(list, reset);

    // Toggle load more
    const btn = document.getElementById('savedLoadMore');
    if (btn) {
      const hasMore = savedState.page < pages;
      btn.classList.toggle('d-none', !hasMore);
    }
  } catch (e) {
    console.error('[SavedPosts] load error', e);
    Utils.showToast('Không thể tải danh sách đã lưu', 'error');
  }
}

function renderSavedPosts(items, reset) {
  const wrap = document.getElementById('savedPostsList');
  if (!wrap) return;
  if (reset) wrap.innerHTML = '';

  if (!items.length && reset) {
    wrap.innerHTML = '<div class="col-12"><div class="text-center text-muted py-4">Chưa lưu bài đăng nào</div></div>';
    return;
  }

  const html = items.map(p => savedPostCard(p)).join('');
  const temp = document.createElement('div');
  temp.innerHTML = html;
  Array.from(temp.children).forEach(c => wrap.appendChild(c));
}

function savedPostCard(post) {
  const img = (post.hinhAnh && post.hinhAnh[0]) || 'img/product-placeholder.jpg';
  const price = post.gia > 0 ? Utils.formatCurrency(post.gia) : 'Trao đổi';
  const conditionMap = { new: 'Mới', 'like-new': 'Như mới', good: 'Tốt', fair: 'Khá', poor: 'Cần sửa' };
  const condition = conditionMap[post.tinhTrang] || post.tinhTrang || '';
  const savedAt = post.savedAt ? Utils.formatDateTime(post.savedAt) : '';
  return `
    <div class="col-lg-4 col-md-6 col-sm-6 pb-1" data-post-id="${post._id}">
      <div class="product-item bg-light mb-4">
        <div class="product-img position-relative overflow-hidden" style="aspect-ratio:4/3;">
          <img class="img-fluid w-100" style="height:100%;object-fit:cover;" src="${img}" alt="${post.tieuDe}" />
          <div class="product-action">
            <a class="btn btn-outline-dark btn-square" href="#" onclick="unsaveSavedPost('${post._id}', event)"><i class="fas fa-heart-broken"></i></a>
            <a class="btn btn-outline-dark btn-square" href="detail.html?id=${post._id}" onclick="event.stopPropagation()"><i class="fa fa-eye"></i></a>
          </div>
        </div>
        <div class="text-center py-3">
          <a class="h6 text-decoration-none text-truncate d-block" href="detail.html?id=${post._id}">${post.tieuDe}</a>
          <div class="d-flex justify-content-center align-items-center mt-1">
            <h5 class="text-primary mb-0">${price}</h5>
          </div>
          <div class="small text-muted mt-1">${condition}${savedAt ? ' • Lưu: ' + savedAt : ''}</div>
        </div>
      </div>
    </div>`;
}

async function unsaveSavedPost(postId, event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  if (!AuthManager.isLoggedIn()) {
    return Utils.showToast('Vui lòng đăng nhập', 'warning');
  }
  try {
    // Toggle save (server removes if already saved)
    await ApiService.post(`/posts/${postId}/save`);
    // Remove card from DOM
    const card = document.querySelector(`#savedPostsList [data-post-id="${postId}"]`);
    if (card && card.parentElement) card.parentElement.remove();
    Utils.showToast('Đã bỏ lưu bài đăng', 'info');

    // If list becomes empty after removal, reload base state
    const remaining = document.querySelectorAll('#savedPostsList > div').length;
    if (remaining === 0) {
      savedState.page = 1;
      loadSavedPosts(true);
    }
  } catch (e) {
    console.error('[SavedPosts] unsave error', e);
    Utils.showToast('Không thể bỏ lưu: ' + (e.message || ''), 'error');
  }
}

// expose for inline onclick
window.unsaveSavedPost = unsaveSavedPost;
