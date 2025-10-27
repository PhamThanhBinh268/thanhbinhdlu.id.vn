// =============================================================================
// Trang Shop - Hiển thị và tìm kiếm sản phẩm đồ cũ
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
  initializeShopPage();
  // Khi Admin cập nhật sản phẩm (tags/states), tự làm mới danh sách hiện tại
  let refreshTimer = null;
  window.addEventListener('post:updated', () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      try { loadPosts(); } catch(_) {}
    }, 300);
  });
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

  // Init pill toolbar bindings
  initPillToolbar();
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
    clearFiltersBtn.addEventListener("click", function(e){ e.preventDefault(); clearAllFilters(); });
  }

  // Pagination
  setupPaginationListeners();
}

function initPillToolbar(){
  // Giá: panel với 2 range + 2 input + áp dụng/xóa
  const priceMenu = document.querySelector('#pillPriceMenu');
  if (priceMenu){
    const minRange = priceMenu.querySelector('#priceMinRange');
    const maxRange = priceMenu.querySelector('#priceMaxRange');
    const minInput = priceMenu.querySelector('#minPriceInput');
    const maxInput = priceMenu.querySelector('#maxPriceInput');
    const applyBtn = priceMenu.querySelector('#applyPriceBtn');
    const clearBtn = priceMenu.querySelector('#clearPriceBtn');

    const MAX = parseInt(maxRange?.max || '5000000000', 10);

    // Helpers
    const parseMoney = (v)=>{
      if (!v) return 0;
      // remove all non-digits
      const num = String(v).replace(/[^0-9]/g,'');
      return num ? parseInt(num,10) : 0;
    };
    const formatMoney = (n)=> Utils.formatCurrency ? Utils.formatCurrency(n) : n.toLocaleString('vi-VN');
    const clamp = (v,min,max)=> Math.max(min, Math.min(max, v));

    // init values from currentFilters
    const startMin = currentFilters.minPrice ? parseInt(currentFilters.minPrice,10) : 0;
    const startMax = currentFilters.maxPrice ? parseInt(currentFilters.maxPrice,10) : MAX;
    if (minRange) minRange.value = clamp(startMin, 0, MAX);
    if (maxRange) maxRange.value = clamp(startMax, 0, MAX);
    if (minInput) minInput.value = startMin ? formatMoney(startMin) : '';
    if (maxInput) maxInput.value = startMax && startMax !== MAX ? formatMoney(startMax) : '';

    // keep ranges ordered
    const syncTrack = ()=>{
      if (!minRange || !maxRange) return;
      let a = parseInt(minRange.value,10); let b = parseInt(maxRange.value,10);
      if (a > b) { const t=a; a=b; b=t; minRange.value=a; maxRange.value=b; }
      // reflect to inputs if user is using sliders
      if (minInput) minInput.value = a ? formatMoney(a) : '';
      if (maxInput) maxInput.value = (b && b !== MAX) ? formatMoney(b) : '';
      // draw track using CSS vars
      const p1 = (a/MAX)*100; const p2 = (b/MAX)*100;
      priceMenu.style.setProperty('--price-p1', p1+"%");
      priceMenu.style.setProperty('--price-p2', p2+"%");
    };
    minRange && minRange.addEventListener('input', syncTrack);
    maxRange && maxRange.addEventListener('input', syncTrack);
    syncTrack();

    // inputs -> ranges
    const syncFromInputs = ()=>{
      const mi = clamp(parseMoney(minInput?.value||''), 0, MAX);
      const ma = clamp(parseMoney(maxInput?.value||''), 0, MAX);
      if (minRange) minRange.value = Math.min(mi, ma || MAX);
      if (maxRange) maxRange.value = ma || MAX;
      syncTrack();
    };
    minInput && minInput.addEventListener('change', syncFromInputs);
    maxInput && maxInput.addEventListener('change', syncFromInputs);

    // Apply / Clear
    applyBtn && applyBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      const a = parseInt(minRange?.value||'0',10);
      const b = parseInt(maxRange?.value||String(MAX),10);
      currentFilters.minPrice = a ? String(a) : '';
      currentFilters.maxPrice = (b && b !== MAX) ? String(b) : '';
      currentPage = 1; updateURL(); loadPosts(); updateActiveFiltersUI();
      closeParentDropdown(applyBtn);
    });
    clearBtn && clearBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      if (minRange) minRange.value = 0;
      if (maxRange) maxRange.value = MAX;
      if (minInput) minInput.value='';
      if (maxInput) maxInput.value='';
      currentFilters.minPrice=''; currentFilters.maxPrice='';
      currentPage=1; updateURL(); loadPosts(); updateActiveFiltersUI();
      closeParentDropdown(clearBtn);
    });
  }
  const conditionMenu = document.querySelector('#pillConditionMenu');
  if (conditionMenu){
    conditionMenu.querySelectorAll('a[data-condition]')?.forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        currentFilters.condition = a.getAttribute('data-condition') || '';
        currentPage = 1; updateURL(); loadPosts(); updateActiveFiltersUI();
      });
    });
  }
  document.querySelectorAll('.pill-area[data-location]')?.forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      currentFilters.location = btn.getAttribute('data-location');
      currentPage = 1; updateURL(); loadPosts(); updateActiveFiltersUI();
    });
  });

  const nearbyBtn = document.getElementById('nearbyBtn');
  if (nearbyBtn && navigator.geolocation){
    // đảm bảo không bị disabled/mờ
    try { nearbyBtn.disabled = false; nearbyBtn.classList.remove('disabled'); } catch(_){}
    nearbyBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      navigator.geolocation.getCurrentPosition(()=>{
        // For now, set a generic value to widen search around current area
        // You can enhance by reverse geocoding later
        currentFilters.location = 'Gần tôi';
        currentPage = 1; updateURL(); loadPosts(); updateActiveFiltersUI();
      }, ()=>{
        Utils.showToast('Không lấy được vị trí. Vui lòng cho phép truy cập vị trí.', 'warning');
      });
    });
  } else if (nearbyBtn) {
    // Trình duyệt không hỗ trợ geolocation: vẫn để nút rõ ràng nhưng thông báo
    try { nearbyBtn.disabled = false; nearbyBtn.classList.remove('disabled'); } catch(_){}
    nearbyBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      Utils.showToast('Trình duyệt không hỗ trợ xác định vị trí.', 'warning');
    });
  }
}

function closeParentDropdown(el){
  const dd = el.closest('.dropdown');
  if (!dd) return;
  // Bootstrap toggles have 'show' on both toggle and menu
  dd.querySelector('.dropdown-menu')?.classList.remove('show');
  dd.querySelector('[data-toggle="dropdown"]')?.classList.remove('show');
}

async function loadCategories() {
  try {
    const response = await ApiService.get("/categories");
    const categories = response.categories || response.data || response;

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

    // Populate pill category dropdown
    const pillMenu = document.getElementById('pillCategoryMenu');
    const pillText = document.getElementById('pillCategoryText');
    if (pillMenu){
      // keep the default 'all'
      categories.forEach(cat=>{
        const a = document.createElement('a');
        a.className = 'dropdown-item';
        a.href = '#';
        a.dataset.category = cat._id;
        a.textContent = cat.tenDanhMuc;
        a.addEventListener('click', (e)=>{
          e.preventDefault();
          currentFilters.category = cat._id;
          if (pillText) pillText.textContent = cat.tenDanhMuc;
          currentPage = 1; updateURL(); loadPosts(); updateActiveFiltersUI();
        });
        pillMenu.appendChild(a);
      });
      // 'all' handler
      const allLink = pillMenu.querySelector('a[data-category=""]');
      if (allLink){
        allLink.addEventListener('click', (e)=>{ e.preventDefault(); currentFilters.category=''; if (pillText) pillText.textContent='Tất cả danh mục'; currentPage=1; updateURL(); loadPosts(); updateActiveFiltersUI(); });
      }
      // init text
      if (pillText && currentFilters.category){
        const found = categories.find(c=>c._id===currentFilters.category);
        if (found) pillText.textContent = found.tenDanhMuc;
      }
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
      limit: currentLimit || 12,
      sortBy: currentFilters.sortBy,
    };

    if (currentFilters.search) params.search = currentFilters.search;
    if (currentFilters.category) params.category = currentFilters.category;
    if (currentFilters.minPrice) params.minPrice = currentFilters.minPrice;
    if (currentFilters.maxPrice) params.maxPrice = currentFilters.maxPrice;
    if (currentFilters.condition) params.condition = currentFilters.condition;
    if (currentFilters.location) params.location = currentFilters.location;
    if (currentFilters.loaiGia) params.loaiGia = currentFilters.loaiGia;

    const response = await ApiService.get("/posts/search", params);
    const {
      posts,
      totalPages: total,
      currentPage: page,
      totalPosts,
    } = response.data;

    totalPages = total;
    currentPage = page;

    // C2C: Sort posts by service priority (Featured > VIP > Boost > Regular)
    const sortedPosts = sortPostsByServicePriority(posts);

    // Update posts grid
    displayPosts(sortedPosts);

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

  // Add click listeners for post cards (avoid conflicts with inner links)
  postsContainer.querySelectorAll(".product-item").forEach((card) => {
    card.addEventListener("click", function (e) {
      // Check if clicked element is a link or button
      if (e.target.closest('a') || e.target.closest('button')) {
        return; // Let the link handle the click
      }
      
      const postId = this.getAttribute("data-post-id");
      
      if (!postId) {
        console.error("❌ No post ID found!");
        return;
      }
      
      // Prevent any default behavior
      e.preventDefault();
      e.stopPropagation();
      window.location.href = `detail.html?id=${postId}`;
    });
  });
}

function createPostCard(post) {
  const imageUrl =
    post.hinhAnh && post.hinhAnh.length > 0
      ? post.hinhAnh[0]
      : "img/product-placeholder.jpg";

  const basePrice = (window.Formatters ? Formatters.getPriceLabel(post.loaiGia, post.gia) : (post.loaiGia === 'cho-mien-phi' ? '<span class="text-success">Miễn phí</span>' : (post.loaiGia === 'trao-doi' ? '<span class="text-primary">Trao đổi</span>' : Utils.formatCurrency(post.gia || 0))));

  const condition = (window.Formatters ? Formatters.getConditionText(post.tinhTrang) : getConditionText(post.tinhTrang));
  const highlightClass = (window.ProductDecorators && ProductDecorators.isHighlighted(post)) ? ' product-highlight' : '';
  const priceBlock = (window.ProductDecorators ? ProductDecorators.applyPrice(post, basePrice) : `<h5 class=\"text-primary mb-0\">${basePrice}</h5>`);
  const productBadges = (window.ProductDecorators ? ProductDecorators.renderBadges(post) : '');
  const when = post.createdAt || post.ngayDang || post.updatedAt;
  const timeAgo = Utils.formatRelativeTime(when);

  return `
        <div class="col-lg-4 col-md-6 col-sm-6 pb-1">
            <div class="product-item bg-light mb-4 cursor-pointer${highlightClass}" data-post-id="${
              post._id
            }">
        <div class="product-img position-relative overflow-hidden">
          <img class="img-fluid w-100" style="height:100%;object-fit:cover;" src="${imageUrl}" alt="${
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
                        ${post.nguoiDang ? `<a class="btn btn-outline-dark btn-square" href="#" onclick="startChat('${
                          post.nguoiDang._id
                        }', event)">
                            <i class="fa fa-comment"></i>
                        </a>` : ''}
                    </div>
                </div>
                <div class="text-center py-4 product-info-area" style="cursor: pointer;">
                    <h6 class="text-decoration-none text-truncate mb-2" style="color: #333;">${post.tieuDe}</h6>
          <div class="d-flex align-items-center justify-content-center mt-2">
            ${priceBlock}
          </div>
                    <div class="d-flex align-items-center justify-content-center mt-1">
            <small class="text-muted mr-2">
              <i class="fas fa-map-marker-alt"></i> ${(window.Formatters ? Formatters.getLocation(post) : (post.diaDiem || post.diaChi || ''))}
            </small>
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> ${timeAgo}
                        </small>
                    </div>
          <div class="mt-1">
            <span class="badge badge-${(window.Formatters ? Formatters.getConditionBadgeClass(post.tinhTrang) : getConditionBadgeClass(post.tinhTrang))}">${condition}</span>
            ${productBadges ? `<span class="ml-1">${productBadges}</span>` : ''}
          </div>
                    <div class="mt-2">
                        <small class="text-muted">👆 Click để xem chi tiết</small>
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
    const fmt = (n)=> n ? (Utils.formatCurrency ? Utils.formatCurrency(parseInt(n,10)) : Number(n).toLocaleString('vi-VN')) : '';
    const priceText = `${fmt(currentFilters.minPrice) || "0"} - ${
      fmt(currentFilters.maxPrice) || "∞"
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
    const limit = currentLimit || 12;
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);
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

// =============================================================================
// Enhanced Filter & Sort System
// =============================================================================

// State for new filter system
let currentFilterType = ''; // '', 'ban', 'trao-doi', 'cho-mien-phi'
let currentSort = 'newest';
let currentLimit = 12;

// Initialize new filter system
function initNewFilterSystem() {
  
  // Check ALL bg-light p-3 containers
  const allContainers = document.querySelectorAll('.bg-light.p-3');
  allContainers.forEach((container, index) => {
  });
  
  // Try more specific selector
  const filterContainer = document.querySelector('.col-12.pb-1 .bg-light.p-3.rounded');
  if (filterContainer) {
  }
  
  // NEW BUTTON CHECK
  const newFilterBtn = document.getElementById('newFilterTypeBtn');
  
  // Setup NEW filter button
  document.querySelectorAll('.filter-option').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const filterType = this.getAttribute('data-filter-type');
      currentFilterType = filterType;
      
      const btnText = filterType === '' ? 'Tất cả' : 
                     filterType === 'ban' ? 'Mua' :
                     filterType === 'trao-doi' ? 'Trao đổi' : 'Miễn phí';
      const textSpan = document.getElementById('filterTypeText');
      if (textSpan) textSpan.textContent = `Lọc: ${btnText}`;
      
      updateSortOptions(filterType);
      applyNewFilters();
    });
  });
  
  // DEBUG: Check if filterTypeBtn exists as text in HTML
  
  // Filter Type Dropdown
  document.querySelectorAll('[data-filter-type]').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const filterType = this.getAttribute('data-filter-type');
      currentFilterType = filterType;
      
      // Update button text
      const btnText = filterType === '' ? 'Tất cả' : 
                     filterType === 'ban' ? 'Mua' :
                     filterType === 'trao-doi' ? 'Trao đổi' : 'Miễn phí';
      document.getElementById('filterTypeBtn').innerHTML = `<i class="fas fa-filter"></i> Lọc: ${btnText}`;
      
      // Update sort options based on filter type
      updateSortOptions(filterType);
      
      // Apply filter
      applyNewFilters();
    });
  });
  
  // Sort Dropdown
  document.querySelectorAll('[data-sort]').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const sort = this.getAttribute('data-sort');
      currentSort = sort;
      
      // Update button text
      const sortText = sort === 'newest' ? 'Mới nhất' :
                      sort === 'oldest' ? 'Cũ nhất' :
                      sort === 'price-high' ? 'Giá cao trước' : 'Giá thấp trước';
      document.getElementById('sortByBtn').textContent = `Sắp xếp: ${sortText}`;
      
      // Apply filter
      applyNewFilters();
    });
  });
  
  // Limit Dropdown
  document.querySelectorAll('[data-limit]').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const limit = parseInt(this.getAttribute('data-limit'));
      currentLimit = limit;
      document.getElementById('limitBtn').textContent = `Hiển thị: ${limit}`;
      
      // Apply filter
      applyNewFilters();
    });
  });
  
  // Reset Button
  document.getElementById('resetFiltersBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    resetAllFilters();
  });
  
  // View Toggle Button (single button that toggles between grid and list)
  const gridViewBtn = document.getElementById('gridViewBtn');
  const postsContainer = document.getElementById('postsContainer');
  const viewText = document.getElementById('viewText');
  
  // Load saved view mode from localStorage
  const savedViewMode = localStorage.getItem('shopViewMode') || 'grid';
  
  if (gridViewBtn && postsContainer && viewText) {
    // Apply saved view mode on page load
    if (savedViewMode === 'list') {
      postsContainer.classList.add('list-view');
      viewText.textContent = 'Dạng danh sách';
      gridViewBtn.querySelector('i').className = 'fas fa-list mr-1';
    } else {
      postsContainer.classList.remove('list-view');
      viewText.textContent = 'Dạng lưới';
      gridViewBtn.querySelector('i').className = 'fas fa-th mr-1';
    }
    
    // Toggle view on button click
    gridViewBtn.addEventListener('click', function() {
      
      // Toggle between views
      if (postsContainer.classList.contains('list-view')) {
        // Currently in list view, switch to grid view
        postsContainer.classList.remove('list-view');
        viewText.textContent = 'Dạng lưới';
        gridViewBtn.querySelector('i').className = 'fas fa-th mr-1';
        localStorage.setItem('shopViewMode', 'grid');
      } else {
        // Currently in grid view, switch to list view
        postsContainer.classList.add('list-view');
        viewText.textContent = 'Dạng danh sách';
        gridViewBtn.querySelector('i').className = 'fas fa-list mr-1';
        localStorage.setItem('shopViewMode', 'list');
      }
    });
  } else {
    console.error('View toggle elements not found:', {
      gridViewBtn,
      postsContainer,
      viewText
    });
  }
}

// Update sort options based on filter type
function updateSortOptions(filterType) {
  const priceHighOption = document.querySelector('[data-sort="price-high"]');
  const priceLowOption = document.querySelector('[data-sort="price-low"]');
  
  if (filterType === 'ban') {
    // Show price sort for "Mua"
    priceHighOption.style.display = 'block';
    priceLowOption.style.display = 'block';
  } else {
    // Hide price sort for other types
    priceHighOption.style.display = 'none';
    priceLowOption.style.display = 'none';
    
    // Reset to newest if current sort is price
    if (currentSort === 'price-high' || currentSort === 'price-low') {
      currentSort = 'newest';
      document.getElementById('sortByBtn').textContent = 'Sắp xếp: Mới nhất';
    }
  }
}

// Apply new filters
function applyNewFilters() {
  // Update currentFilters object
  if (currentFilterType) {
    currentFilters.loaiGia = currentFilterType;
  } else {
    delete currentFilters.loaiGia;
  }
  
  // Map sort values to API format
  if (currentSort === 'price-high') {
    currentFilters.sortBy = 'price_high';
  } else if (currentSort === 'price-low') {
    currentFilters.sortBy = 'price_low';
  } else if (currentSort === 'oldest') {
    currentFilters.sortBy = 'oldest';
  } else {
    currentFilters.sortBy = 'newest';
  }
  
  // Reset to page 1
  currentPage = 1;
  
  // Reload posts
  loadPosts();
  
  // Update URL
  updateURL();
}

// Reset all filters
function resetAllFilters() {
  // Reset filter type
  currentFilterType = '';
  document.getElementById('filterTypeBtn').innerHTML = '<i class="fas fa-filter"></i> Lọc: Tất cả';
  
  // Reset sort
  currentSort = 'newest';
  document.getElementById('sortByBtn').textContent = 'Sắp xếp: Mới nhất';
  
  // Reset limit
  currentLimit = 12;
  document.getElementById('limitBtn').textContent = 'Hiển thị: 12';
  
  // Hide price sort options
  updateSortOptions('');
  
  // Clear all other filters
  currentFilters = {
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    condition: "",
    location: "",
    sortBy: "newest",
  };
  
  // Clear search input
  const searchInput = document.querySelector("#searchInput");
  if (searchInput) searchInput.value = "";
  
  // Clear price inputs
  document.getElementById('minPriceInput').value = '';
  document.getElementById('maxPriceInput').value = '';
  
  // Reset price range sliders
  document.getElementById('priceMinRange').value = 0;
  document.getElementById('priceMaxRange').value = 5000000000;
  
  // Reset page
  currentPage = 1;
  
  // Reload posts
  loadPosts();
  
  // Update URL
  window.history.pushState({}, '', window.location.pathname);
  
  // Update UI
  updateActiveFiltersUI();
  
  Utils.showToast('Đã làm mới bộ lọc', 'info');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  
  // Set up MutationObserver to catch when filterTypeBtn is removed
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          const hasFilterBtn = node.querySelector && node.querySelector('#filterTypeBtn');
          if (hasFilterBtn || node.id === 'filterTypeBtn') {
            console.error('🚨 filterTypeBtn WAS REMOVED!');
            console.error('🚨 Removed node:', node);
            console.error('🚨 Stack trace:', new Error().stack);
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Check IMMEDIATELY if filterTypeBtn exists
  
  // Delay to ensure DOM is fully ready after header injection
  setTimeout(() => {
    initNewFilterSystem();
  }, 100);
  
  // Check again after 500ms
  setTimeout(() => {
  }, 500);
  
  // Check again after 1000ms
  setTimeout(() => {
  }, 1000);
});
