// =============================================================================
// Trang Chi Tiết Sản Phẩm - Product Detail Page
// =============================================================================

document.addEventListener("DOMContentLoaded", function () {
  initializeDetailPage();
});

let currentPost = null;
let currentImageIndex = 0;

async function initializeDetailPage() {
  // Lấy ID sản phẩm từ URL
  const postId = Utils.getQueryParam("id");
  if (!postId) {
    Utils.showToast("Không tìm thấy sản phẩm", "error");
    window.location.href = "shop.html";
    return;
  }

  // Setup event listeners
  setupEventListeners();
  
  // Setup realtime update listener
  setupRealtimeListener();

  // Load chi tiết sản phẩm
  await loadProductDetail(postId);

  // Load sản phẩm liên quan
  await loadRelatedProducts();

  // Load đánh giá
  await loadReviews(postId);
}

function setupRealtimeListener() {
  // Lắng nghe sự kiện post cập nhật từ socket
  window.addEventListener('post:updated', (e) => {
    const data = e.detail;
    if (currentPost && data && data.id === currentPost._id) {
      // Reload lại thông tin sản phẩm
      loadProductDetail(currentPost._id);
    }
  });
}

function setupEventListeners() {
  // Contact seller button
  const contactBtn = document.querySelector("#contactSellerBtn");
  if (contactBtn) {
    contactBtn.addEventListener("click", handleContactSeller);
  }

  // Save product button
  const saveBtn = document.querySelector("#saveProductBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveProduct);
  }

  // Report product button
  const reportBtn = document.querySelector("#reportProductBtn");
  if (reportBtn) {
    reportBtn.addEventListener("click", handleReportProduct);
  }

  // Share buttons
  setupShareButtons();

  // Image gallery
  setupImageGallery();

  // Review form
  const reviewForm = document.querySelector("#reviewForm");
  if (reviewForm) {
    reviewForm.addEventListener("submit", handleSubmitReview);
  }

  // Primary action button (dynamic based on loaiGia)
  const primaryBtn = document.querySelector("#primaryActionBtn");
  if (primaryBtn) {
    primaryBtn.addEventListener("click", handlePrimaryAction);
  }
}

async function loadProductDetail(postId) {
  try {
    //showLoadingState();

    const response = await ApiService.get(`/posts/${postId}`);
    currentPost = response.post;

    // Update page content
    updateProductInfo(currentPost);
    updateProductImages(currentPost);
    updateSellerInfo(currentPost);
    updatePageTitle(currentPost);

    hideLoadingState();
  } catch (error) {
    console.error("Error loading product detail:", error);
    Utils.showToast("Không thể tải thông tin sản phẩm", "error");
    hideLoadingState();

    // Redirect về shop sau 3 giây
    setTimeout(() => {
      window.location.href = "shop.html";
    }, 3000);
  }
}

function updateProductInfo(post) {
  // Update basic info
  const titleElement = document.querySelector("#productTitle");
  if (titleElement) titleElement.textContent = post.tieuDe;
  
  // Add highlight class if product is highlighted
  const mainContent = document.querySelector("#mainContent");
  if (mainContent && window.ProductDecorators) {
    if (ProductDecorators.isHighlighted(post)) {
      mainContent.classList.add('product-highlight');
    } else {
      mainContent.classList.remove('product-highlight');
    }
  }

  // Update price with Decorators
  const priceElement = document.querySelector("#productPrice");
  if (priceElement) {
    const basePrice = window.Formatters ? Formatters.getPriceLabel(post.loaiGia, post.gia) : (post.loaiGia === 'cho-mien-phi' ? '<span class="text-success">Miễn phí</span>' : (post.loaiGia === 'trao-doi' ? '<span class="text-primary">Trao đổi</span>' : Utils.formatCurrency(post.gia || 0)));
    const priceWithDiscount = window.ProductDecorators ? ProductDecorators.applyPrice(post, basePrice) : `<h3 class="font-weight-semi-bold mb-4">${basePrice}</h3>`;
    priceElement.innerHTML = priceWithDiscount;
    
    // Add badges (discount, highlight, verified)
    const badges = window.ProductDecorators ? ProductDecorators.renderBadges(post) : '';
    if (badges) {
      priceElement.innerHTML += `<div class="mt-2">${badges}</div>`;
    }
  }

  // Update description
  const descriptionElement = document.querySelector("#productDescription");
  if (descriptionElement) {
    descriptionElement.innerHTML = post.moTa.replace(/\n/g, "<br>");
  }

  // Update condition with Formatters
  const conditionElement = document.querySelector("#productCondition");
  if (conditionElement) {
    const conditionText = window.Formatters ? Formatters.getConditionText(post.tinhTrang) : getConditionText(post.tinhTrang);
    const conditionClass = window.Formatters ? Formatters.getConditionBadgeClass(post.tinhTrang) : getConditionBadgeClass(post.tinhTrang);
    conditionElement.innerHTML = `
            <span class="badge badge-${conditionClass} px-3 py-2">${conditionText}</span>
        `;
  }

  // Update category
  const categoryElement = document.querySelector("#productCategory");
  if (categoryElement && post.danhMuc) {
    categoryElement.innerHTML = `
            <a href="shop.html?category=${post.danhMuc._id}" class="text-primary">
                ${post.danhMuc.tenDanhMuc}
            </a>
        `;
  }

  // Update location with Formatters
  const locationElement = document.querySelector("#productLocation");
  if (locationElement) {
  const where = window.Formatters ? Formatters.getLocation(post) : (post.diaDiem || post.diaChi || '—');
  locationElement.innerHTML = `
      <i class="fas fa-map-marker-alt text-primary mr-2"></i>${where}
    `;
  }

  // Update posted date
  const dateElement = document.querySelector("#productDate");
  if (dateElement) {
    const when = post.createdAt || post.ngayDang || post.updatedAt;
    dateElement.innerHTML = `
            <i class="fas fa-clock text-primary mr-2"></i>Đăng ${Utils.formatRelativeTime(when)}
        `;
  }

  // Update action buttons based on loaiGia
  updateActionButtons(post);
}

function updateActionButtons(post) {
  const primaryBtn = document.querySelector("#primaryActionBtn");
  if (!primaryBtn) return;

  // Update button based on loaiGia
  if (post.loaiGia === 'trao-doi') {
    // Swap/Exchange mode
    primaryBtn.innerHTML = '<i class="fa fa-exchange-alt mr-2"></i>Đề Nghị Trao Đổi';
    primaryBtn.className = 'btn btn-warning px-4 mr-3';
  } else if (post.loaiGia === 'cho-mien-phi') {
    // Free mode
    primaryBtn.innerHTML = '<i class="fa fa-gift mr-2"></i>Nhận Miễn Phí';
    primaryBtn.className = 'btn btn-success px-4 mr-3';
  } else {
    // Buy mode (default)
    primaryBtn.innerHTML = '<i class="fa fa-paper-plane mr-2"></i>Gửi Đề Nghị Mua';
    primaryBtn.className = 'btn btn-success px-4 mr-3';
  }
}

function updateProductImages(post) {
  const mainImageElement = document.querySelector("#mainProductImage");
  const thumbnailsContainer = document.querySelector("#imageThumbnails");

  if (!mainImageElement || !thumbnailsContainer) return;

  if (post.hinhAnh && post.hinhAnh.length > 0) {
    // Set main image
    mainImageElement.src = post.hinhAnh[0];
    mainImageElement.alt = post.tieuDe;

    // Create thumbnails
    let thumbnailsHTML = "";
    post.hinhAnh.forEach((image, index) => {
      const activeClass = index === 0 ? "active" : "";
      thumbnailsHTML += `
                <div class="nav-item">
                    <img src="${image}" 
                         alt="Image ${index + 1}" 
                         class="nav-link thumbnail-image ${activeClass}"
                         data-index="${index}"
                         style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;">
                </div>
            `;
    });

    thumbnailsContainer.innerHTML = thumbnailsHTML;

    // Add click listeners to thumbnails
    thumbnailsContainer
      .querySelectorAll(".thumbnail-image")
      .forEach((thumb) => {
        thumb.addEventListener("click", function () {
          const index = parseInt(this.getAttribute("data-index"));
          changeMainImage(index);
        });
      });
  } else {
    mainImageElement.src = "img/product-placeholder.jpg";
    mainImageElement.alt = "No image available";
    thumbnailsContainer.innerHTML = "";
  }
}

function changeMainImage(index) {
  if (
    !currentPost ||
    !currentPost.hinhAnh ||
    index >= currentPost.hinhAnh.length
  )
    return;

  currentImageIndex = index;
  const mainImageElement = document.querySelector("#mainProductImage");
  const thumbnails = document.querySelectorAll(".thumbnail-image");

  // Update main image
  if (mainImageElement) {
    mainImageElement.src = currentPost.hinhAnh[index];
  }

  // Update active thumbnail
  thumbnails.forEach((thumb, i) => {
    thumb.classList.toggle("active", i === index);
  });
}

function updateSellerInfo(post) {
  if (!post.nguoiDang) return;
  
  const seller = post.nguoiDang;
  
  // Update seller avatar
  const avatarElement = document.querySelector("#sellerAvatar");
  if (avatarElement) {
    const avatar = (seller.avatar && !/via\.placeholder\.com/.test(seller.avatar)) 
      ? seller.avatar 
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.hoTen || 'User')}&background=007bff&color=fff`;
    avatarElement.src = avatar;
    avatarElement.style.display = 'block';
  }
  
  // Update seller name
  const sellerNameElement = document.querySelector("#sellerName");
  if (sellerNameElement) {
    sellerNameElement.textContent = seller.hoTen || 'Người dùng';
  }
  
  // Update seller badges with UserDecorators
  const badgesElement = document.querySelector("#sellerBadges");
  if (badgesElement && window.UserDecorators) {
    const stats = {
      totalPosts: seller.tongSoBaiDang || 0
    };
    const badges = UserDecorators.renderBadges(seller, stats);
    badgesElement.innerHTML = badges;
  }
  
  // Update seller rating
  const sellerRatingElement = document.querySelector("#sellerRating");
  if (sellerRatingElement) {
    const rating = seller.diemUyTin || seller.danhGiaTrungBinh || 0;
    const stars = generateStarsHTML(rating);
    const totalReviews = seller.soLuotDanhGia || seller.tongSoDanhGia || 0;
    sellerRatingElement.innerHTML = `
      <strong class="text-dark mr-3">Đánh giá người bán:</strong>
      <div>${stars} <small class="text-muted">(${totalReviews} đánh giá)</small></div>
    `;
  }
}

function updatePageTitle(post) {
  document.title = `${post.tieuDe} - Thanh Lý Đồ Cũ`;

  // Update breadcrumb
  const breadcrumbItem = document.querySelector(".breadcrumb .active");
  if (breadcrumbItem) {
    breadcrumbItem.textContent = Utils.truncateText(post.tieuDe, 50);
  }
}

async function loadRelatedProducts() {
  try {
    if (!currentPost) return;

    const params = {
      category: currentPost.danhMuc?._id,
      limit: 4,
      exclude: currentPost._id,
    };

    const response = await ApiService.get("/posts/search", params);
    const relatedPosts = response.data.posts;

    displayRelatedProducts(relatedPosts);
  } catch (error) {
    console.error("Error loading related products:", error);
  }
}

function displayRelatedProducts(posts) {
  const container = document.querySelector("#relatedProductsContainer");
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML =
      '<p class="text-center text-muted">Không có sản phẩm liên quan</p>';
    return;
  }

  let html = "";
  posts.forEach((post) => {
    const imageUrl =
      post.hinhAnh && post.hinhAnh.length > 0
        ? post.hinhAnh[0]
        : "img/product-placeholder.jpg";

  let price = '';
  if (post.loaiGia === 'cho-mien-phi') price = '<span class="text-success">Miễn phí</span>';
  else if (post.loaiGia === 'trao-doi') price = '<span class="text-primary">Trao đổi</span>';
  else price = Utils.formatCurrency(post.gia || 0);

    html += `
            <div class="col-lg-3 col-md-4 col-sm-6 pb-1">
                <div class="product-item bg-light mb-4">
                    <div class="product-img position-relative overflow-hidden">
                        <img class="img-fluid w-100" src="${imageUrl}" alt="${
      post.tieuDe
    }">
                        <div class="product-action">
                            <a class="btn btn-outline-dark btn-square" href="#" onclick="toggleSavePost('${
                              post._id
                            }', event)">
                                <i class="far fa-heart"></i>
                            </a>
                            <a class="btn btn-outline-dark btn-square" href="detail.html?id=${
                              post._id
                            }">
                                <i class="fa fa-eye"></i>
                            </a>
                        </div>
                    </div>
                    <div class="text-center py-4">
                        <a class="h6 text-decoration-none text-truncate" href="detail.html?id=${
                          post._id
                        }">
                            ${Utils.truncateText(post.tieuDe, 40)}
                        </a>
                        <div class="d-flex align-items-center justify-content-center mt-2">
                            <h5 class="text-primary mb-0">${price}</h5>
                        </div>
                        <small class="text-muted">
                            <i class="fas fa-map-marker-alt mr-1"></i>${post.diaDiem || post.diaChi || ''}
                        </small>
                    </div>
                </div>
            </div>
        `;
  });

  container.innerHTML = html;
}

async function loadReviews(postId) {
  try {
    // Load reviews for the SELLER, not the post
    if (!currentPost || !currentPost.nguoiDang || !currentPost.nguoiDang._id) {
      return;
    }

    const sellerId = currentPost.nguoiDang._id;
    const response = await ApiService.get(`/users/${sellerId}/ratings`);
    const reviews = response.ratings || [];

    displayReviews(reviews);
  } catch (error) {
    console.error("Error loading seller reviews:", error);
    // Show empty state if error
    const container = document.querySelector("#reviewsContainer");
    if (container) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-comment-slash fa-3x text-muted mb-3"></i>
          <p class="text-muted">Chưa có đánh giá nào cho người bán này</p>
        </div>
      `;
    }
  }
}

function displayReviews(reviews) {
  const container = document.querySelector("#reviewsContainer");
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-comment-slash fa-3x text-muted mb-3"></i>
                <p class="text-muted">Chưa có đánh giá nào cho người bán này</p>
                <small class="text-muted">Hãy là người đầu tiên đánh giá người bán này!</small>
            </div>
        `;
    return;
  }

  let html = "";
  reviews.forEach((review) => {
    // Rating model fields: soSao, binhLuan, tuNguoiDung, createdAt
    const stars = generateStarsHTML(review.soSao || review.diemDanhGia || 0);
    const date = Utils.formatDateTime(review.createdAt || review.ngayDanhGia);
    const avatar = review.tuNguoiDung?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.tuNguoiDung?.hoTen || 'User')}&background=007bff&color=fff`;
    const userName = review.tuNguoiDung?.hoTen || 'Người dùng';
    const comment = review.binhLuan || review.nhanXet || '';

    html += `
            <div class="media mb-4 border-bottom pb-3">
                <img class="mr-3 rounded-circle" src="${avatar}" alt="${userName}" style="width: 50px; height: 50px; object-fit: cover;">
                <div class="media-body">
                    <h6 class="mb-1">${userName} 
                        <small class="text-muted font-weight-normal"> - ${date}</small>
                    </h6>
                    <div class="text-primary mb-2">${stars}</div>
                    ${comment ? `<p class="mb-0">${comment}</p>` : '<p class="mb-0 text-muted font-italic">Không có nhận xét</p>'}
                </div>
            </div>
        `;
  });

  container.innerHTML = html;
}

// Event Handlers
function handleContactSeller() {
  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Vui lòng đăng nhập để liên hệ người bán", "warning");
    window.location.href = `login.html?returnUrl=${encodeURIComponent(
      window.location.href
    )}`;
    return;
  }

  if (!currentPost) return;

  // Redirect to messages page with seller ID
  window.location.href = `messages.html?user=${currentPost.nguoiDang._id}`;
}

async function handleSaveProduct() {
  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Vui lòng đăng nhập để lưu sản phẩm", "warning");
    return;
  }

  if (!currentPost) return;

  try {
    const saveBtn = document.querySelector("#saveProductBtn");
    const icon = saveBtn.querySelector("i");

    if (icon.classList.contains("fas")) {
      // Unsave
      await ApiService.delete(`/posts/${currentPost._id}/save`);
      icon.classList.remove("fas");
      icon.classList.add("far");
      Utils.showToast("Đã bỏ lưu sản phẩm", "info");
    } else {
      // Save
      await ApiService.post(`/posts/${currentPost._id}/save`);
      icon.classList.remove("far");
      icon.classList.add("fas");
      Utils.showToast("Đã lưu sản phẩm", "success");
    }
  } catch (error) {
    Utils.showToast("Không thể thực hiện thao tác: " + error.message, "error");
  }
}

function handleReportProduct() {
  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Vui lòng đăng nhập để báo cáo", "warning");
    return;
  }

  // Show report modal
  showReportModal();
}

function handleMakeOffer() {
  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Vui lòng đăng nhập để đưa ra đề xuất", "warning");
    return;
  }

  if (!currentPost) return;

  // Show offer modal
  showOfferModal();
}

// Primary action handler (dynamic based on loaiGia)
function handlePrimaryAction() {
  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Vui lòng đăng nhập để tiếp tục", "warning");
    window.location.href = `login.html?returnUrl=${encodeURIComponent(window.location.href)}`;
    return;
  }

  if (!currentPost) {
    Utils.showToast("Không tìm thấy thông tin sản phẩm", "error");
    return;
  }

  // Check if trying to interact with own post
  const currentUser = AuthManager.getUser();
  if (currentUser && currentPost.nguoiDang._id === currentUser._id) {
    Utils.showToast("Bạn không thể thực hiện giao dịch với sản phẩm của chính mình", "warning");
    return;
  }

  // Route to appropriate handler based on loaiGia
  if (currentPost.loaiGia === 'trao-doi') {
    handleProposeSwap();
  } else if (currentPost.loaiGia === 'cho-mien-phi') {
    handleRequestFree();
  } else {
    handleSendBuyProposal();
  }
}

// Handler for Buy proposals (loaiGia: 'ban')
function handleSendBuyProposal() {
  if (!currentPost.gia || currentPost.gia <= 0) {
    Utils.showToast("Sản phẩm này không có giá bán cố định", "warning");
    return;
  }

  // Show buy proposal modal
  showBuyProposalModal();
}

// Handler for Swap proposals (loaiGia: 'trao-doi')
function handleProposeSwap() {
  // Show swap proposal modal
  showSwapProposalModal();
}

// Handler for Free requests (loaiGia: 'cho-mien-phi')
function handleRequestFree() {
  // Show free request modal
  showFreeRequestModal();
}

function addToCart() {
  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Vui lòng đăng nhập để thêm vào giỏ hàng", "warning");
    return;
  }
  if (!currentPost) return;
  const cartKey = 'cartItems';
  const image = currentPost.hinhAnh && currentPost.hinhAnh[0] ? currentPost.hinhAnh[0] : null;
  let items = [];
  try { items = JSON.parse(localStorage.getItem(cartKey) || '[]'); } catch(_) { items = []; }
  const exist = items.find(i => i.id === currentPost._id);
  if (exist) {
    exist.qty = (exist.qty || 1) + 1;
  } else {
    items.push({
      id: currentPost._id,
      title: currentPost.tieuDe,
      price: Number(currentPost.gia) || 0,
      image,
      sellerId: currentPost.nguoiDang?._id,
      qty: 1
    });
  }
  localStorage.setItem(cartKey, JSON.stringify(items));
  Utils.showToast("Đã thêm vào giỏ hàng", "success");
  try { window.dispatchEvent(new Event('cart:updated')); } catch(_) {}
}

async function handleSubmitReview(e) {
  e.preventDefault();

  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Vui lòng đăng nhập để đánh giá", "warning");
    return;
  }

  if (!currentPost || !currentPost.nguoiDang || !currentPost.nguoiDang._id) {
    Utils.showToast("Không tìm thấy thông tin người bán", "error");
    return;
  }

  const rating = document.querySelector('input[name="rating"]:checked')?.value;
  const comment = document.querySelector("#reviewComment").value.trim();

  if (!rating) {
    Utils.showToast("Vui lòng chọn số sao đánh giá", "error");
    return;
  }

  // Prevent reviewing yourself
  const currentUser = AuthManager.getUser();
  if (currentUser && currentPost.nguoiDang._id === currentUser._id) {
    Utils.showToast("Bạn không thể đánh giá chính mình", "warning");
    return;
  }

  try {
    const reviewData = {
      diemDanhGia: parseInt(rating),
      nhanXet: comment,
    };

    // Submit rating to the seller via users/:id/ratings API
    const response = await ApiService.post(`/users/${currentPost.nguoiDang._id}/ratings`, reviewData);

    Utils.showToast("Đánh giá người bán đã được gửi thành công", "success");

    // Reset form
    document.querySelector("#reviewForm").reset();

    // Reload reviews to show the new one
    await loadReviews(currentPost._id);
    
    // Reload seller info to update rating stats (realtime update)
    await reloadSellerRating();
    
    // Scroll to reviews section
    const reviewsContainer = document.querySelector("#reviewsContainer");
    if (reviewsContainer) {
      reviewsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } catch (error) {
    console.error("Submit review error:", error);
    Utils.showToast("Không thể gửi đánh giá: " + (error.message || "Lỗi không xác định"), "error");
  }
}

// Function to reload seller rating stats realtime
async function reloadSellerRating() {
  try {
    if (!currentPost || !currentPost.nguoiDang || !currentPost.nguoiDang._id) {
      return;
    }

    // Fetch updated seller info
    const response = await ApiService.get(`/users/${currentPost.nguoiDang._id}`);
    const updatedSeller = response.user || response.data;

    // Update currentPost with new seller data
    currentPost.nguoiDang = updatedSeller;

    // Update seller info display with new rating
    updateSellerInfo(currentPost);
  } catch (error) {
    console.error("Error reloading seller rating:", error);
  }
}

// Helper Functions
function generateStarsHTML(rating) {
  let html = "";
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    html += '<small class="fas fa-star text-primary mr-1"></small>';
  }

  // Half star
  if (hasHalfStar) {
    html += '<small class="fas fa-star-half-alt text-primary mr-1"></small>';
  }

  // Empty stars
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    html += '<small class="far fa-star text-primary mr-1"></small>';
  }

  return html;
}

function setupImageGallery() {
  // Previous/Next buttons for main image
  const prevBtn = document.querySelector("#prevImageBtn");
  const nextBtn = document.querySelector("#nextImageBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPost && currentPost.hinhAnh && currentImageIndex > 0) {
        changeMainImage(currentImageIndex - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (
        currentPost &&
        currentPost.hinhAnh &&
        currentImageIndex < currentPost.hinhAnh.length - 1
      ) {
        changeMainImage(currentImageIndex + 1);
      }
    });
  }
}

function setupShareButtons() {
  const shareButtons = document.querySelectorAll(".share-btn");
  shareButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      const platform = this.getAttribute("data-platform");
      shareProduct(platform);
    });
  });
}

function shareProduct(platform) {
  if (!currentPost) return;

  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(currentPost.tieuDe);
  const description = encodeURIComponent(
    Utils.truncateText(currentPost.moTa, 100)
  );

  let shareUrl = "";

  switch (platform) {
    case "facebook":
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      break;
    case "twitter":
      shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
      break;
    case "zalo":
      shareUrl = `https://zalo.me/share?url=${url}`;
      break;
    case "copy":
      navigator.clipboard.writeText(window.location.href);
      Utils.showToast("Đã sao chép liên kết", "success");
      return;
  }

  if (shareUrl) {
    window.open(shareUrl, "_blank", "width=600,height=400");
  }
}

function showReportModal() {
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Báo cáo sản phẩm</h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="reportForm">
                        <div class="form-group">
                            <label>Lý do báo cáo:</label>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="reason" id="spam" value="spam">
                                <label class="form-check-label" for="spam">Spam hoặc quảng cáo</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="reason" id="fake" value="fake">
                                <label class="form-check-label" for="fake">Thông tin giả mạo</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="reason" id="inappropriate" value="inappropriate">
                                <label class="form-check-label" for="inappropriate">Nội dung không phù hợp</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="reason" id="other" value="other">
                                <label class="form-check-label" for="other">Khác</label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="reportDetail">Chi tiết (tùy chọn):</label>
                            <textarea class="form-control" id="reportDetail" rows="3" placeholder="Mô tả thêm về vấn đề..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Hủy</button>
                    <button type="button" class="btn btn-danger" onclick="submitReport()">Gửi báo cáo</button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
  $(modal).modal("show");

  $(modal).on("hidden.bs.modal", function () {
    modal.remove();
  });
}

function showOfferModal() {
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Đưa ra đề xuất</h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="offerForm">
                        <div class="form-group">
                            <label>Loại đề xuất:</label>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="offerType" id="buyOffer" value="buy">
                                <label class="form-check-label" for="buyOffer">Mua với giá đề xuất</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="offerType" id="exchangeOffer" value="exchange">
                                <label class="form-check-label" for="exchangeOffer">Trao đổi</label>
                            </div>
                        </div>
                        <div class="form-group" id="priceOfferGroup">
                            <label for="offerPrice">Giá đề xuất (VNĐ):</label>
                            <input type="number" class="form-control" id="offerPrice" min="0">
                        </div>
                        <div class="form-group" id="exchangeOfferGroup" style="display: none;">
                            <label for="exchangeItem">Sản phẩm muốn trao đổi:</label>
                            <textarea class="form-control" id="exchangeItem" rows="3" placeholder="Mô tả sản phẩm bạn muốn trao đổi..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="offerNote">Ghi chú thêm:</label>
                            <textarea class="form-control" id="offerNote" rows="2" placeholder="Thêm ghi chú cho đề xuất..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Hủy</button>
                    <button type="button" class="btn btn-primary" onclick="submitOffer()">Gửi đề xuất</button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(modal);
  $(modal).modal("show");

  // Toggle price/exchange fields
  $(modal)
    .find('input[name="offerType"]')
    .change(function () {
      const priceGroup = $(modal).find("#priceOfferGroup");
      const exchangeGroup = $(modal).find("#exchangeOfferGroup");

      if (this.value === "buy") {
        priceGroup.show();
        exchangeGroup.hide();
      } else {
        priceGroup.hide();
        exchangeGroup.show();
      }
    });

  $(modal).on("hidden.bs.modal", function () {
    modal.remove();
  });
}

async function submitReport() {
  const reason = document.querySelector('input[name="reason"]:checked')?.value;
  const detail = document.querySelector("#reportDetail").value.trim();

  if (!reason) {
    Utils.showToast("Vui lòng chọn lý do báo cáo", "error");
    return;
  }

  try {
    // Implement report API call here
    Utils.showToast("Báo cáo đã được gửi. Cảm ơn bạn!", "success");
    $(".modal").modal("hide");
  } catch (error) {
    Utils.showToast("Không thể gửi báo cáo: " + error.message, "error");
  }
}

// Modal with Tabs for Buy/Swap/Free Proposals
function showBuyProposalModal() {
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "proposalModal";
  
  // Determine which tabs to show based on loaiGia
  const loaiGia = currentPost.loaiGia || 'ban';
  const canBuy = loaiGia === 'ban' || loaiGia === 'trao-doi';
  const canSwap = loaiGia === 'ban' || loaiGia === 'trao-doi';
  const canFree = loaiGia === 'cho-mien-phi';
  
  // Determine default active tab
  let defaultTab = 'buyTab';
  if (!canBuy && canFree) defaultTab = 'freeTab';
  
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title"><i class="fa fa-handshake mr-2"></i>Gửi Đề Nghị Giao Dịch</h5>
          <button type="button" class="close text-white" data-dismiss="modal">
            <span>&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <!-- Product Info -->
          <div class="card mb-3">
            <div class="card-body py-2">
              <div class="d-flex align-items-center">
                <img src="${currentPost.hinhAnh && currentPost.hinhAnh[0] ? currentPost.hinhAnh[0] : 'img/product-placeholder.jpg'}" 
                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" class="mr-3">
                <div>
                  <h6 class="mb-1 font-weight-bold">${Utils.escapeHtml(currentPost.tieuDe)}</h6>
                  <p class="text-primary mb-0"><strong>Giá niêm yết: ${Utils.formatCurrency(currentPost.gia)}</strong></p>
                  <small class="badge badge-${loaiGia === 'ban' ? 'success' : loaiGia === 'trao-doi' ? 'warning' : 'info'}">${loaiGia === 'ban' ? 'Bán' : loaiGia === 'trao-doi' ? 'Trao Đổi' : 'Cho Miễn Phí'}</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <ul class="nav nav-tabs mb-3" id="proposalTabs" role="tablist">
            ${canBuy ? `
            <li class="nav-item">
              <a class="nav-link ${defaultTab === 'buyTab' ? 'active' : ''}" id="buy-tab" data-toggle="tab" href="#buyTab" role="tab">
                <i class="fa fa-shopping-cart mr-1"></i>Mua
              </a>
            </li>
            ` : ''}
            ${canSwap ? `
            <li class="nav-item">
              <a class="nav-link ${!canBuy && defaultTab === 'swapTab' ? 'active' : ''}" id="swap-tab" data-toggle="tab" href="#swapTab" role="tab">
                <i class="fa fa-exchange-alt mr-1"></i>Trao Đổi
              </a>
            </li>
            ` : ''}
            ${canFree ? `
            <li class="nav-item">
              <a class="nav-link ${defaultTab === 'freeTab' ? 'active' : ''}" id="free-tab" data-toggle="tab" href="#freeTab" role="tab">
                <i class="fa fa-gift mr-1"></i>Nhận Miễn Phí
              </a>
            </li>
            ` : ''}
          </ul>

          <!-- Tab Content -->
          <div class="tab-content" id="proposalTabsContent">
            <!-- Buy Tab -->
            ${canBuy ? `
            <div class="tab-pane fade ${defaultTab === 'buyTab' ? 'show active' : ''}" id="buyTab" role="tabpanel">
              <form id="buyProposalForm">
                <!-- SECTION 1: GIÁ VÀ LỜI NHẮN -->
                <div class="card mb-3">
                  <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fa fa-money-bill-wave mr-2"></i>Thông Tin Đề Xuất</h6>
                  </div>
                  <div class="card-body">
                    <div class="form-group">
                      <label for="offerPrice">Giá đề xuất (VNĐ): <span class="text-danger">*</span></label>
                      <input type="number" class="form-control" id="offerPrice" 
                             value="${currentPost.gia}" min="0" required>
                      <small class="form-text text-muted">Bạn có thể đề xuất giá khác hoặc giữ nguyên giá niêm yết</small>
                    </div>
                    <div class="form-group mb-0">
                      <label for="buyMessage">Lời nhắn cho người bán:</label>
                      <textarea class="form-control" id="buyMessage" rows="2" 
                                placeholder="Xin chào, tôi quan tâm đến sản phẩm của bạn..."></textarea>
                    </div>
                  </div>
                </div>

                <!-- SECTION 2: PHƯƠNG THỨC THANH TOÁN -->
                <div class="card mb-3">
                  <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fa fa-credit-card mr-2"></i>Phương Thức Thanh Toán</h6>
                  </div>
                  <div class="card-body">
                    <div class="form-group">
                      <label>Chọn phương thức thanh toán: <span class="text-danger">*</span></label>
                      <select class="form-control" id="buyPaymentMethod" required>
                        <option value="">-- Chọn --</option>
                        <option value="tien-mat">💵 Tiền mặt (khi gặp trực tiếp)</option>
                        <option value="chuyen-khoan">🏦 Chuyển khoản ngân hàng</option>
                        <option value="momo">📱 Momo</option>
                        <option value="zalopay">💳 ZaloPay</option>
                      </select>
                      <small class="form-text text-muted">Người bán sẽ xem và quyết định có đồng ý không</small>
                    </div>

                    <!-- Bank Info Section -->
                    <div id="buyBankInfo" class="d-none">
                      <hr>
                      <p class="text-muted small mb-2"><i class="fa fa-info-circle"></i> Thông tin tài khoản của người bán sẽ được cung cấp sau khi họ đồng ý</p>
                    </div>

                    <!-- Momo Info Section -->
                    <div id="buyMomoInfo" class="d-none">
                      <hr>
                      <p class="text-muted small mb-2"><i class="fa fa-info-circle"></i> Số điện thoại Momo của người bán sẽ được cung cấp sau khi họ đồng ý</p>
                    </div>

                    <!-- ZaloPay Info Section -->
                    <div id="buyZaloInfo" class="d-none">
                      <hr>
                      <p class="text-muted small mb-2"><i class="fa fa-info-circle"></i> Số điện thoại ZaloPay của người bán sẽ được cung cấp sau khi họ đồng ý</p>
                    </div>
                  </div>
                </div>

                <!-- SECTION 3: HÌNH THỨC GIAO HÀNG -->
                <div class="card mb-3">
                  <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fa fa-truck mr-2"></i>Hình Thức Giao Hàng</h6>
                  </div>
                  <div class="card-body">
                    <div class="form-group">
                      <label>Chọn hình thức giao hàng: <span class="text-danger">*</span></label>
                      <div class="custom-control custom-radio">
                        <input type="radio" class="custom-control-input" id="buyMeetInPerson" 
                               name="buyShippingMethod" value="gap-truc-tiep" checked>
                        <label class="custom-control-label" for="buyMeetInPerson">
                          🤝 Gặp trực tiếp (giao tận tay)
                        </label>
                      </div>
                      <div class="custom-control custom-radio">
                        <input type="radio" class="custom-control-input" id="buyDelivery" 
                               name="buyShippingMethod" value="giao-hang-tan-noi">
                        <label class="custom-control-label" for="buyDelivery">
                          📦 Giao hàng tận nơi (qua đơn vị vận chuyển)
                        </label>
                      </div>
                    </div>

                    <!-- Meeting Location Section -->
                    <div id="buyMeetingLocation">
                      <hr>
                      <div class="form-group mb-0">
                        <label>Địa điểm đề xuất gặp: <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="buyMeetingPlace" 
                               placeholder="VD: Cafe Highlands Nguyễn Huệ, Q1, TP.HCM">
                        <small class="form-text text-muted">Đề xuất địa điểm thuận tiện để gặp người bán</small>
                      </div>
                    </div>

                    <!-- Delivery Address Section -->
                    <div id="buyDeliveryAddress" class="d-none">
                      <hr>
                      <h6 class="text-primary mb-3">Địa chỉ nhận hàng của bạn:</h6>
                      <div class="form-row">
                        <div class="form-group col-md-6">
                          <label>Họ tên người nhận: <span class="text-danger">*</span></label>
                          <input type="text" class="form-control" id="buyRecipientName" 
                                 placeholder="VD: Nguyễn Văn A">
                        </div>
                        <div class="form-group col-md-6">
                          <label>Số điện thoại: <span class="text-danger">*</span></label>
                          <input type="tel" class="form-control" id="buyRecipientPhone" 
                                 placeholder="VD: 0912345678">
                        </div>
                      </div>
                      <div class="form-group">
                        <label>Địa chỉ chi tiết: <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="buyAddressDetail" 
                               placeholder="VD: Số 123, Đường ABC">
                      </div>
                      <div class="form-row">
                        <div class="form-group col-md-4">
                          <label>Phường/Xã: <span class="text-danger">*</span></label>
                          <input type="text" class="form-control" id="buyWard" placeholder="VD: Phường 1">
                        </div>
                        <div class="form-group col-md-4">
                          <label>Quận/Huyện: <span class="text-danger">*</span></label>
                          <input type="text" class="form-control" id="buyDistrict" placeholder="VD: Quận 1">
                        </div>
                        <div class="form-group col-md-4">
                          <label>Tỉnh/TP: <span class="text-danger">*</span></label>
                          <input type="text" class="form-control" id="buyCity" placeholder="VD: TP.HCM">
                        </div>
                      </div>
                      <div class="alert alert-info small mb-0">
                        <i class="fa fa-info-circle"></i> Phí ship sẽ được thảo luận với người bán sau khi họ đồng ý
                      </div>
                    </div>
                  </div>
                </div>

                <div class="alert alert-warning mb-0">
                  <i class="fa fa-exclamation-triangle"></i> <strong>Lưu ý:</strong> 
                  Người bán sẽ xem đầy đủ thông tin này trước khi quyết định chấp nhận hay từ chối.
                </div>
              </form>
            </div>
            ` : ''}

            <!-- Swap Tab -->
            ${canSwap ? `
            <div class="tab-pane fade ${!canBuy && defaultTab === 'swapTab' ? 'show active' : ''}" id="swapTab" role="tabpanel">
              <form id="swapProposalForm">
                
                <!-- LAYOUT 2 CỘT: SẢN PHẨM -->
                <div class="row mb-3">
                  <div class="col-md-6">
                    <h6 class="font-weight-bold">Sản phẩm của người bán:</h6>
                    <div class="card">
                      <img src="${currentPost.hinhAnh && currentPost.hinhAnh[0] ? currentPost.hinhAnh[0] : 'img/product-placeholder.jpg'}" 
                           class="card-img-top" style="height: 150px; object-fit: cover;">
                      <div class="card-body">
                        <h6 class="card-title">${Utils.escapeHtml(currentPost.tieuDe)}</h6>
                        <p class="text-muted mb-0"><small>${currentPost.moTa ? Utils.truncateText(currentPost.moTa, 80) : ''}</small></p>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <h6 class="font-weight-bold">Sản phẩm của bạn:</h6>
                    <div id="mySwapProductsContainer" style="max-height: 300px; overflow-y: auto;">
                      <div class="text-center py-3">
                        <div class="spinner-border text-warning" role="status">
                          <span class="sr-only">Đang tải...</span>
                        </div>
                        <p class="text-muted mt-2">Đang tải sản phẩm của bạn...</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- SECTION 1: THÔNG TIN TRAO ĐỔI -->
                <div class="card mb-3">
                  <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fa fa-exchange-alt mr-2"></i>Thông Tin Trao Đổi</h6>
                  </div>
                  <div class="card-body">
                    <input type="hidden" id="selectedSwapProductId" value="">
                    <div class="form-group">
                      <label for="priceDifference">Tiền bù (nếu có):</label>
                      <input type="number" class="form-control" id="priceDifference" 
                             value="0" min="0" placeholder="Nhập số tiền bù nếu cần">
                      <small class="form-text text-muted">Nhập số tiền bạn sẵn sàng bù thêm (VNĐ)</small>
                    </div>
                  </div>
                </div>

                <!-- SECTION 2: PHƯƠNG THỨC THANH TOÁN (nếu có tiền bù) -->
                <div class="card mb-3" id="swapPaymentSection">
                  <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fa fa-credit-card mr-2"></i>Phương Thức Thanh Toán Tiền Bù</h6>
                  </div>
                  <div class="card-body">
                    <div class="form-group mb-0">
                      <label>Chọn phương thức thanh toán tiền bù:</label>
                      <select class="form-control" id="swapPaymentMethod">
                        <option value="khong-can-thanh-toan">Không có tiền bù</option>
                        <option value="tien-mat">💵 Tiền mặt (khi gặp trực tiếp)</option>
                        <option value="chuyen-khoan">🏦 Chuyển khoản ngân hàng</option>
                        <option value="momo">📱 Momo</option>
                        <option value="zalopay">💳 ZaloPay</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- SECTION 3: HÌNH THỨC GIAO HÀNG -->
                <div class="card mb-3">
                  <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fa fa-truck mr-2"></i>Hình Thức Giao Hàng</h6>
                  </div>
                  <div class="card-body">
                    <div class="form-group">
                      <label>Chọn hình thức giao hàng: <span class="text-danger">*</span></label>
                      <div class="custom-control custom-radio">
                        <input type="radio" class="custom-control-input" id="swapMeetInPerson" 
                               name="swapShippingMethod" value="gap-truc-tiep" checked>
                        <label class="custom-control-label" for="swapMeetInPerson">
                          🤝 Gặp trực tiếp (trao đổi tận tay)
                        </label>
                      </div>
                      <div class="custom-control custom-radio">
                        <input type="radio" class="custom-control-input" id="swapDelivery" 
                               name="swapShippingMethod" value="giao-hang-tan-noi">
                        <label class="custom-control-label" for="swapDelivery">
                          📦 Giao hàng tận nơi (qua đơn vị vận chuyển)
                        </label>
                      </div>
                    </div>

                    <!-- Meeting Location Section -->
                    <div id="swapMeetingLocation">
                      <hr>
                      <div class="form-group mb-0">
                        <label>Địa điểm đề xuất gặp: <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="swapMeetingPlace" 
                               placeholder="VD: Cafe Highlands Nguyễn Huệ, Q1, TP.HCM">
                        <small class="form-text text-muted">Đề xuất địa điểm thuận tiện để gặp người bán</small>
                      </div>
                    </div>

                    <!-- Delivery Address Section -->
                    <div id="swapDeliveryAddress" class="d-none">
                      <hr>
                      <h6 class="text-primary mb-3">Địa chỉ nhận hàng của bạn:</h6>
                      <div class="form-row">
                        <div class="form-group col-md-6">
                          <label>Họ tên người nhận: <span class="text-danger">*</span></label>
                          <input type="text" class="form-control" id="swapRecipientName" 
                                 placeholder="VD: Nguyễn Văn A">
                        </div>
                        <div class="form-group col-md-6">
                          <label>Số điện thoại: <span class="text-danger">*</span></label>
                          <input type="tel" class="form-control" id="swapRecipientPhone" 
                                 placeholder="VD: 0912345678">
                        </div>
                      </div>
                      <div class="form-group">
                        <label>Địa chỉ chi tiết: <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="swapAddressDetail" 
                               placeholder="VD: Số 123, Đường ABC">
                      </div>
                      <div class="form-row">
                        <div class="form-group col-md-4">
                          <label>Phường/Xã: <span class="text-danger">*</span></label>
                          <input type="text" class="form-control" id="swapWard" placeholder="VD: Phường 1">
                        </div>
                        <div class="form-group col-md-4">
                          <label>Quận/Huyện: <span class="text-danger">*</span></label>
                          <input type="text" class="form-control" id="swapDistrict" placeholder="VD: Quận 1">
                        </div>
                        <div class="form-group col-md-4">
                          <label>Tỉnh/TP: <span class="text-danger">*</span></label>
                          <input type="text" class="form-control" id="swapCity" placeholder="VD: TP.HCM">
                        </div>
                      </div>
                      <div class="alert alert-info small mb-0">
                        <i class="fa fa-info-circle"></i> Phí ship sẽ được thảo luận với người bán sau khi họ đồng ý
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label for="swapMessage">Lời nhắn:</label>
                  <textarea class="form-control" id="swapMessage" rows="3" 
                            placeholder="Mô tả lý do bạn muốn trao đổi..."></textarea>
                </div>

                <div class="alert alert-warning mb-0">
                  <i class="fa fa-exclamation-triangle"></i> <strong>Lưu ý:</strong> 
                  Người bán sẽ xem đầy đủ thông tin này trước khi quyết định chấp nhận hay từ chối.
                </div>
              </form>
            </div>
            ` : ''}

            <!-- Free Tab -->
            ${canFree ? `
            <div class="tab-pane fade ${defaultTab === 'freeTab' ? 'show active' : ''}" id="freeTab" role="tabpanel">
              <div class="alert alert-info">
                <i class="fa fa-info-circle mr-2"></i>
                Sản phẩm này đang cho miễn phí. Hãy chia sẻ lý do bạn cần sản phẩm này.
              </div>
              <form id="freeProposalForm">
                <div class="form-group">
                  <label for="freeMessage">Lý do bạn muốn nhận sản phẩm này: <span class="text-danger">*</span></label>
                  <textarea class="form-control" id="freeMessage" rows="4" 
                            placeholder="Hãy chia sẻ lý do bạn cần sản phẩm này..." required></textarea>
                </div>
              </form>
            </div>
            ` : ''}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Hủy</button>
          <button type="button" class="btn btn-primary" id="submitProposalBtn" onclick="submitCurrentProposal()">
            <i class="fa fa-paper-plane mr-1"></i>Gửi Đề Nghị
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  $(modal).modal("show");

  // Load user's products for swap tab if it exists
  if (canSwap) {
    loadMyProductsForSwapTab();
  }

  // Set initial button text
  const initialActiveTab = defaultTab === 'buyTab' ? '#buyTab' : defaultTab === 'swapTab' ? '#swapTab' : '#freeTab';
  updateSubmitButtonText(initialActiveTab);

  // Update button text based on active tab
  $('#proposalTabs a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    const target = $(e.target).attr("href");
    updateSubmitButtonText(target);
  });

  // === BUY TAB: Payment Method change handler ===
  $('#buyPaymentMethod').on('change', function() {
    const method = $(this).val();
    $('#buyBankInfo, #buyMomoInfo, #buyZaloInfo').addClass('d-none');
    
    if (method === 'chuyen-khoan') {
      $('#buyBankInfo').removeClass('d-none');
    } else if (method === 'momo') {
      $('#buyMomoInfo').removeClass('d-none');
    } else if (method === 'zalopay') {
      $('#buyZaloInfo').removeClass('d-none');
    }
  });

  // === BUY TAB: Shipping Method change handler ===
  $('input[name="buyShippingMethod"]').on('change', function() {
    const method = $(this).val();
    if (method === 'gap-truc-tiep') {
      $('#buyMeetingLocation').removeClass('d-none');
      $('#buyDeliveryAddress').addClass('d-none');
    } else {
      $('#buyMeetingLocation').addClass('d-none');
      $('#buyDeliveryAddress').removeClass('d-none');
    }
  });

  // === SWAP TAB: Payment Method change handler ===
  $('#swapPaymentMethod').on('change', function() {
    // No additional UI needed for swap payment
  });

  // === SWAP TAB: Shipping Method change handler ===
  $('input[name="swapShippingMethod"]').on('change', function() {
    const method = $(this).val();
    if (method === 'gap-truc-tiep') {
      $('#swapMeetingLocation').removeClass('d-none');
      $('#swapDeliveryAddress').addClass('d-none');
    } else {
      $('#swapMeetingLocation').addClass('d-none');
      $('#swapDeliveryAddress').removeClass('d-none');
    }
  });

  // === SWAP TAB: Auto-update payment method based on priceDifference ===
  $('#priceDifference').on('input', function() {
    const priceDiff = parseInt($(this).val()) || 0;
    const paymentMethod = $('#swapPaymentMethod');
    
    if (priceDiff === 0) {
      paymentMethod.val('khong-can-thanh-toan');
      $('#swapPaymentSection .card-body').addClass('bg-light');
    } else {
      if (paymentMethod.val() === 'khong-can-thanh-toan') {
        paymentMethod.val('tien-mat'); // Default to cash if there's money
      }
      $('#swapPaymentSection .card-body').removeClass('bg-light');
    }
  });

  $(modal).on("hidden.bs.modal", function () {
    modal.remove();
  });
}

// Helper function to update submit button
function updateSubmitButtonText(target) {
    const btn = document.getElementById('submitProposalBtn');
    if (!btn) return;
    
    if (target === '#buyTab') {
      btn.innerHTML = '<i class="fa fa-shopping-cart mr-1"></i>Gửi Đề Nghị Mua';
      btn.className = 'btn btn-success';
    } else if (target === '#swapTab') {
      btn.innerHTML = '<i class="fa fa-exchange-alt mr-1"></i>Gửi Đề Nghị Trao Đổi';
      btn.className = 'btn btn-warning';
    } else if (target === '#freeTab') {
      btn.innerHTML = '<i class="fa fa-gift mr-1"></i>Gửi Yêu Cầu Nhận';
      btn.className = 'btn btn-info';
    }
}

// Load user's products for swap dropdown
async function loadMyProductsForSwapDropdown() {
  try {
    const currentUser = AuthManager.getUser();
    const response = await ApiService.get(`/users/${currentUser._id}/posts`);
    
    const myPosts = response.data?.posts || response.posts || [];
    const dropdown = document.getElementById('swapProduct');

    if (!dropdown) return;

    if (myPosts.length === 0) {
      dropdown.innerHTML = '<option value="">Bạn chưa có sản phẩm đang bán - Đăng tin ngay</option>';
      dropdown.disabled = true;
      return;
    }

    // Filter only products FOR SALE (ban or ca-hai) and exclude current post
    const availablePosts = myPosts.filter(p => 
      p._id !== currentPost._id && 
      p.trangThai === 'approved' &&
      p.loaiGia === 'ban'  // Only products listed for SALE can be used in swap
    );

    if (availablePosts.length === 0) {
      dropdown.innerHTML = '<option value="">Không có sản phẩm đang bán để trao đổi</option>';
      dropdown.disabled = true;
      return;
    }

    let options = '<option value="">-- Chọn sản phẩm của bạn --</option>';
    availablePosts.forEach(post => {
      const price = post.gia ? ` - ${Utils.formatCurrency(post.gia)}` : '';
      options += `<option value="${post._id}">${Utils.escapeHtml(post.tieuDe)}${price}</option>`;
    });

    dropdown.innerHTML = options;
    dropdown.disabled = false;

  } catch (error) {
    console.error("Error loading products for swap:", error);
    const dropdown = document.getElementById('swapProduct');
    if (dropdown) {
      dropdown.innerHTML = '<option value="">Lỗi khi tải sản phẩm</option>';
      dropdown.disabled = true;
    }
  }
}

// Submit proposal based on active tab
async function submitCurrentProposal() {
  const activeTab = document.querySelector('#proposalTabs .nav-link.active').getAttribute('href');
  
  if (activeTab === '#buyTab') {
    await submitBuyProposal();
  } else if (activeTab === '#swapTab') {
    await submitSwapProposal();
  } else if (activeTab === '#freeTab') {
    await submitFreeRequest();
  }
}

// Modal for Swap Proposal
function showSwapProposalModal() {
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "swapProposalModal";
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header bg-warning text-dark">
          <h5 class="modal-title"><i class="fa fa-exchange-alt mr-2"></i>Đề Nghị Trao Đổi</h5>
          <button type="button" class="close" data-dismiss="modal">
            <span>&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="row mb-3">
            <div class="col-md-6">
              <h6 class="font-weight-bold">Sản phẩm của người bán:</h6>
              <div class="card">
                <img src="${currentPost.hinhAnh && currentPost.hinhAnh[0] ? currentPost.hinhAnh[0] : 'img/product-placeholder.jpg'}" 
                     class="card-img-top" style="height: 150px; object-fit: cover;">
                <div class="card-body">
                  <h6 class="card-title">${currentPost.tieuDe}</h6>
                  <p class="text-muted mb-0"><small>${currentPost.moTa ? Utils.truncateText(currentPost.moTa, 80) : ''}</small></p>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <h6 class="font-weight-bold">Sản phẩm của bạn:</h6>
              <div id="myProductsContainer" style="max-height: 300px; overflow-y: auto;">
                <div class="text-center py-3">
                  <div class="spinner-border text-warning" role="status">
                    <span class="sr-only">Đang tải...</span>
                  </div>
                  <p class="text-muted mt-2">Đang tải sản phẩm của bạn...</p>
                </div>
              </div>
            </div>
          </div>
          <form id="swapProposalForm">
            <input type="hidden" id="selectedProductId" value="">
            <div class="form-group">
              <label for="priceDifference">Tiền bù (nếu có):</label>
              <input type="number" class="form-control" id="priceDifference" 
                     value="0" min="0" placeholder="Nhập số tiền bù nếu cần">
              <small class="form-text text-muted">Nhập số tiền bạn sẵn sàng bù thêm (VNĐ)</small>
            </div>

            <!-- Payment Method Section -->
            <div class="card mb-3" id="swapPaymentSection">
              <div class="card-header bg-light">
                <h6 class="mb-0"><i class="fa fa-credit-card mr-2"></i>Phương Thức Thanh Toán Tiền Bù</h6>
              </div>
              <div class="card-body">
                <div class="form-group mb-0">
                  <label>Chọn phương thức thanh toán tiền bù:</label>
                  <select class="form-control" id="swapPaymentMethod">
                    <option value="khong-can-thanh-toan">Không có tiền bù</option>
                    <option value="tien-mat">💵 Tiền mặt (khi gặp trực tiếp)</option>
                    <option value="chuyen-khoan">🏦 Chuyển khoản ngân hàng</option>
                    <option value="momo">📱 Momo</option>
                    <option value="zalopay">💳 ZaloPay</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Shipping Method Section -->
            <div class="card mb-3">
              <div class="card-header bg-light">
                <h6 class="mb-0"><i class="fa fa-truck mr-2"></i>Hình Thức Giao Hàng</h6>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label>Chọn hình thức giao hàng: <span class="text-danger">*</span></label>
                  <div class="custom-control custom-radio">
                    <input type="radio" class="custom-control-input" id="swapMeetInPerson" name="swapShippingMethod" value="gap-truc-tiep" checked>
                    <label class="custom-control-label" for="swapMeetInPerson">
                      🤝 Gặp trực tiếp (trao đổi tận tay)
                    </label>
                  </div>
                  <div class="custom-control custom-radio">
                    <input type="radio" class="custom-control-input" id="swapDelivery" name="swapShippingMethod" value="giao-hang-tan-noi">
                    <label class="custom-control-label" for="swapDelivery">
                      📦 Giao hàng tận nơi (qua đơn vị vận chuyển)
                    </label>
                  </div>
                </div>

                <!-- Meeting Location Section -->
                <div id="swapMeetingLocation">
                  <hr>
                  <div class="form-group mb-0">
                    <label>Địa điểm đề xuất gặp: <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="swapMeetingPlace" placeholder="VD: Cafe Highlands Nguyễn Huệ, Q1, TP.HCM">
                    <small class="form-text text-muted">Đề xuất địa điểm thuận tiện để gặp người bán</small>
                  </div>
                </div>

                <!-- Delivery Address Section -->
                <div id="swapDeliveryAddress" class="d-none">
                  <hr>
                  <h6 class="text-primary mb-3">Địa chỉ nhận hàng của bạn:</h6>
                  <div class="form-row">
                    <div class="form-group col-md-6">
                      <label>Họ tên người nhận: <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" id="swapRecipientName" placeholder="VD: Nguyễn Văn A">
                    </div>
                    <div class="form-group col-md-6">
                      <label>Số điện thoại: <span class="text-danger">*</span></label>
                      <input type="tel" class="form-control" id="swapRecipientPhone" placeholder="VD: 0912345678">
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Địa chỉ chi tiết: <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="swapAddressDetail" placeholder="VD: Số 123, Đường ABC">
                  </div>
                  <div class="form-row">
                    <div class="form-group col-md-4">
                      <label>Phường/Xã: <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" id="swapWard" placeholder="VD: Phường 1">
                    </div>
                    <div class="form-group col-md-4">
                      <label>Quận/Huyện: <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" id="swapDistrict" placeholder="VD: Quận 1">
                    </div>
                    <div class="form-group col-md-4">
                      <label>Tỉnh/TP: <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" id="swapCity" placeholder="VD: TP.HCM">
                    </div>
                  </div>
                  <div class="alert alert-info small mb-0">
                    <i class="fa fa-info-circle"></i> Phí ship sẽ được thảo luận với người bán sau khi họ đồng ý
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="swapMessage">Lời nhắn:</label>
              <textarea class="form-control" id="swapMessage" rows="3" 
                        placeholder="Mô tả lý do bạn muốn trao đổi..."></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Hủy</button>
          <button type="button" class="btn btn-warning" onclick="submitSwapProposal()">
            <i class="fa fa-exchange-alt mr-1"></i>Gửi Đề Nghị Trao Đổi
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  $(modal).modal("show");

  // Load user's products
  loadMyProductsForSwap();

  // Setup shipping method toggle
  setupSwapShippingToggle();

  $(modal).on("hidden.bs.modal", function () {
    modal.remove();
  });
}

// Setup shipping method toggle for swap modal
function setupSwapShippingToggle() {
  const meetInPersonRadio = document.getElementById('swapMeetInPerson');
  const deliveryRadio = document.getElementById('swapDelivery');
  const meetingLocationDiv = document.getElementById('swapMeetingLocation');
  const deliveryAddressDiv = document.getElementById('swapDeliveryAddress');

  if (meetInPersonRadio && deliveryRadio) {
    meetInPersonRadio.addEventListener('change', function() {
      if (this.checked) {
        meetingLocationDiv.classList.remove('d-none');
        deliveryAddressDiv.classList.add('d-none');
      }
    });

    deliveryRadio.addEventListener('change', function() {
      if (this.checked) {
        meetingLocationDiv.classList.add('d-none');
        deliveryAddressDiv.classList.remove('d-none');
      }
    });
  }
}

// Load user's products for swap selection
// Load products for standalone swap modal (myProductsContainer)
async function loadMyProductsForSwap() {
  await loadMyProductsForSwapInternal("#myProductsContainer", "#selectedProductId");
}

// Load products for swap tab in main modal (mySwapProductsContainer)
async function loadMyProductsForSwapTab() {
  await loadMyProductsForSwapInternal("#mySwapProductsContainer", "#selectedSwapProductId");
}

// Common function to load products for swap
async function loadMyProductsForSwapInternal(containerSelector, hiddenInputSelector) {
  try {
    const currentUser = AuthManager.getUser();
    // Use search API with nguoiDang filter (now supported in server)
    const response = await ApiService.get('/posts/search', {
      nguoiDang: currentUser._id,
      trangThai: 'approved',
      loaiGia: 'ban',  // Only get products for SALE
      limit: 50
    });

    const myPosts = response.data?.posts || [];
    // Filter to exclude current post
    const availablePosts = myPosts.filter(p => p._id !== currentPost._id);
    
    const container = document.querySelector(containerSelector);

    if (availablePosts.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info">
          <i class="fa fa-info-circle mr-2"></i>
          Bạn chưa có sản phẩm đang bán để trao đổi. 
          <a href="create-post.html" class="alert-link">Đăng tin bán hàng ngay</a>
        </div>
      `;
      return;
    }

    let html = '<div class="list-group">';
    availablePosts.forEach(post => {
      const img = post.hinhAnh && post.hinhAnh[0] ? post.hinhAnh[0] : 'img/product-placeholder.jpg';
      const price = post.gia ? Utils.formatCurrency(post.gia) : 'Chưa có giá';
      html += `
        <div class="list-group-item list-group-item-action swap-product-item" 
             data-product-id="${post._id}" 
             style="cursor: pointer;">
          <div class="d-flex">
            <img src="${img}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" class="mr-3">
            <div class="flex-grow-1">
              <h6 class="mb-1">${Utils.escapeHtml(post.tieuDe)}</h6>
              <small class="text-muted">${price}</small>
            </div>
            <div class="align-self-center">
              <i class="fa fa-check-circle text-success" style="display: none; font-size: 24px;"></i>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('.swap-product-item').forEach(item => {
      item.addEventListener('click', function() {
        // Remove previous selection
        container.querySelectorAll('.swap-product-item').forEach(el => {
          el.classList.remove('active');
          el.querySelector('.fa-check-circle').style.display = 'none';
        });
        
        // Mark as selected
        this.classList.add('active');
        this.querySelector('.fa-check-circle').style.display = 'block';
        document.querySelector(hiddenInputSelector).value = this.getAttribute('data-product-id');
      });
    });

  } catch (error) {
    console.error("Error loading my products:", error);
    const container = document.querySelector(containerSelector);
    container.innerHTML = `
      <div class="alert alert-danger">
        <i class="fa fa-exclamation-triangle mr-2"></i>
        Không thể tải danh sách sản phẩm của bạn
      </div>
    `;
  }
}

// Modal for Free Request
function showFreeRequestModal() {
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "freeRequestModal";
  modal.innerHTML = `
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header bg-info text-white">
          <h5 class="modal-title"><i class="fa fa-gift mr-2"></i>Nhận Sản Phẩm Miễn Phí</h5>
          <button type="button" class="close text-white" data-dismiss="modal">
            <span>&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <h6 class="font-weight-bold">${currentPost.tieuDe}</h6>
            <p class="text-success mb-0">Miễn phí</p>
          </div>
          <form id="freeRequestForm">
            <div class="form-group">
              <label for="freeMessage">Lời nhắn cho người cho:</label>
              <textarea class="form-control" id="freeMessage" rows="3" 
                        placeholder="Xin chào, tôi quan tâm đến món đồ này..." required></textarea>
              <small class="form-text text-muted">Hãy cho người bán biết lý do bạn muốn nhận món đồ này</small>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Hủy</button>
          <button type="button" class="btn btn-info" onclick="submitFreeRequest()">
            <i class="fa fa-paper-plane mr-1"></i>Gửi Yêu Cầu
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  $(modal).modal("show");

  $(modal).on("hidden.bs.modal", function () {
    modal.remove();
  });
}

// Submit handlers
async function submitBuyProposal() {
  const offerPrice = document.querySelector("#offerPrice").value;
  const message = document.querySelector("#buyMessage").value.trim();
  const paymentMethod = document.querySelector("#buyPaymentMethod").value;
  const shippingMethod = document.querySelector('input[name="buyShippingMethod"]:checked').value;

  // Validate basic fields
  if (!offerPrice || offerPrice <= 0) {
    Utils.showToast("Vui lòng nhập giá đề xuất hợp lệ", "error");
    return;
  }

  if (!paymentMethod) {
    Utils.showToast("Vui lòng chọn phương thức thanh toán", "error");
    return;
  }

  // Validate shipping info
  if (shippingMethod === 'gap-truc-tiep') {
    const meetingPlace = document.querySelector("#buyMeetingPlace").value.trim();
    if (!meetingPlace) {
      Utils.showToast("Vui lòng nhập địa điểm gặp", "error");
      return;
    }
  } else if (shippingMethod === 'giao-hang-tan-noi') {
    const recipientName = document.querySelector("#buyRecipientName").value.trim();
    const recipientPhone = document.querySelector("#buyRecipientPhone").value.trim();
    const addressDetail = document.querySelector("#buyAddressDetail").value.trim();
    const ward = document.querySelector("#buyWard").value.trim();
    const district = document.querySelector("#buyDistrict").value.trim();
    const city = document.querySelector("#buyCity").value.trim();

    if (!recipientName || !recipientPhone || !addressDetail || !ward || !district || !city) {
      Utils.showToast("Vui lòng nhập đầy đủ địa chỉ giao hàng", "error");
      return;
    }
  }

  // Validate currentPost
  if (!currentPost || !currentPost._id) {
    console.error('currentPost not loaded:', currentPost);
    Utils.showToast("Lỗi: Không tìm thấy thông tin bài đăng", "error");
    return;
  }

  try {
    const proposalData = {
      baiDangId: currentPost._id,
      giaDeXuat: parseFloat(offerPrice),
      loiNhan: message || `Tôi muốn mua sản phẩm "${currentPost.tieuDe}" với giá ${Utils.formatCurrency(offerPrice)}`,
      phuongThucThanhToan: paymentMethod,
      hinhThucGiaoHang: shippingMethod
    };

    // Add shipping details based on method
    if (shippingMethod === 'gap-truc-tiep') {
      proposalData.diaDiemGap = document.querySelector("#buyMeetingPlace").value.trim();
    } else {
      proposalData.diaChiGiaoHang = {
        hoTen: document.querySelector("#buyRecipientName").value.trim(),
        soDienThoai: document.querySelector("#buyRecipientPhone").value.trim(),
        diaChiChiTiet: document.querySelector("#buyAddressDetail").value.trim(),
        phuongXa: document.querySelector("#buyWard").value.trim(),
        quanHuyen: document.querySelector("#buyDistrict").value.trim(),
        tinhThanh: document.querySelector("#buyCity").value.trim()
      };
    }

    // Call API to create transaction proposal
    const response = await ApiService.post('/transactions/propose-buy', proposalData);

    Utils.showToast("Đề nghị mua đã được gửi thành công!", "success");
    $("#buyProposalModal").modal("hide");
    $("#proposalModal").modal("hide");

    // Redirect to messages to continue conversation
    setTimeout(() => {
      window.location.href = `messages.html?user=${currentPost.nguoiDang._id}`;
    }, 1500);

  } catch (error) {
    console.error("Submit buy proposal error:", error);
    const errorMsg = error.response?.data?.message || error.message || "Lỗi không xác định";
    Utils.showToast("Không thể gửi đề nghị: " + errorMsg, "error");
  }
}

async function submitSwapProposal() {
  const selectedProductId = document.querySelector("#selectedSwapProductId")?.value || document.querySelector("#swapProduct")?.value || document.querySelector("#selectedProductId")?.value;
  const priceDifference = document.querySelector("#priceDifference").value || 0;
  const message = document.querySelector("#swapMessage").value.trim();
  const paymentMethod = document.querySelector("#swapPaymentMethod").value;
  const shippingMethod = document.querySelector('input[name="swapShippingMethod"]:checked').value;

  if (!selectedProductId) {
    Utils.showToast("Vui lòng chọn sản phẩm để trao đổi", "error");
    return;
  }

  // Validate shipping info
  if (shippingMethod === 'gap-truc-tiep') {
    const meetingPlace = document.querySelector("#swapMeetingPlace").value.trim();
    if (!meetingPlace) {
      Utils.showToast("Vui lòng nhập địa điểm gặp", "error");
      return;
    }
  } else if (shippingMethod === 'giao-hang-tan-noi') {
    const recipientName = document.querySelector("#swapRecipientName").value.trim();
    const recipientPhone = document.querySelector("#swapRecipientPhone").value.trim();
    const addressDetail = document.querySelector("#swapAddressDetail").value.trim();
    const ward = document.querySelector("#swapWard").value.trim();
    const district = document.querySelector("#swapDistrict").value.trim();
    const city = document.querySelector("#swapCity").value.trim();

    if (!recipientName || !recipientPhone || !addressDetail || !ward || !district || !city) {
      Utils.showToast("Vui lòng nhập đầy đủ địa chỉ giao hàng", "error");
      return;
    }
  }

  // Validate currentPost
  if (!currentPost || !currentPost._id) {
    console.error('currentPost not loaded:', currentPost);
    Utils.showToast("Lỗi: Không tìm thấy thông tin bài đăng", "error");
    return;
  }

  try {
    const proposalData = {
      baiDangId: currentPost._id,
      baiDangTraoDoiId: selectedProductId,
      tienBu: parseFloat(priceDifference) || 0,
      loiNhan: message || `Tôi muốn trao đổi sản phẩm với bạn${priceDifference > 0 ? ` và bù thêm ${Utils.formatCurrency(priceDifference)}` : ''}`,
      phuongThucThanhToan: paymentMethod,
      hinhThucGiaoHang: shippingMethod
    };

    // Add shipping details based on method
    if (shippingMethod === 'gap-truc-tiep') {
      proposalData.diaDiemGap = document.querySelector("#swapMeetingPlace").value.trim();
    } else {
      proposalData.diaChiGiaoHang = {
        hoTen: document.querySelector("#swapRecipientName").value.trim(),
        soDienThoai: document.querySelector("#swapRecipientPhone").value.trim(),
        diaChiChiTiet: document.querySelector("#swapAddressDetail").value.trim(),
        phuongXa: document.querySelector("#swapWard").value.trim(),
        quanHuyen: document.querySelector("#swapDistrict").value.trim(),
        tinhThanh: document.querySelector("#swapCity").value.trim()
      };
    }

    // Call API to create swap proposal
    const response = await ApiService.post('/transactions/propose-swap', proposalData);

    Utils.showToast("Đề nghị trao đổi đã được gửi thành công!", "success");
    $("#swapProposalModal").modal("hide");
    $("#proposalModal").modal("hide");

    // Redirect to messages
    setTimeout(() => {
      window.location.href = `messages.html?user=${currentPost.nguoiDang._id}`;
    }, 1500);

  } catch (error) {
    console.error("Submit swap proposal error:", error);
    const errorMsg = error.response?.data?.message || error.message || "Lỗi không xác định";
    Utils.showToast("Không thể gửi đề nghị: " + errorMsg, "error");
  }
}

async function submitFreeRequest() {
  const message = document.querySelector("#freeMessage").value.trim();

  if (!message) {
    Utils.showToast("Vui lòng nhập lời nhắn", "error");
    return;
  }

  // Validate currentPost
  if (!currentPost || !currentPost._id) {
    console.error('currentPost not loaded:', currentPost);
    Utils.showToast("Lỗi: Không tìm thấy thông tin bài đăng", "error");
    return;
  }

  try {
    const requestData = {
      baiDangId: currentPost._id,
      loiNhan: message
    };

    // Call API to create free request
    const response = await ApiService.post('/transactions/request-free', requestData);

    Utils.showToast("Yêu cầu đã được gửi thành công!", "success");
    $("#freeRequestModal").modal("hide");
    $("#proposalModal").modal("hide");

    // Redirect to messages
    setTimeout(() => {
      window.location.href = `messages.html?user=${currentPost.nguoiDang._id}`;
    }, 1500);

  } catch (error) {
    console.error("Submit free request error:", error);
    const errorMsg = error.response?.data?.message || error.message || "Lỗi không xác định";
    Utils.showToast("Không thể gửi yêu cầu: " + errorMsg, "error");
  }
}

function showLoadingState() {
  const mainContent = document.querySelector("#mainContent");
  if (mainContent) {
    mainContent.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Đang tải...</span>
                </div>
                <p class="mt-3 text-muted">Đang tải thông tin sản phẩm...</p>
            </div>
        `;
  }
}

function hideLoadingState() {
  // Content will be updated by other functions
}

// Export functions for global use
window.toggleSavePost = handleSaveProduct;
window.submitReport = submitReport;
window.submitBuyProposal = submitBuyProposal;
window.submitSwapProposal = submitSwapProposal;
window.submitFreeRequest = submitFreeRequest;


