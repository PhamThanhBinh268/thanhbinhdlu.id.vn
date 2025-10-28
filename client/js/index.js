// =============================================================================
// Index Page - Trang chủ website trao đổi đồ cũ
// =============================================================================

// C2C: Sort posts by service priority (Featured > VIP > Boost > Regular)
function sortPostsByServicePriority(posts) {
  if (!Array.isArray(posts)) return posts;
  
  return posts.sort((a, b) => {
    // Priority scoring: Featured = 1000, VIP = 100, Boost = 10, Regular = 0
    const getScore = (post) => {
      let score = 0;
      if (post.tinhNangDichVu) {
        if (post.tinhNangDichVu.noiBat) score += 1000; // Featured (admin-marked)
        if (post.tinhNangDichVu.tinVip) score += 100;  // VIP (user-purchased)
        if (post.tinhNangDichVu.dayTin) score += 10;   // Boosted (user-purchased)
      }
      return score;
    };
    
    const scoreA = getScore(a);
    const scoreB = getScore(b);
    
    // Higher score = higher priority (display first)
    if (scoreA !== scoreB) return scoreB - scoreA;
    
    // Same priority: sort by date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initializeIndexPage();
  // Tự động làm mới block sản phẩm khi có cập nhật từ Admin (giảm giá/nổi bật)
  let refreshTimer = null;
  window.addEventListener('post:updated', () => {
    // debounce để tránh gọi nhiều lần liên tiếp
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      try { loadFeaturedProducts(); } catch(_) {}
      try { loadRecentProducts(); } catch(_) {}
    }, 300);
  });
});

async function initializeIndexPage() {
  // Setup event listeners
  setupEventListeners();

  // Load featured categories (homepage)
  await loadHomepageCategories();

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

async function loadHomepageCategories() {
  try {
    // Fetch active categories with stats for counts
    const response = await ApiService.get(
      API_CONFIG.ENDPOINTS.CATEGORIES,
      { includeStats: true }
    );
    const categories =
      response.categories || response.data || response;

    renderHomepageCategories(Array.isArray(categories) ? categories : []);
  } catch (error) {
    console.error("Error loading homepage categories:", error);
  }
}

function renderHomepageCategories(categories) {
  const container = document.querySelector("#featuredCategoriesContainer");
  if (!container) return;

  if (!Array.isArray(categories) || categories.length === 0) {
    container.innerHTML = `
      <div class="col-12 text-center py-4 text-muted">Chưa có danh mục nào</div>
    `;
    return;
  }

  // Reorder to match navbar (push "Khác" to the bottom) then show up to 12
  const normalize = (s) => (s || "").toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const isOther = (c) => {
    const name = normalize(c.tenDanhMuc || c.name || c.title);
    const slug = normalize(c.slug);
    return name === 'khac' || slug === 'other' || slug === 'khac';
  };
  const ordered = categories.filter((c) => !isOther(c)).concat(categories.filter(isOther));

  // Show up to 12 categories on homepage
  const displayCategories = ordered.slice(0, 12);
  
  // Map category images based on category name
  const getCategoryImage = (categoryName) => {
    const normalizedName = normalize(categoryName);
    
    // Map specific category names to appropriate images
    if (normalizedName.includes('dien tu') || normalizedName.includes('electronics')) {
      return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop';
    }
    if (normalizedName.includes('thoi trang') || normalizedName.includes('fashion')) {
      return 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop';
    }
    if (normalizedName.includes('gia dung') || normalizedName.includes('home')) {
      return 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop';
    }
    if (normalizedName.includes('sach') || normalizedName.includes('van phong') || normalizedName.includes('book')) {
      return 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop';
    }
    if (normalizedName.includes('xe') || normalizedName.includes('vehicle') || normalizedName.includes('co')) {
      return 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&h=400&fit=crop';
    }
    if (normalizedName.includes('the thao') || normalizedName.includes('sport')) {
      return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop';
    }
    if (normalizedName === 'khac' || normalizedName === 'other') {
      return 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop';
    }
    // Default image
    return 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=400&fit=crop';
  };

  let html = "";
  displayCategories.forEach((category, idx) => {
    const imageUrl = category.hinhAnh || getCategoryImage(category.tenDanhMuc);
    const count = category.postCount || category.soLuongBaiDang || 0;
    html += `
      <div class="col-lg-3 col-md-4 col-sm-6 pb-1">
        <a class="text-decoration-none" href="shop.html?category=${category._id}" data-category-id="${category._id}">
          <div class="cat-item img-zoom d-flex align-items-center mb-4">
            <div class="overflow-hidden" style="width: 100px; height: 100px;">
              <img class="img-fluid" src="${imageUrl}" alt="${category.tenDanhMuc}">
            </div>
            <div class="flex-fill pl-3">
              <h6>${category.tenDanhMuc}</h6>
              <small class="text-body">${count} Sản Phẩm</small>
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
      "/posts/featured?limit=10"
    );
    let products = (response.data && response.data.posts) || response.posts || response.data?.data?.posts || response.data?.data?.items || [];

    // C2C: Sort by service priority (Featured > VIP > Boost > Regular)
    products = sortPostsByServicePriority(products);

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
      "/posts/search?sortBy=newest&limit=10&loaiGia=ban"
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

  const basePrice = (window.Formatters ? Formatters.getPriceLabel(product.loaiGia, product.gia) : (product.loaiGia === 'cho-mien-phi' ? '<span class="text-success">Miễn phí</span>' : (product.loaiGia === 'trao-doi' ? '<span class="text-primary">Trao đổi</span>' : Utils.formatCurrency(product.gia || 0))));

  const condition = (window.Formatters ? Formatters.getConditionText(product.tinhTrang) : getConditionText(product.tinhTrang));
  const when = product.createdAt || product.ngayDang || product.updatedAt;
  const timeAgo = Utils.formatRelativeTime(when);

  // Determine if user is logged in for heart icon
  const isLoggedIn = AuthManager.isLoggedIn();
  const heartIcon = isLoggedIn ? "far fa-heart" : "far fa-heart";

  const highlightClass = (window.ProductDecorators && ProductDecorators.isHighlighted(product)) ? ' product-highlight' : '';
  const priceBlock = (window.ProductDecorators ? ProductDecorators.applyPrice(product, basePrice) : `<h5 class="text-primary mb-0">${basePrice}</h5>`);
  const productBadges = (window.ProductDecorators ? ProductDecorators.renderBadges(product) : '');

  return `
        <div class="col-lg-3 col-md-4 col-sm-6 pb-1">
            <div class="product-item bg-light mb-4${highlightClass}">
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
            ${priceBlock}
          </div>
                    <div class="d-flex align-items-center justify-content-center mt-1">
            <small class="text-muted mr-2">
              <i class="fas fa-map-marker-alt"></i> ${Utils.truncateText((window.Formatters ? Formatters.getLocation(product) : (product.diaDiem || product.diaChi || '')), 20)}
            </small>
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> ${timeAgo}
                        </small>
                    </div>
          <div class="mt-2">
                        <span class="badge badge-${(window.Formatters ? Formatters.getConditionBadgeClass(product.tinhTrang) : getConditionBadgeClass(product.tinhTrang))} badge-sm">
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
            ${productBadges ? `<span class="ml-1">${productBadges}</span>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getConditionText(condition) {
  const conditionMap = {
    'moi': "Mới",
    'nhu-moi': "Như mới",
    'tot': "Tốt",
    'kha': "Khá",
    'can-sua-chua': "Cần sửa chữa",
  };
  return conditionMap[condition] || condition;
}

function getConditionBadgeClass(condition) {
  const classMap = {
    'moi': "success",
    'nhu-moi': "info",
    'tot': "primary",
    'kha': "warning",
    'can-sua-chua': "danger",
  };
  return classMap[condition] || "secondary";
}

function setupCarousel() {
  // Setup hero carousel with proper intervals
  $("#header-carousel").carousel({
    interval: 4000, // auto rotate faster
    ride: "carousel",
    pause: false,
  });

  // Click anywhere on the slide caption to go to shop page
  document.querySelectorAll('#header-carousel .carousel-item .carousel-caption').forEach((el)=>{
    el.style.cursor = 'pointer';
    el.addEventListener('click', function(e){
      // avoid interfering with internal buttons/links
      if (e.target && (e.target.tagName === 'A' || e.target.closest('a'))) return;
      window.location.href = 'shop.html';
    });
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
