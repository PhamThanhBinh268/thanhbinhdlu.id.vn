// =============================================================================
// Create Post Page JavaScript
// =============================================================================

document.addEventListener("DOMContentLoaded", function () {
  // Kiểm tra đăng nhập
  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Bạn cần đăng nhập để đăng bài", "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
    return;
  }

  // Initialize page
  initializeCreatePostPage();
});

async function initializeCreatePostPage() {
  try {
    // Load categories
    await loadCategories();

    // Setup form handlers
    setupFormHandlers();

    // Load user address from profile
    await loadUserProfile();
  } catch (error) {
    console.error("Initialize create post page error:", error);
    Utils.showToast("Có lỗi khi khởi tạo trang", "error");
  }
}

// =============================================================================
// Load Categories
// =============================================================================
async function loadCategories() {
  try {
    const categories = await ApiService.get(API_CONFIG.ENDPOINTS.CATEGORIES);
    const categorySelect = document.getElementById("postCategory");

    categorySelect.innerHTML = '<option value="">-- Chọn danh mục --</option>';

    categories.data.forEach((category) => {
      const option = document.createElement("option");
      option.value = category._id;
      option.textContent = category.tenDanhMuc;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error("Load categories error:", error);
    Utils.showToast("Không thể tải danh mục sản phẩm", "error");
  }
}

// =============================================================================
// Load User Profile
// =============================================================================
async function loadUserProfile() {
  try {
    const response = await ApiService.get(API_CONFIG.ENDPOINTS.AUTH.ME);
    const user = response.user;

    // Pre-fill address if available
    if (user.diaChi) {
      document.getElementById("postAddress").value = user.diaChi;
    }
  } catch (error) {
    console.error("Load user profile error:", error);
  }
}

// =============================================================================
// Form Handlers
// =============================================================================
function setupFormHandlers() {
  const form = document.getElementById("createPostForm");
  const imageInput = document.getElementById("postImages");

  // Form submit handler
  form.addEventListener("submit", handleFormSubmit);

  // Image preview handler
  imageInput.addEventListener("change", handleImagePreview);
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("submitBtn");

  try {
    // Show loading
    Utils.showLoading(submitBtn);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Prepare form data
    const formData = new FormData();
    const form = e.target;

    // Add text fields
    formData.append("tieuDe", form.tieuDe.value.trim());
    formData.append("moTa", form.moTa.value.trim());
    formData.append("gia", parseInt(form.gia.value));
    formData.append("danhMuc", form.danhMuc.value);
    formData.append("tinhTrang", form.tinhTrang.value);

    // Add optional fields
    if (form.diaDiem.value.trim()) {
      formData.append("diaDiem", form.diaDiem.value.trim());
    }

    if (form.tags.value.trim()) {
      const tags = form.tags.value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      formData.append("tags", JSON.stringify(tags));
    }

    // Add images
    const imageFiles = form.images.files;
    for (let i = 0; i < imageFiles.length; i++) {
      formData.append("images", imageFiles[i]);
    }

    // Submit form
    const response = await ApiService.uploadFile(
      API_CONFIG.ENDPOINTS.POSTS,
      formData
    );

    Utils.showToast("Đăng bài thành công!", "success");

    // Redirect to post detail
    setTimeout(() => {
      window.location.href = `detail.html?id=${response.data._id}`;
    }, 2000);
  } catch (error) {
    console.error("Create post error:", error);
    Utils.showToast("Đăng bài thất bại: " + error.message, "error");
  } finally {
    Utils.hideLoading(submitBtn);
  }
}

// =============================================================================
// Form Validation
// =============================================================================
function validateForm() {
  let isValid = true;

  // Clear previous errors
  document.querySelectorAll(".is-invalid").forEach((element) => {
    element.classList.remove("is-invalid");
  });

  // Validate title
  const title = document.getElementById("postTitle");
  if (!title.value.trim() || title.value.trim().length < 10) {
    showFieldError(title, "Tiêu đề phải có ít nhất 10 ký tự");
    isValid = false;
  }

  // Validate category
  const category = document.getElementById("postCategory");
  if (!category.value) {
    showFieldError(category, "Vui lòng chọn danh mục");
    isValid = false;
  }

  // Validate price
  const price = document.getElementById("postPrice");
  if (!price.value || parseInt(price.value) < 1000) {
    showFieldError(price, "Giá phải từ 1.000 VNĐ trở lên");
    isValid = false;
  }

  // Validate description
  const description = document.getElementById("postDescription");
  if (!description.value.trim() || description.value.trim().length < 20) {
    showFieldError(description, "Mô tả phải có ít nhất 20 ký tự");
    isValid = false;
  }

  // Validate images
  const images = document.getElementById("postImages");
  if (!images.files.length) {
    showFieldError(images, "Vui lòng chọn ít nhất 1 hình ảnh");
    isValid = false;
  } else {
    // Check file size (max 5MB per file)
    for (let i = 0; i < images.files.length; i++) {
      if (images.files[i].size > 5 * 1024 * 1024) {
        showFieldError(images, `File ${images.files[i].name} vượt quá 5MB`);
        isValid = false;
        break;
      }
    }
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

// =============================================================================
// Image Preview
// =============================================================================
function handleImagePreview(e) {
  const files = e.target.files;
  const preview = document.getElementById("imagePreview");

  // Clear previous preview
  preview.innerHTML = "";

  if (files.length === 0) return;

  const previewContainer = document.createElement("div");
  previewContainer.className = "row";

  for (let i = 0; i < Math.min(files.length, 6); i++) {
    const file = files[i];

    if (!file.type.startsWith("image/")) continue;

    const reader = new FileReader();
    reader.onload = function (e) {
      const col = document.createElement("div");
      col.className = "col-md-2 col-4 mb-2";
      col.innerHTML = `
        <div class="position-relative">
          <img src="${e.target.result}" class="img-fluid rounded" style="height: 80px; object-fit: cover; width: 100%;">
          <button type="button" class="btn btn-danger btn-sm position-absolute" style="top: -5px; right: -5px; width: 20px; height: 20px; padding: 0; border-radius: 50%;" onclick="removeImage(${i})">
            <i class="fas fa-times" style="font-size: 10px;"></i>
          </button>
        </div>
      `;
      previewContainer.appendChild(col);
    };
    reader.readAsDataURL(file);
  }

  preview.appendChild(previewContainer);

  // Show file count
  if (files.length > 0) {
    const countInfo = document.createElement("small");
    countInfo.className = "text-muted mt-2 d-block";
    countInfo.textContent = `Đã chọn ${files.length} ảnh${
      files.length > 6 ? " (hiển thị 6 ảnh đầu)" : ""
    }`;
    preview.appendChild(countInfo);
  }
}

function removeImage(index) {
  const imageInput = document.getElementById("postImages");
  const dt = new DataTransfer();

  // Add all files except the one at index
  for (let i = 0; i < imageInput.files.length; i++) {
    if (i !== index) {
      dt.items.add(imageInput.files[i]);
    }
  }

  // Update input files
  imageInput.files = dt.files;

  // Refresh preview
  handleImagePreview({ target: imageInput });
}

// =============================================================================
// Utility Functions
// =============================================================================
function formatPrice() {
  const priceInput = document.getElementById("postPrice");
  priceInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/[^0-9]/g, "");
    if (value) {
      value = parseInt(value).toLocaleString("vi-VN");
    }
    // Note: We'll store the actual number value, this is just for display
  });
}

// Initialize price formatting
document.addEventListener("DOMContentLoaded", formatPrice);
