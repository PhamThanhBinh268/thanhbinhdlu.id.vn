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
    
    // Test API connectivity
    await testApiConnectivity();
    
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

// Test API connectivity
async function testApiConnectivity() {
  try {
    
    // Test basic connectivity
    const response = await fetch(API_CONFIG.BASE_URL.replace('/api', '') + '/');
    
    if (response.ok) {
    } else {
    }
  } catch (error) {
    console.error("❌ API connectivity test failed:", error);
    Utils.showToast("Không thể kết nối đến server. Một số tính năng có thể không hoạt động.", "warning");
  }
}

// =============================================================================
// Load Categories
// =============================================================================
async function loadCategories() {
  const categorySelect = document.getElementById("postCategory");
  
  try {
    const response = await ApiService.get(API_CONFIG.ENDPOINTS.CATEGORIES);

    // Xử lý cả hai trường hợp response structure
    const categories = response.categories || response.data || response;
    
    if (Array.isArray(categories) && categories.length > 0) {
      // Chỉ thay thế options khi API trả về dữ liệu hợp lệ
      categorySelect.innerHTML = '<option value="">-- Chọn danh mục --</option>';
      
      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category._id;
        option.textContent = category.tenDanhMuc;
        categorySelect.appendChild(option);
      });
      
      // Hiển thị thông báo thành công
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(`Đã tải ${categories.length} danh mục từ server`, "success");
      }
      return;
    } else {
      throw new Error("Không có danh mục nào được trả về từ API");
    }
  } catch (error) {
    console.error("❌ Load categories error:", error);
    // Thông báo lỗi tải danh mục (không còn dùng danh mục mặc định trong HTML)
    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast("Không thể tải danh mục từ server. Vui lòng thử lại.", "warning");
    }
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
  const postType = document.getElementById("postType");
  const originalPriceInput = document.getElementById("originalPrice");
  const discountPercentInput = document.getElementById("discountPercent");
  const postPriceInput = document.getElementById("postPrice");

  // Form submit handler
  form.addEventListener("submit", handleFormSubmit);

  // Image preview handler
  imageInput.addEventListener("change", handleImagePreview);
  
  // NEW C2C: Toggle discount fields visibility based on post type
  if (postType) {
    postType.addEventListener("change", () => {
      const isSelling = postType.value === "ban";
      const discountGroup = document.getElementById("discountGroup");
      const discountPercentGroup = document.getElementById("discountPercentGroup");
      
      if (discountGroup) discountGroup.style.display = isSelling ? "block" : "none";
      if (discountPercentGroup) discountPercentGroup.style.display = isSelling ? "block" : "none";
      
      // Clear discount fields when switching away from "ban"
      if (!isSelling) {
        if (originalPriceInput) originalPriceInput.value = "";
        if (discountPercentInput) discountPercentInput.value = "";
      }
    });
    
    // Trigger on load
    postType.dispatchEvent(new Event("change"));
  }
  
  // NEW C2C: Auto-calculate final price from original price + discount %
  const updateFinalPrice = () => {
    if (!originalPriceInput || !discountPercentInput || !postPriceInput) return;
    
    const rawOriginal = (originalPriceInput.value || '').replace(/[^0-9]/g, '');
    const originalPrice = parseInt(rawOriginal, 10);
    const discountPercent = parseInt(discountPercentInput.value, 10);
    
    if (originalPrice > 0 && discountPercent >= 0 && discountPercent <= 100) {
      const finalPrice = Math.round(originalPrice * (100 - discountPercent) / 100);
      postPriceInput.value = finalPrice.toLocaleString('vi-VN');
      
      // Update hint with preview
      const hint = document.getElementById("discountHint");
      if (hint) {
        hint.innerHTML = `
          <strong>Giá gốc:</strong> ${originalPrice.toLocaleString('vi-VN')}đ<br>
          <strong>Giảm ${discountPercent}%:</strong> ${finalPrice.toLocaleString('vi-VN')}đ
        `;
        hint.classList.remove("text-muted");
        hint.classList.add("text-success");
      }
    } else {
      const hint = document.getElementById("discountHint");
      if (hint) {
        hint.textContent = "Nhập % giảm giá (0-100).";
        hint.classList.remove("text-success");
        hint.classList.add("text-muted");
      }
    }
  };
  
  if (originalPriceInput) originalPriceInput.addEventListener("input", updateFinalPrice);
  if (discountPercentInput) discountPercentInput.addEventListener("input", updateFinalPrice);
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

    // Check if user is logged in
    if (!AuthManager.isLoggedIn()) {
      Utils.showToast("Bạn cần đăng nhập để đăng bài", "warning");
      return;
    }

    // Prepare form data
    const formData = new FormData();
    const form = e.target;

  // Add text fields
  formData.append("tieuDe", form.tieuDe.value.trim());
  formData.append("moTa", form.moTa.value.trim());
  // price: only required for 'ban', otherwise set 0
  const loai = form.loaiGia.value;
  const rawGia = (form.gia && form.gia.value) ? String(form.gia.value).replace(/[^0-9]/g,'') : '';
  const giaNumber = loai === 'ban' ? (parseInt(rawGia, 10) || 0) : 0;
  formData.append("gia", giaNumber);
  
  // NEW C2C: Add seller discount fields (giaGoc, tyLeGiamGia)
  if (loai === 'ban') {
    const rawGiaGoc = (form.giaGoc && form.giaGoc.value) ? String(form.giaGoc.value).replace(/[^0-9]/g,'') : '';
    const giaGocNumber = parseInt(rawGiaGoc, 10) || 0;
    if (giaGocNumber > 0) {
      formData.append("giaGoc", giaGocNumber);
    }
    
    const tyLeGiamGia = (form.tyLeGiamGia && form.tyLeGiamGia.value) ? parseInt(form.tyLeGiamGia.value, 10) : 0;
    if (tyLeGiamGia > 0) {
      formData.append("tyLeGiamGia", tyLeGiamGia);
    }
  }
  
  formData.append("danhMuc", form.danhMuc.value);
  formData.append("tinhTrang", form.tinhTrang.value);
  formData.append("loaiGia", form.loaiGia.value);

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
      formData.append("hinhAnh", imageFiles[i]);
    }

    // Submit form
    
    try {
      const response = await ApiService.uploadFile(
        API_CONFIG.ENDPOINTS.POSTS,
        formData
      );
      Utils.showToast("Đăng bài thành công!", "success");

      // Redirect to post detail
      if (response.data && response.data._id) {
        setTimeout(() => {
          window.location.href = `detail.html?id=${response.data._id}`;
        }, 2000);
      } else {
      }
    } catch (apiError) {
      
      // Fallback: Save to localStorage for demo purposes
      const postData = {
        id: Date.now().toString(),
        tieuDe: form.tieuDe.value.trim(),
        moTa: form.moTa.value.trim(),
        gia: giaNumber,
        danhMuc: form.danhMuc.value,
        tinhTrang: form.tinhTrang.value,
        diaDiem: form.diaDiem.value.trim(),
        tags: form.tags.value.trim(),
        createdAt: new Date().toISOString(),
        author: AuthManager.getUser()?.hoTen || "Demo User"
      };
      
      // Save to localStorage
      const savedPosts = JSON.parse(localStorage.getItem('demo_posts') || '[]');
      savedPosts.push(postData);
      localStorage.setItem('demo_posts', JSON.stringify(savedPosts));
      Utils.showToast("Đăng bài thành công (chế độ demo - server chưa chạy)!", "success");
      
      // Clear form
      form.reset();
      
      throw apiError; // Re-throw to be caught by outer catch
    }
    
  } catch (error) {
    console.error("❌ Create post error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack
    });
    
    let errorMessage = "Đăng bài thất bại";
    if (error.message) {
      errorMessage += ": " + error.message;
    }
    
    Utils.showToast(errorMessage, "error");
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

  // Validate price (only for 'ban')
  const price = document.getElementById("postPrice");
  const type = document.getElementById("postType")?.value || 'ban';
  if (type === 'ban') {
    const raw = (price.value || '').replace(/[^0-9]/g, '');
    const num = parseInt(raw || '0', 10);
    if (!num || num < 1000) {
      showFieldError(price, "Giá phải từ 1.000 VNĐ trở lên");
      isValid = false;
    }
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

// =============================================================================
// Extra helpers: counters, draft, enhanced previews, location, toggle by type
// =============================================================================
(function(){
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));
  const title = qs('#postTitle');
  const desc = qs('#postDescription');
  const price = qs('#postPrice');
  const postType = qs('#postType');
  const expectedGroupId = 'expectedPriceGroup'; // not present by default — safe
  const images = qs('#postImages');
  const imagePreviews = qs('#imagePreviews') || qs('#imagePreview');
  const fillLocationBtn = qs('#fillLocationBtn');
  const saveDraftBtn = qs('#saveDraftBtn');

  function safeText(v){ return (v||'').toString(); }

  // Counters
  function updateCounters(){
    const tc = qs('#titleCounter'); if (tc && title) tc.textContent = `${safeText(title.value).length}/100`;
    const dc = qs('#descCounter'); if (dc && desc) dc.textContent = `${safeText(desc.value).length}/2000`;
  }

  // Format numeric input to VND display but keep raw digits when submitting
  function formatNumericInput(el){
    if (!el) return;
    const raw = el.value.replace(/[^0-9]/g,'');
    el.value = raw ? Number(raw).toLocaleString('vi-VN') : '';
  }

  // Toggle fields based on type
  function toggleByType(){
    if (!postType) return;
    const type = postType.value;
    // If trao-doi: hide price and show expectedPriceGroup if exists
    if (type === 'trao-doi'){
      if (price) { price.value=''; price.setAttribute('data-disabled','1'); price.closest('.form-group').classList.add('d-none'); }
      const ex = document.getElementById(expectedGroupId); if (ex) ex.classList.remove('d-none');
    } else if (type === 'cho-mien-phi'){
      if (price) { price.value=''; price.setAttribute('data-disabled','1'); price.closest('.form-group').classList.add('d-none'); }
      const ex = document.getElementById(expectedGroupId); if (ex) ex.classList.add('d-none');
    } else {
      if (price) { price.removeAttribute('data-disabled'); price.closest('.form-group').classList.remove('d-none'); }
      const ex = document.getElementById(expectedGroupId); if (ex) ex.classList.add('d-none');
    }
  }

  // Enhanced previews (uses existing handleImagePreview fallback)
  function renderPreviews(files){
    if (!imagePreviews) return;
    imagePreviews.innerHTML = '';
    if (!files || files.length === 0) return;
    const max = 10; const maxSize = 5 * 1024 * 1024;
    [...files].slice(0, max).forEach((file, idx)=>{
      if (!file.type.startsWith('image/')) return;
      if (file.size > maxSize) return; // skip too large
      const url = URL.createObjectURL(file);
      const card = document.createElement('div');
      card.className = 'img-thumb mr-2 mb-2';
      card.style.position = 'relative';
      card.style.width = '110px'; card.style.height = '110px';
      card.innerHTML = `
        <img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;display:block;"/>
        <button type="button" class="btn btn-sm btn-light remove-image" style="position:absolute;top:6px;right:6px;">×</button>
      `;
      card.querySelector('.remove-image').addEventListener('click', ()=>{
        const dt = new DataTransfer();
        [...images.files].forEach((f,i)=>{ if (i!==idx) dt.items.add(f); });
        images.files = dt.files; renderPreviews(images.files); handleImagePreview({target: images});
      });
      imagePreviews.appendChild(card);
    });
  }

  // Draft save / restore
  function saveDraft(){
    const draft = {
      tieuDe: title?.value || '',
      moTa: desc?.value || '',
      gia: (price?.value || '').replace(/[^0-9]/g,''),
      loaiGia: postType?.value || '',
      diaDiem: qs('#postAddress')?.value || ''
    };
    try{ localStorage.setItem('createPostDraft', JSON.stringify(draft)); Utils.showToast && Utils.showToast('Đã lưu nháp','success'); }catch(e){}
  }
  function restoreDraft(){
    try{
      const raw = localStorage.getItem('createPostDraft'); if (!raw) return;
      const d = JSON.parse(raw);
      if (d.tieuDe) title.value = d.tieuDe;
      if (d.moTa) desc.value = d.moTa;
      if (d.gia) price.value = Number(d.gia).toLocaleString('vi-VN');
      if (d.loaiGia) postType.value = d.loaiGia;
      if (d.diaDiem) qs('#postAddress').value = d.diaDiem;
      updateCounters(); toggleByType();
    }catch(e){}
  }

  // Location helper
  function fillLocation(){
    if (!navigator.geolocation) { Utils.showToast && Utils.showToast('Trình duyệt không hỗ trợ định vị','warning'); return; }
    navigator.geolocation.getCurrentPosition((pos)=>{
      const lat = pos.coords.latitude.toFixed(6); const lon = pos.coords.longitude.toFixed(6);
      qs('#postAddress').value = `Vị trí: ${lat}, ${lon}`;
      saveDraft();
    }, ()=>{ Utils.showToast && Utils.showToast('Không lấy được vị trí. Vui lòng cho phép truy cập.','warning'); });
  }

  // Event wiring
  try{
    if (title) title.addEventListener('input', updateCounters);
    if (desc) desc.addEventListener('input', updateCounters);
    if (price) price.addEventListener('input', ()=>formatNumericInput(price));
    if (postType) postType.addEventListener('change', toggleByType);
    if (images) images.addEventListener('change', (e)=>{ renderPreviews(e.target.files); handleImagePreview(e); });
    if (fillLocationBtn) fillLocationBtn.addEventListener('click', fillLocation);
    if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveDraft);
    // when form submits successfully (fallback or api), clear draft
    const form = qs('#createPostForm');
    if (form){ form.addEventListener('submit', ()=>{ try{ localStorage.removeItem('createPostDraft'); }catch(_){} }); }
  }catch(e){ }

  // init
  restoreDraft(); updateCounters(); toggleByType();
})();
