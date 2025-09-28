// layout.js - dynamically load shared header and footer, manage nav state & auth UI
(function () {
  const HEADER_ID = "app-header";
  const FOOTER_ID = "app-footer";
  const PARTIAL_BASE = "partials";

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
    const container = document.getElementById("navUserArea");
    if (!container) return;
    container.innerHTML = "";
    if (window.AuthManager && AuthManager.isLoggedIn()) {
      const user = AuthManager.getUser();
      const avatar = user?.avatar || "img/user.jpg";
      container.innerHTML = `
        <div class="nav-item dropdown">
          <a href="#" class="nav-link dropdown-toggle d-flex align-items-center" data-toggle="dropdown">
            <img src="${avatar}" class="rounded-circle mr-2" style="width:40px;height:40px;object-fit:cover" alt="avatar" />
            <span class="text-light">${
              user?.tenHienThi || user?.ten || "Tài Khoản"
            }</span>
          </a>
          <div class="dropdown-menu dropdown-menu-right bg-primary border-0 rounded-0 m-0">
            <a href="profile.html" class="dropdown-item">Hồ Sơ</a>
            <a href="create-post.html" class="dropdown-item">Đăng Tin</a>
            <a href="messages.html" class="dropdown-item">Tin Nhắn</a>
            <div class="dropdown-divider"></div>
            <a href="#" id="logoutLink" class="dropdown-item text-danger">Đăng Xuất</a>
          </div>
        </div>`;
      const logout = container.querySelector("#logoutLink");
      if (logout) {
        logout.addEventListener("click", (e) => {
          e.preventDefault();
          AuthManager.logout();
          window.location.href = "login.html";
        });
      }
    } else {
      container.innerHTML = `
        <div class="btn-group">
          <a href="login.html" class="btn btn-sm btn-light">Đăng Nhập</a>
          <a href="signup.html" class="btn btn-sm btn-light ml-2">Đăng Ký</a>
        </div>`;
    }
  }

  function afterLoad() {
    highlightActiveNav();
    buildUserArea();
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
        // Re-run Bootstrap dropdown binding if needed
        if (typeof $ !== "undefined" && $.fn.dropdown) {
          $('[data-toggle="dropdown"]').dropdown();
        }
        afterLoad();
        // Thông báo cho các trang rằng layout đã sẵn sàng
        window.dispatchEvent(new Event("layout:ready"));
      })
      .catch((err) => console.error("[layout] Lỗi tải partial:", err));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
