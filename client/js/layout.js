// layout.js - dynamically load shared header and footer, manage nav state & auth UI
(function () {
  const HEADER_ID = "app-header";
  const FOOTER_ID = "app-footer";
  // Dùng đường dẫn tuyệt đối để tránh 404 khi ở các trang con như /admin/
  const PARTIAL_BASE = "/partials";

  function fetchPartial(path) {
    return fetch(path, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error("Không thể tải partial: " + path);
      return r.text();
    });
  }

  function inject(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function highlightActiveNav() {
    const map = {
      "index.html": "home",
      "shop.html": "shop",
      "create-post.html": "create",
      "messages.html": "messages",
      "profile.html": "profile",
      "contact.html": "contact",
      "login.html": "login",
      "signup.html": "signup",
      "checkout.html": "checkout",
      "detail.html": "detail",
    };
    const file = window.location.pathname.split("/").pop() || "index.html";
    const id = map[file];
    if (!id) return;
    document.querySelectorAll("#mainNav a[data-link-id]").forEach((a) => {
      if (a.getAttribute("data-link-id") === id) a.classList.add("active");
      else a.classList.remove("active");
    });
  }

  function buildUserArea() {
    const navContainer = document.getElementById("navUserArea");
    const topContainer = document.getElementById("topUserArea");
    const authButtons = document.getElementById("authButtons");
    
    // Check if there are multiple topUserArea elements
    const allTopUserAreas = document.querySelectorAll('#topUserArea');
    allTopUserAreas.forEach((el, i) => {
    });
    
    if (navContainer) { navContainer.innerHTML = ""; navContainer.style.display = 'none'; }
    if (topContainer) topContainer.innerHTML = "";
    if (authButtons) authButtons.innerHTML = "";

    if (!(window.AuthManager && AuthManager.isLoggedIn())) {
      // Hiển thị button Đăng Nhập và Đăng Ký khi chưa đăng nhập
      if (authButtons) {
        authButtons.innerHTML = `
          <a href="login.html" class="text-body mr-3">Đăng Nhập</a>
          <a href="signup.html" class="text-body">Đăng Ký</a>
        `;
      }
      if (topContainer) {
        topContainer.innerHTML = "";
      }
      return;
    }

    const user = AuthManager.getUser();
    const avatar = (user?.avatar && !/via\.placeholder\.com/.test(user.avatar))
      ? user.avatar
      : "/img/user.jpg";
    const displayName = user?.hoTen || user?.tenHienThi || user?.ten || "Tài Khoản";
    const isAdmin = user?.vaiTro === 'admin';

    // Hiển thị tên user trong authButtons (top bar)
    if (authButtons) {
      authButtons.innerHTML = `
        <span class="text-body mr-3">
          <i class="fas fa-user mr-1"></i>
          ${displayName}
        </span>
      `;
    }

    const renderDropdown = (theme) => {
      const textClass = theme === 'dark' ? 'text-light' : 'text-dark';
      return `
        <div class="dropdown">
          <a href="#" id="userDropdownToggle" class="d-flex align-items-center" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <img src="${avatar}" class="rounded-circle" style="width:40px;height:40px;object-fit:cover" alt="avatar" />
            <i class="fas fa-chevron-down ml-2 ${textClass}"></i>
          </a>
          <div class="dropdown-menu dropdown-menu-right bg-primary border-0 m-0" aria-labelledby="userDropdownToggle">
            <h6 class="dropdown-header ${textClass}">${displayName}</h6>
            ${isAdmin ? '<a href="admin/dashboard.html" class="dropdown-item"><i class="fas fa-tools mr-2"></i>Quản trị</a><div class="dropdown-divider"></div>' : ''}
            <a href="profile.html" class="dropdown-item">Hồ Sơ</a>
            <a href="create-post.html" class="dropdown-item">Đăng Tin</a>
            <a href="messages.html" class="dropdown-item">Tin Nhắn</a>
            <a href="contact.html" class="dropdown-item">Liên Hệ</a>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item d-flex align-items-center">
              <i class="fas fa-headset mr-2"></i> Hỗ Trợ Khách Hàng: <strong class="ml-1">+012 345 6789</strong>
            </div>
            <div class="dropdown-divider"></div>
            <a href="#" id="logoutLink" class="dropdown-item text-danger">Đăng Xuất</a>
          </div>
        </div>`;
    };

  // Hidden per request: do not render user dropdown in navbar area
    if (topContainer) {
      topContainer.innerHTML = renderDropdown('light');
    }

    const bindLogout = (root) => {
      const logout = root && root.querySelector && root.querySelector('#logoutLink');
      if (logout) {
        logout.addEventListener('click', (e) => {
          e.preventDefault();
          AuthManager.logout();
          window.location.href = 'login.html';
        });
      }
    };
    if (navContainer) bindLogout(navContainer);
    if (topContainer) bindLogout(topContainer);
  }

  function afterLoad() {
    highlightActiveNav();
    buildUserArea();
    loadCategoriesNav();
    initEnhancedSearch();

    // Load badges
    refreshUnreadBadge();
    refreshProposalBadge();

    // Listen for global user updates (e.g., avatar/name changed in profile)
    window.addEventListener('user:updated', (e) => {
      const data = e?.detail?.user;
      if (data) {
        try { AuthManager.setUser(data); } catch (_) {}
      }
      buildUserArea();
      refreshUnreadBadge();
    });

    refreshUnreadBadge();
    refreshCartBadge();
    refreshProposalBadge();

    // Update cart badge when other tabs or pages modify cart
    try {
      window.addEventListener('storage', function(e){
        if (e.key === 'cartItems') refreshCartBadge();
      });
      window.addEventListener('cart:updated', function(){ refreshCartBadge(); });
    } catch (_) {}
  }

  async function refreshProposalBadge() {
    try {
      if (!window.AuthManager || !AuthManager.isLoggedIn()) return;
      
      const base = (window.API_CONFIG && API_CONFIG.BASE_URL) || (window.location.origin + '/api');
      const res = await fetch(base + '/transactions?type=selling&trangThai=cho-duyet&limit=100', {
        headers: { ...(AuthManager.getAuthHeaders()) }
      });
      const data = await res.json().catch(() => ({}));
      const proposals = data.transactions || [];
      const count = proposals.length;
      
      const badge = document.getElementById('proposalBadge');
      if (!badge) return;
      
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    } catch (e) {
      // silent
    }
  }

  async function refreshUnreadBadge() {
    try {
      if (!window.AuthManager || !AuthManager.isLoggedIn()) return;
      // Try via SocketManager helper if available
      if (window.socketManager && socketManager.updateUnreadMessagesBadge) {
        await socketManager.updateUnreadMessagesBadge();
        return;
      }
      // Fallback direct call
      const res = await fetch(((window.API_CONFIG && API_CONFIG.BASE_URL) || (window.location.origin + '/api')) + '/messages/unread/count', {
        headers: { ...(AuthManager.getAuthHeaders()) }
      });
      const data = await res.json().catch(() => ({}));
      const count = data.unreadCount || data?.data?.unreadCount || 0;
      const badge = document.querySelector('.messages-badge');
      if (!badge) return;
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    } catch (e) {
      // silent
    }
  }

  function refreshCartBadge(){
    try {
      let items = [];
      try { items = JSON.parse(localStorage.getItem('cartItems') || '[]'); } catch(_) { items = []; }
      const count = Array.isArray(items) ? items.reduce((sum, it) => sum + (parseInt(it.qty||1,10) || 0), 0) : 0;
      document.querySelectorAll('.cart-badge').forEach((badge)=>{
        if (count > 0) {
          badge.textContent = count > 99 ? '99+' : String(count);
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      });
    } catch (_) {
      // silent
    }
  }

  // Load categories into the vertical navbar to keep consistent with system categories
  async function loadCategoriesNav() {
    try {
      const nav = document.getElementById('categoryNav');
      if (!nav) return;

      const base = (window.API_CONFIG && API_CONFIG.BASE_URL) || (window.location.origin + '/api');
      const res = await fetch(base + '/categories');
      const data = await res.json().catch(() => ({}));
      const categories = data.categories || data.data || [];
      if (!Array.isArray(categories) || categories.length === 0) return; // keep existing links if none

      // Move "Khác" category to the bottom regardless of API order
      const normalize = (s) => (s || '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
      const isOther = (c) => {
        const name = normalize(c.tenDanhMuc || c.name || c.title);
        const slug = normalize(c.slug);
        return name === 'khac' || slug === 'other' || slug === 'khac';
      };
      const others = categories.filter(isOther);
      const mainCats = categories.filter((c) => !isOther(c));
      const ordered = mainCats.concat(others);

      // Build list items linking to shop.html with category param
      const html = ordered
        .map((c) => `<a href="/shop.html?category=${c._id}" class="nav-item nav-link">${c.tenDanhMuc || c.name || c.title || 'Danh Mục'}</a>`) 
        .join('');
      nav.innerHTML = html;
    } catch (e) {
      // silently ignore and keep default nav
    }
  }

  function init() {
    Promise.all([
      fetchPartial(`${PARTIAL_BASE}/header.html`).then((h) =>
        inject(HEADER_ID, h)
      ),
      fetchPartial(`${PARTIAL_BASE}/footer.html`).then((f) =>
        inject(FOOTER_ID, f)
      ),
    ])
      .then(() => {
        afterLoad();
        // Thông báo cho các trang rằng layout đã sẵn sàng
        window.dispatchEvent(new Event("layout:ready"));
      })
      .catch((err) => console.error("[layout] Lỗi tải partial:", err));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
/**
 * Enhanced search bar: category + province/district + keyword
 */
async function initEnhancedSearch() {
  try {
    const catSel = document.getElementById('searchCategorySelect');
    const provSel = document.getElementById('searchProvinceSelect');
    const distSel = document.getElementById('searchDistrictSelect');
    const form = document.getElementById('globalSearchForm');
    if (!form) return;

    // Populate categories
    if (catSel) {
      try {
        const base = (window.API_CONFIG && API_CONFIG.BASE_URL) || (window.location.origin + '/api');
        const res = await fetch(base + '/categories');
        const data = await res.json().catch(() => ({}));
        const categories = data.categories || data.data || [];
        catSel.innerHTML = '<option value="">Tất cả danh mục</option>' +
          categories.map(c => `<option value="${c._id}">${c.tenDanhMuc}</option>`).join('');
      } catch (_) {
        // keep default
      }
    }

    // Load provinces/districts (cache 7 days)
    let geo = null;
    const cacheKey = 'vn_geo_cache_v1';
    const cacheTsKey = 'vn_geo_cache_time';
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    try {
      const ts = parseInt(localStorage.getItem(cacheTsKey) || '0', 10);
      if (ts && (now - ts) < weekMs) {
        geo = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      }
    } catch (_) {}

    if (!geo) {
      try {
        const r = await fetch('https://provinces.open-api.vn/api/?depth=2', { cache: 'force-cache' });
        if (r.ok) {
          geo = await r.json();
          try { localStorage.setItem(cacheKey, JSON.stringify(geo)); localStorage.setItem(cacheTsKey, String(now)); } catch(_) {}
        }
      } catch (_) {}
    }
    // Fallback to bundled lightweight data
    if (!geo) {
      try {
        const r2 = await fetch('/js/vn-geo-fallback.json', { cache: 'no-cache' });
        if (r2.ok) geo = await r2.json();
      } catch(_) {}
    }

    // Populate provinces
    if (provSel && Array.isArray(geo)) {
      const options = ['<option value="all">Toàn quốc</option>']
        .concat(geo.map(p => `<option value="${p.code}">${p.name}</option>`));
      provSel.innerHTML = options.join('');

      provSel.addEventListener('change', function() {
        const code = this.value;
        if (code === 'all') {
          if (distSel) {
            distSel.innerHTML = '<option value="">Quận/Huyện</option>';
            distSel.disabled = true;
          }
          return;
        }
        const province = geo.find(p => String(p.code) === String(code));
        if (!province || !distSel) return;
        const districts = Array.isArray(province.districts) ? province.districts : [];
        distSel.innerHTML = '<option value="">Quận/Huyện</option>' +
          districts.map(d => `<option value="${d.code}">${d.name}</option>`).join('');
        distSel.disabled = false;
      });
    }

    // Form submit -> build shop URL
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const kw = (document.getElementById('globalSearchInput')?.value || '').trim();
      const cat = catSel ? catSel.value : '';
      const provCode = provSel ? provSel.value : 'all';
      const distCode = distSel ? distSel.value : '';

      let locationText = '';
      if (Array.isArray(geo)) {
        const prov = geo.find(p => String(p.code) === String(provCode));
        const dist = prov && Array.isArray(prov.districts) ? prov.districts.find(d => String(d.code) === String(distCode)) : null;
        if (dist) locationText = dist.name;
        else if (prov && provCode !== 'all') locationText = prov.name;
      }

      const params = new URLSearchParams();
      if (kw) params.set('search', kw);
      if (cat) params.set('category', cat);
      if (locationText) params.set('location', locationText);
      const url = '/shop.html' + (params.toString() ? ('?' + params.toString()) : '');
      window.location.href = url;
    });
  } catch (e) {
    // silent
  }
}
