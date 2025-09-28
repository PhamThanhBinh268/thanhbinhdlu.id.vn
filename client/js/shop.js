// =============================================================================
// Trang Shop - Hiển thị và tìm kiếm sản phẩm đồ cũ
// =============================================================================

document.addEventListener("DOMContentLoaded", function () {
  initializeShopPage();
});

let currentPage = 1;
let totalPages = 1;
let currentFilters = {
  search: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  condition: "",
  location: "",
  sortBy: "newest",
};

async function initializeShopPage() {
  // Lấy tham số từ URL
  loadFiltersFromURL();

  // Setup event listeners
  setupEventListeners();

  // Load categories cho filter
  await loadCategories();

  // Load sản phẩm
  await loadPosts();

  // Update active filters UI
  updateActiveFiltersUI();
}

function loadFiltersFromURL() {
  const urlParams = new URLSearchParams(window.location.search);

  currentFilters.search = urlParams.get("search") || "";
  currentFilters.category = urlParams.get("category") || "";
  currentFilters.minPrice = urlParams.get("minPrice") || "";
  currentFilters.maxPrice = urlParams.get("maxPrice") || "";
  currentFilters.condition = urlParams.get("condition") || "";
  currentFilters.location = urlParams.get("location") || "";
  currentFilters.sortBy = urlParams.get("sortBy") || "newest";
  currentPage = parseInt(urlParams.get("page")) || 1;

  // Update form inputs
  const searchInput = document.querySelector("#searchInput");
  if (searchInput && currentFilters.search) {
    searchInput.value = currentFilters.search;
  }
}

function setupEventListeners() {
  // Search form
  const searchForm = document.querySelector("#searchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", handleSearch);
  }

  // Filter form
  const filterForm = document.querySelector("#filterForm");
  if (filterForm) {
    filterForm.addEventListener("submit", handleFilter);
  }

  // Sort dropdown
  const sortSelect = document.querySelector("#sortSelect");
  if (sortSelect) {
    sortSelect.value = currentFilters.sortBy;
    sortSelect.addEventListener("change", handleSortChange);
  }

  // Price range inputs
  const minPriceInput = document.querySelector("#minPrice");
  const maxPriceInput = document.querySelector("#maxPrice");
  if (minPriceInput && maxPriceInput) {
    minPriceInput.value = currentFilters.minPrice;
    maxPriceInput.value = currentFilters.maxPrice;
  }

  // Clear filters button
  const clearFiltersBtn = document.querySelector("#clearFiltersBtn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearAllFilters);
  }

  // Pagination
  setupPaginationListeners();
}

async function loadCategories() {
  try {
    const response = await ApiService.get("/categories");
    const categories = response.data;

    const categorySelect = document.querySelector("#categorySelect");
    if (categorySelect) {
      categorySelect.innerHTML = '<option value="">Tất cả danh mục</option>';
      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category._id;
        option.textContent = category.tenDanhMuc;
        if (category._id === currentFilters.category) {
          option.selected = true;
        }
        categorySelect.appendChild(option);
      });
    }

    // Update sidebar categories
    updateSidebarCategories(categories);
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

function updateSidebarCategories(categories) {
  const sidebarCategories = document.querySelector(".categories-list");
  if (!sidebarCategories) return;

  let html =
    '<div class="nav-item"><a href="#" class="nav-link" data-category="">Tất cả danh mục</a></div>';

  categories.forEach((category) => {
    const isActive = category._id === currentFilters.category ? "active" : "";
    html += `
            <div class="nav-item">
                <a href="#" class="nav-link ${isActive}" data-category="${
      category._id
    }">
                    ${category.tenDanhMuc}
                    <span class="badge badge-secondary ml-auto">${
                      category.soLuongBaiDang || 0
                    }</span>
                </a>
            </div>
        `;
  });

  sidebarCategories.innerHTML = html;

  // Add click listeners
  sidebarCategories.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const categoryId = this.getAttribute("data-category");

      // Update active state
      sidebarCategories
        .querySelectorAll(".nav-link")
        .forEach((l) => l.classList.remove("active"));
      this.classList.add("active");

      // Apply filter
      currentFilters.category = categoryId;
      currentPage = 1;
      updateURL();
      loadPosts();
    });
  });
}

async function loadPosts() {
  try {
    showLoadingState();

    // Build query parameters
    const params = {
      page: currentPage,
      limit: 12,
      sortBy: currentFilters.sortBy,
    };

    if (currentFilters.search) params.search = currentFilters.search;
    if (currentFilters.category) params.category = currentFilters.category;
    if (currentFilters.minPrice) params.minPrice = currentFilters.minPrice;
    if (currentFilters.maxPrice) params.maxPrice = currentFilters.maxPrice;
    if (currentFilters.condition) params.condition = currentFilters.condition;
    if (currentFilters.location) params.location = currentFilters.location;

    const response = await ApiService.get("/posts/search", params);
    const {
      posts,
      totalPages: total,
      currentPage: page,
      totalPosts,
    } = response.data;

    totalPages = total;
    currentPage = page;

    // Update posts grid
    displayPosts(posts);

    // Update pagination
    updatePagination();

    // Update results count
    updateResultsCount(totalPosts);

    hideLoadingState();
  } catch (error) {
    console.error("Error loading posts:", error);
    Utils.showToast("Không thể tải danh sách sản phẩm", "error");
    hideLoadingState();
  }
}

function displayPosts(posts) {
  const postsContainer = document.querySelector("#postsContainer");
  if (!postsContainer) return;

  if (posts.length === 0) {
    postsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">Không tìm thấy sản phẩm phù hợp</h5>
                <p class="text-muted">Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc</p>
                <button class="btn btn-primary" onclick="clearAllFilters()">Xóa tất cả bộ lọc</button>
            </div>
        `;
    return;
  }

  let html = "";
  posts.forEach((post) => {
    html += createPostCard(post);
  });

  postsContainer.innerHTML = html;

  // Add click listeners for post cards
  postsContainer.querySelectorAll(".product-item").forEach((card) => {
    card.addEventListener("click", function () {
      const postId = this.getAttribute("data-post-id");
      window.location.href = `detail.html?id=${postId}`;
    });
  });
}

function createPostCard(post) {
  const imageUrl =
    post.hinhAnh && post.hinhAnh.length > 0
      ? post.hinhAnh[0]
      : "img/product-placeholder.jpg";

  const price = post.gia > 0 ? Utils.formatCurrency(post.gia) : "Trao đổi";

  const condition = getConditionText(post.tinhTrang);
  const timeAgo = Utils.formatRelativeTime(post.ngayDang);

  return `
        <div class="col-lg-4 col-md-6 col-sm-6 pb-1">
            <div class="product-item bg-light mb-4 cursor-pointer" data-post-id="${
              post._id
            }">
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
                        }" onclick="event.stopPropagation()">
                            <i class="fa fa-eye"></i>
                        </a>
                        <a class="btn btn-outline-dark btn-square" href="#" onclick="startChat('${
                          post.nguoiDang._id
                        }', event)">
                            <i class="fa fa-comment"></i>
                        </a>
                    </div>
                </div>
                <div class="text-center py-4">
                    <a class="h6 text-decoration-none text-truncate" href="detail.html?id=${
                      post._id
                    }" onclick="event.stopPropagation()">${post.tieuDe}</a>
                    <div class="d-flex align-items-center justify-content-center mt-2">
                        <h5 class="text-primary mb-0">${price}</h5>
                    </div>
                    <div class="d-flex align-items-center justify-content-center mt-1">
                        <small class="text-muted mr-2">
                            <i class="fas fa-map-marker-alt"></i> ${post.diaChi}
                        </small>
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> ${timeAgo}
                        </small>
                    </div>
                    <div class="mt-1">
                        <span class="badge badge-${getConditionBadgeClass(
                          post.tinhTrang
                        )}">${condition}</span>
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

// Event Handlers
async function handleSearch(e) {
  e.preventDefault();
  const searchInput = document.querySelector("#searchInput");
  currentFilters.search = searchInput.value.trim();
  currentPage = 1;
  updateURL();
  await loadPosts();
}

async function handleFilter(e) {
  e.preventDefault();

  // Get filter values
  currentFilters.category =
    document.querySelector("#categorySelect")?.value || "";
  currentFilters.minPrice = document.querySelector("#minPrice")?.value || "";
  currentFilters.maxPrice = document.querySelector("#maxPrice")?.value || "";
  currentFilters.condition =
    document.querySelector("#conditionSelect")?.value || "";
  currentFilters.location =
    document.querySelector("#locationSelect")?.value || "";

  currentPage = 1;
  updateURL();
  await loadPosts();
  updateActiveFiltersUI();
}

async function handleSortChange(e) {
  currentFilters.sortBy = e.target.value;
  currentPage = 1;
  updateURL();
  await loadPosts();
}

function clearAllFilters() {
  // Reset filters
  currentFilters = {
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    condition: "",
    location: "",
    sortBy: "newest",
  };
  currentPage = 1;

  // Reset form inputs
  const searchInput = document.querySelector("#searchInput");
  if (searchInput) searchInput.value = "";

  const categorySelect = document.querySelector("#categorySelect");
  if (categorySelect) categorySelect.value = "";

  const minPrice = document.querySelector("#minPrice");
  if (minPrice) minPrice.value = "";

  const maxPrice = document.querySelector("#maxPrice");
  if (maxPrice) maxPrice.value = "";

  const conditionSelect = document.querySelector("#conditionSelect");
  if (conditionSelect) conditionSelect.value = "";

  const locationSelect = document.querySelector("#locationSelect");
  if (locationSelect) locationSelect.value = "";

  const sortSelect = document.querySelector("#sortSelect");
  if (sortSelect) sortSelect.value = "newest";

  // Update URL and reload
  updateURL();
  loadPosts();
  updateActiveFiltersUI();
}

function updateActiveFiltersUI() {
  const activeFiltersContainer = document.querySelector("#activeFilters");
  if (!activeFiltersContainer) return;

  let html = "";

  if (currentFilters.search) {
    html += `<span class="badge badge-primary mr-2 mb-2">Tìm kiếm: ${currentFilters.search} <i class="fas fa-times ml-1" onclick="removeFilter('search')"></i></span>`;
  }

  if (currentFilters.category) {
    html += `<span class="badge badge-info mr-2 mb-2">Danh mục <i class="fas fa-times ml-1" onclick="removeFilter('category')"></i></span>`;
  }

  if (currentFilters.minPrice || currentFilters.maxPrice) {
    const priceText = `${currentFilters.minPrice || "0"} - ${
      currentFilters.maxPrice || "∞"
    }`;
    html += `<span class="badge badge-success mr-2 mb-2">Giá: ${priceText} <i class="fas fa-times ml-1" onclick="removeFilter('price')"></i></span>`;
  }

  if (currentFilters.condition) {
    html += `<span class="badge badge-warning mr-2 mb-2">Tình trạng <i class="fas fa-times ml-1" onclick="removeFilter('condition')"></i></span>`;
  }

  activeFiltersContainer.innerHTML = html;
  activeFiltersContainer.style.display = html ? "block" : "none";
}

function removeFilter(filterType) {
  switch (filterType) {
    case "search":
      currentFilters.search = "";
      document.querySelector("#searchInput").value = "";
      break;
    case "category":
      currentFilters.category = "";
      document.querySelector("#categorySelect").value = "";
      break;
    case "price":
      currentFilters.minPrice = "";
      currentFilters.maxPrice = "";
      document.querySelector("#minPrice").value = "";
      document.querySelector("#maxPrice").value = "";
      break;
    case "condition":
      currentFilters.condition = "";
      document.querySelector("#conditionSelect").value = "";
      break;
  }

  currentPage = 1;
  updateURL();
  loadPosts();
  updateActiveFiltersUI();
}

// Pagination
function setupPaginationListeners() {
  document.addEventListener("click", function (e) {
    if (e.target.matches(".page-link[data-page]")) {
      e.preventDefault();
      const page = parseInt(e.target.getAttribute("data-page"));
      if (page !== currentPage) {
        currentPage = page;
        updateURL();
        loadPosts();
        Utils.scrollToTop();
      }
    }
  });
}

function updatePagination() {
  const paginationContainer = document.querySelector("#pagination");
  if (!paginationContainer) return;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  let html =
    '<div class="col-12"><nav><ul class="pagination justify-content-center">';

  // Previous button
  const prevDisabled = currentPage === 1 ? "disabled" : "";
  html += `
        <li class="page-item ${prevDisabled}">
            <a class="page-link" href="#" data-page="${
              currentPage - 1
            }">Trước</a>
        </li>
    `;

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    html +=
      '<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>';
    if (startPage > 2) {
      html +=
        '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const active = i === currentPage ? "active" : "";
    html += `<li class="page-item ${active}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html +=
        '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
    html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
  }

  // Next button
  const nextDisabled = currentPage === totalPages ? "disabled" : "";
  html += `
        <li class="page-item ${nextDisabled}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Sau</a>
        </li>
    `;

  html += "</ul></nav></div>";
  paginationContainer.innerHTML = html;
}

function updateResultsCount(total) {
  const resultsCount = document.querySelector("#resultsCount");
  if (resultsCount) {
    const start = (currentPage - 1) * 12 + 1;
    const end = Math.min(currentPage * 12, total);
    resultsCount.textContent = `Hiển thị ${start}-${end} trong tổng số ${total} sản phẩm`;
  }
}

function updateURL() {
  const params = new URLSearchParams();

  if (currentFilters.search) params.set("search", currentFilters.search);
  if (currentFilters.category) params.set("category", currentFilters.category);
  if (currentFilters.minPrice) params.set("minPrice", currentFilters.minPrice);
  if (currentFilters.maxPrice) params.set("maxPrice", currentFilters.maxPrice);
  if (currentFilters.condition)
    params.set("condition", currentFilters.condition);
  if (currentFilters.location) params.set("location", currentFilters.location);
  if (currentFilters.sortBy !== "newest")
    params.set("sortBy", currentFilters.sortBy);
  if (currentPage > 1) params.set("page", currentPage);

  const newURL = params.toString()
    ? `${window.location.pathname}?${params}`
    : window.location.pathname;
  window.history.replaceState({}, "", newURL);
}

// Utility functions
function showLoadingState() {
  const postsContainer = document.querySelector("#postsContainer");
  if (postsContainer) {
    postsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Đang tải...</span>
                </div>
                <p class="mt-3 text-muted">Đang tải sản phẩm...</p>
            </div>
        `;
  }
}

function hideLoadingState() {
  // Loading state will be replaced by posts content
}

// Save/Unsave post
async function toggleSavePost(postId, event) {
  event.stopPropagation();
  event.preventDefault();

  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Vui lòng đăng nhập để lưu sản phẩm", "warning");
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

// Start chat with post owner
function startChat(userId, event) {
  event.stopPropagation();
  event.preventDefault();

  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Vui lòng đăng nhập để nhắn tin", "warning");
    return;
  }

  window.location.href = `messages.html?user=${userId}`;
}

// Export functions for global use
window.toggleSavePost = toggleSavePost;
window.startChat = startChat;
window.removeFilter = removeFilter;
