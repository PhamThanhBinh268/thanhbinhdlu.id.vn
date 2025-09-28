// =============================================================================
// Index Page - Trang chủ website trao đổi đồ cũ
// =============================================================================

document.addEventListener("DOMContentLoaded", function () {
  initializeIndexPage();
});

async function initializeIndexPage() {
  // Setup event listeners
  setupEventListeners();

  // Load featured categories
  await loadFeaturedCategories();

  // Load featured products
  await loadFeaturedProducts();

  // Load recent products
  await loadRecentProducts();

  // Setup carousel auto-play
  setupCarousel();
}

function setupEventListeners() {
  // Search form in hero section
  const heroSearchForm = document.querySelector("#heroSearchForm");
  if (heroSearchForm) {
    heroSearchForm.addEventListener("submit", handleHeroSearch);
  }

  // Category clicks
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-category-id]")) {
      e.preventDefault();
      const categoryId = e.target
        .closest("[data-category-id]")
        .getAttribute("data-category-id");
      window.location.href = `shop.html?category=${categoryId}`;
    }
  });
}

function handleHeroSearch(e) {
  e.preventDefault();
  const searchInput = e.target.querySelector('input[type="text"]');
  const query = searchInput.value.trim();

  if (query) {
    window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
  }
}

async function loadFeaturedCategories() {
  try {
    const response = await ApiService.get("/categories?featured=true");
    const categories = response.data;

    displayFeaturedCategories(categories);
    updateNavigationCategories(categories.slice(0, 10)); // Top 10 for navigation
  } catch (error) {
    console.error("Error loading featured categories:", error);
  }
}

function displayFeaturedCategories(categories) {
  const container = document.querySelector("#featuredCategoriesContainer");
  if (!container) return;

  if (categories.length === 0) return;

  // Take first 8 categories
  const displayCategories = categories.slice(0, 8);
  let html = "";

  displayCategories.forEach((category) => {
    const imageUrl = category.hinhAnh || "img/cat-default.jpg";

    html += `
            <div class="col-lg-3 col-md-4 col-sm-6 pb-1">
                <a class="text-decoration-none" href="#" data-category-id="${
                  category._id
                }">
                    <div class="cat-item img-zoom d-flex align-items-center mb-4">
                        <div class="overflow-hidden" style="width: 100px; height: 100px;">
                            <img class="img-fluid" src="${imageUrl}" alt="${
      category.tenDanhMuc
    }">
                        </div>
                        <div class="flex-fill pl-3">
                            <h6>${category.tenDanhMuc}</h6>
                            <small class="text-body">${
                              category.soLuongBaiDang || 0
                            } Sản Phẩm</small>
                        </div>
                    </div>
                </a>
            </div>
        `;
  });

  container.innerHTML = html;
}

function updateNavigationCategories(categories) {
  const navContainer = document.querySelector("#categoryNav");
  if (!navContainer) return;

  let html = "";

  categories.forEach((category) => {
    html += `
            <a href="#" class="nav-item nav-link" data-category-id="${category._id}">
                ${category.tenDanhMuc}
            </a>
        `;
  });

  navContainer.innerHTML = html;
}

async function loadFeaturedProducts() {
  try {
    const response = await ApiService.get(
      "/posts/search?featured=true&limit=8"
    );
    const products = response.data.posts;

    displayFeaturedProducts(products);
  } catch (error) {
    console.error("Error loading featured products:", error);
  }
}

function displayFeaturedProducts(products) {
  const container = document.querySelector("#featuredProductsContainer");
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-muted">Chưa có sản phẩm nổi bật</p>
            </div>
        `;
    return;
  }

  let html = "";
  products.forEach((product) => {
    html += createProductCard(product);
  });

  container.innerHTML = html;
}

async function loadRecentProducts() {
  try {
    const response = await ApiService.get(
      "/posts/search?sortBy=newest&limit=8"
    );
    const products = response.data.posts;

    displayRecentProducts(products);
  } catch (error) {
    console.error("Error loading recent products:", error);
  }
}

function displayRecentProducts(products) {
  const container = document.querySelector("#recentProductsContainer");
  if (!container) return;

  if (products.length === 0) return;

  let html = "";
  products.forEach((product) => {
    html += createProductCard(product);
  });

  container.innerHTML = html;
}

function createProductCard(product) {
  const imageUrl =
    product.hinhAnh && product.hinhAnh.length > 0
      ? product.hinhAnh[0]
      : "img/product-placeholder.jpg";

  const price =
    product.gia > 0
      ? Utils.formatCurrency(product.gia)
      : '<span class="text-success">Trao đổi</span>';

  const condition = getConditionText(product.tinhTrang);
  const timeAgo = Utils.formatRelativeTime(product.ngayDang);

  // Determine if user is logged in for heart icon
  const isLoggedIn = AuthManager.isLoggedIn();
  const heartIcon = isLoggedIn ? "far fa-heart" : "far fa-heart";

  return `
        <div class="col-lg-3 col-md-4 col-sm-6 pb-1">
            <div class="product-item bg-light mb-4">
                <div class="product-img position-relative overflow-hidden">
                    <img class="img-fluid w-100" src="${imageUrl}" alt="${
    product.tieuDe
  }" style="height: 250px; object-fit: cover;">
                    <div class="product-action">
                        ${
                          isLoggedIn
                            ? `
                            <a class="btn btn-outline-dark btn-square" href="#" onclick="toggleSavePost('${product._id}', event)">
                                <i class="${heartIcon}"></i>
                            </a>
                        `
                            : ""
                        }
                        <a class="btn btn-outline-dark btn-square" href="detail.html?id=${
                          product._id
                        }">
                            <i class="fa fa-eye"></i>
                        </a>
                        ${
                          isLoggedIn
                            ? `
                            <a class="btn btn-outline-dark btn-square" href="#" onclick="startChat('${product.nguoiDang._id}', event)">
                                <i class="fa fa-comment"></i>
                            </a>
                        `
                            : ""
                        }
                    </div>
                </div>
                <div class="text-center py-4">
                    <a class="h6 text-decoration-none text-truncate d-block" href="detail.html?id=${
                      product._id
                    }">
                        ${Utils.truncateText(product.tieuDe, 45)}
                    </a>
                    <div class="d-flex align-items-center justify-content-center mt-2">
                        <h5 class="text-primary mb-0">${price}</h5>
                    </div>
                    <div class="d-flex align-items-center justify-content-center mt-1">
                        <small class="text-muted mr-2">
                            <i class="fas fa-map-marker-alt"></i> ${Utils.truncateText(
                              product.diaChi,
                              20
                            )}
                        </small>
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> ${timeAgo}
                        </small>
                    </div>
                    <div class="mt-2">
                        <span class="badge badge-${getConditionBadgeClass(
                          product.tinhTrang
                        )} badge-sm">
                            ${condition}
                        </span>
                        ${
                          product.danhMuc
                            ? `
                            <span class="badge badge-secondary badge-sm ml-1">
                                ${product.danhMuc.tenDanhMuc}
                            </span>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

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

function setupCarousel() {
  // Setup hero carousel with proper intervals
  $("#header-carousel").carousel({
    interval: 5000, // 5 seconds
    ride: "carousel",
  });

  // Setup product carousels if they exist
  $(".product-carousel").each(function () {
    $(this).owlCarousel({
      autoplay: true,
      smartSpeed: 1000,
      margin: 25,
      loop: true,
      nav: true,
      navText: [
        '<i class="fa fa-angle-left"></i>',
        '<i class="fa fa-angle-right"></i>',
      ],
      responsive: {
        0: {
          items: 1,
        },
        576: {
          items: 2,
        },
        768: {
          items: 3,
        },
        992: {
          items: 4,
        },
      },
    });
  });
}

// Save/Unsave post function
async function toggleSavePost(postId, event) {
  event.stopPropagation();
  event.preventDefault();

  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Vui lòng đăng nhập để lưu sản phẩm", "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }

  try {
    const button = event.currentTarget;
    const icon = button.querySelector("i");

    if (icon.classList.contains("fas")) {
      // Unsave
      await ApiService.delete(`/posts/${postId}/save`);
      icon.classList.remove("fas");
      icon.classList.add("far");
      Utils.showToast("Đã bỏ lưu sản phẩm", "info");
    } else {
      // Save
      await ApiService.post(`/posts/${postId}/save`);
      icon.classList.remove("far");
      icon.classList.add("fas");
      Utils.showToast("Đã lưu sản phẩm", "success");
    }
  } catch (error) {
    Utils.showToast("Không thể thực hiện thao tác: " + error.message, "error");
  }
}

// Start chat with seller
function startChat(sellerId, event) {
  event.stopPropagation();
  event.preventDefault();

  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Vui lòng đăng nhập để nhắn tin", "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
    return;
  }

  window.location.href = `messages.html?user=${sellerId}`;
}

// Update stats periodically
async function updateStats() {
  try {
    const response = await ApiService.get("/stats/homepage");
    const stats = response.data;

    // Update stats in hero section if elements exist
    const totalProductsElement = document.querySelector("#totalProducts");
    const totalUsersElement = document.querySelector("#totalUsers");
    const totalTransactionsElement =
      document.querySelector("#totalTransactions");

    if (totalProductsElement)
      totalProductsElement.textContent = stats.totalPosts || 0;
    if (totalUsersElement)
      totalUsersElement.textContent = stats.totalUsers || 0;
    if (totalTransactionsElement)
      totalTransactionsElement.textContent = stats.totalTransactions || 0;
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

// Newsletter subscription
async function subscribeNewsletter(email) {
  try {
    await ApiService.post("/newsletter/subscribe", { email });
    Utils.showToast("Đăng ký nhận tin thành công!", "success");
    return true;
  } catch (error) {
    Utils.showToast("Đăng ký thất bại: " + error.message, "error");
    return false;
  }
}

// Setup newsletter form if exists
document.addEventListener("DOMContentLoaded", function () {
  const newsletterForm = document.querySelector("#newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const emailInput = this.querySelector(
        'input[type="email"], input[type="text"]'
      );
      const email = emailInput.value.trim();

      if (!Utils.isValidEmail(email)) {
        Utils.showToast("Vui lòng nhập email hợp lệ", "error");
        return;
      }

      const success = await subscribeNewsletter(email);
      if (success) {
        emailInput.value = "";
      }
    });
  }
});

// Update stats on page load
setTimeout(updateStats, 1000);

// Export functions for global use
window.toggleSavePost = toggleSavePost;
window.startChat = startChat;
