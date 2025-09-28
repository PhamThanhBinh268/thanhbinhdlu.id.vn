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

  // Load chi tiết sản phẩm
  await loadProductDetail(postId);

  // Load sản phẩm liên quan
  await loadRelatedProducts();

  // Load đánh giá
  await loadReviews(postId);
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

  // Make offer button
  const offerBtn = document.querySelector("#makeOfferBtn");
  if (offerBtn) {
    offerBtn.addEventListener("click", handleMakeOffer);
  }
}

async function loadProductDetail(postId) {
  try {
    showLoadingState();

    const response = await ApiService.get(`/posts/${postId}`);
    currentPost = response.data;

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

  const priceElement = document.querySelector("#productPrice");
  if (priceElement) {
    if (post.gia > 0) {
      priceElement.innerHTML = `
                <h3 class="font-weight-semi-bold mb-4">${Utils.formatCurrency(
                  post.gia
                )}</h3>
            `;
    } else {
      priceElement.innerHTML = `
                <h3 class="font-weight-semi-bold mb-4 text-success">Trao đổi</h3>
            `;
    }
  }

  // Update description
  const descriptionElement = document.querySelector("#productDescription");
  if (descriptionElement) {
    descriptionElement.innerHTML = post.moTa.replace(/\n/g, "<br>");
  }

  // Update condition
  const conditionElement = document.querySelector("#productCondition");
  if (conditionElement) {
    const conditionText = getConditionText(post.tinhTrang);
    const conditionClass = getConditionBadgeClass(post.tinhTrang);
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

  // Update location
  const locationElement = document.querySelector("#productLocation");
  if (locationElement) {
    locationElement.innerHTML = `
            <i class="fas fa-map-marker-alt text-primary mr-2"></i>${post.diaChi}
        `;
  }

  // Update posted date
  const dateElement = document.querySelector("#productDate");
  if (dateElement) {
    dateElement.innerHTML = `
            <i class="fas fa-clock text-primary mr-2"></i>Đăng ${Utils.formatRelativeTime(
              post.ngayDang
            )}
        `;
  }

  // Update transaction type
  const transactionElement = document.querySelector("#transactionType");
  if (transactionElement) {
    const types = [];
    if (post.loaiGiaoDich.includes("sell")) types.push("Bán");
    if (post.loaiGiaoDich.includes("exchange")) types.push("Trao đổi");

    transactionElement.innerHTML = types
      .map((type) => `<span class="badge badge-info mr-2">${type}</span>`)
      .join("");
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
  const sellerNameElement = document.querySelector("#sellerName");
  const sellerRatingElement = document.querySelector("#sellerRating");
  const sellerJoinDateElement = document.querySelector("#sellerJoinDate");
  const sellerLocationElement = document.querySelector("#sellerLocation");

  if (sellerNameElement && post.nguoiDang) {
    sellerNameElement.textContent = post.nguoiDang.hoTen;
  }

  if (sellerRatingElement && post.nguoiDang) {
    const rating = post.nguoiDang.danhGiaTrungBinh || 0;
    const stars = generateStarsHTML(rating);
    sellerRatingElement.innerHTML = `${stars} (${
      post.nguoiDang.tongSoDanhGia || 0
    } đánh giá)`;
  }

  if (sellerJoinDateElement && post.nguoiDang) {
    const joinDate = new Date(post.nguoiDang.ngayTao).toLocaleDateString(
      "vi-VN"
    );
    sellerJoinDateElement.innerHTML = `
            <i class="fas fa-calendar text-primary mr-2"></i>Tham gia từ ${joinDate}
        `;
  }

  if (sellerLocationElement && post.nguoiDang) {
    sellerLocationElement.innerHTML = `
            <i class="fas fa-map-marker-alt text-primary mr-2"></i>${post.nguoiDang.diaChi}
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

    const price = post.gia > 0 ? Utils.formatCurrency(post.gia) : "Trao đổi";

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
                            <i class="fas fa-map-marker-alt mr-1"></i>${
                              post.diaChi
                            }
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
    const response = await ApiService.get(`/posts/${postId}/ratings`);
    const reviews = response.data;

    displayReviews(reviews);
  } catch (error) {
    console.error("Error loading reviews:", error);
  }
}

function displayReviews(reviews) {
  const container = document.querySelector("#reviewsContainer");
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = `
            <div class="text-center py-4">
                <p class="text-muted">Chưa có đánh giá nào</p>
            </div>
        `;
    return;
  }

  let html = "";
  reviews.forEach((review) => {
    const stars = generateStarsHTML(review.diemDanhGia);
    const date = Utils.formatDateTime(review.ngayDanhGia);

    html += `
            <div class="media mb-4">
                <div class="media-body">
                    <h6>${review.nguoiDanhGia.hoTen} <small class="text-muted"> - ${date}</small></h6>
                    <div class="text-primary mb-2">${stars}</div>
                    <p>${review.binhLuan}</p>
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

async function handleSubmitReview(e) {
  e.preventDefault();

  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Vui lòng đăng nhập để đánh giá", "warning");
    return;
  }

  const rating = document.querySelector('input[name="rating"]:checked')?.value;
  const comment = document.querySelector("#reviewComment").value.trim();

  if (!rating) {
    Utils.showToast("Vui lòng chọn số sao đánh giá", "error");
    return;
  }

  try {
    const reviewData = {
      baiDang: currentPost._id,
      nguoiNhan: currentPost.nguoiDang._id,
      diemDanhGia: parseInt(rating),
      binhLuan: comment,
    };

    await ApiService.post("/ratings", reviewData);

    Utils.showToast("Đánh giá đã được gửi thành công", "success");

    // Reset form
    document.querySelector("#reviewForm").reset();

    // Reload reviews
    await loadReviews(currentPost._id);
  } catch (error) {
    Utils.showToast("Không thể gửi đánh giá: " + error.message, "error");
  }
}

// Helper Functions
function getConditionText(condition) {
  const conditionMap = {
    new: "Mới",
    "like-new": "Như mới",
    good: "Tốt",
    fair: "Khá",
    poor: "Cần sửa chữa",
  };
  return conditionMap[condition] || condition;
}

function getConditionBadgeClass(condition) {
  const classMap = {
    new: "success",
    "like-new": "info",
    good: "primary",
    fair: "warning",
    poor: "danger",
  };
  return classMap[condition] || "secondary";
}

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

async function submitOffer() {
  const offerType = document.querySelector(
    'input[name="offerType"]:checked'
  )?.value;
  const price = document.querySelector("#offerPrice").value;
  const exchangeItem = document.querySelector("#exchangeItem").value.trim();
  const note = document.querySelector("#offerNote").value.trim();

  if (!offerType) {
    Utils.showToast("Vui lòng chọn loại đề xuất", "error");
    return;
  }

  if (offerType === "buy" && (!price || price <= 0)) {
    Utils.showToast("Vui lòng nhập giá đề xuất hợp lệ", "error");
    return;
  }

  if (offerType === "exchange" && !exchangeItem) {
    Utils.showToast("Vui lòng mô tả sản phẩm muốn trao đổi", "error");
    return;
  }

  try {
    // Send offer via message
    const offerData = {
      type: offerType,
      price: offerType === "buy" ? parseFloat(price) : null,
      exchangeItem: offerType === "exchange" ? exchangeItem : null,
      note: note,
      postTitle: currentPost.tieuDe,
      postId: currentPost._id,
    };

    // This would use Socket.IO to send the offer message
    Utils.showToast("Đề xuất đã được gửi thành công", "success");
    $(".modal").modal("hide");

    // Optionally redirect to messages
    setTimeout(() => {
      window.location.href = `messages.html?user=${currentPost.nguoiDang._id}`;
    }, 1500);
  } catch (error) {
    Utils.showToast("Không thể gửi đề xuất: " + error.message, "error");
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
window.submitOffer = submitOffer;
