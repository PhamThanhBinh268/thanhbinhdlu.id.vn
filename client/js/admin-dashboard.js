// Admin Dashboard - tổng quan
(function(){
  document.addEventListener('DOMContentLoaded', init);

  async function init(){
    // Chỉ cho phép admin
    const user = AuthManager.getUser();
    if (!user || user.vaiTro !== 'admin'){
      Utils.showToast('Bạn không có quyền truy cập trang quản trị', 'error');
      window.location.href = '../index.html';
      return;
    }

    try {
      const res = await ApiService.get('/stats/admin');
      const data = res.data || res;
      renderKPIs(data.totals || {});
      renderRecentPosts(data.recentPosts || []);
      renderRecentUsers(data.recentUsers || []);
    } catch (e){
      Utils.showToast('Không thể tải thống kê admin: '+e.message, 'error');
    }
  }

  function renderKPIs(totals){
    setText('kpiPosts', totals.totalPosts ?? '-');
    setText('kpiUsers', totals.totalUsers ?? '-');
    setText('kpiTransactions', totals.totalTransactions ?? '-');
  }

  function renderRecentPosts(items){
    const tbody = document.querySelector('#recentPostsTable tbody');
    if (!tbody) return;
    if (!items.length){ tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Không có dữ liệu</td></tr>'; return; }
    tbody.innerHTML = items.map(p => `
      <tr>
        <td>${escapeHtml(p.tieuDe)}</td>
        <td><span class="badge badge-light">${escapeHtml(p.trangThai)}</span></td>
        <td>${Utils.formatDateTime(p.createdAt)}</td>
      </tr>
    `).join('');
  }

  function renderRecentUsers(items){
    const tbody = document.querySelector('#recentUsersTable tbody');
    if (!tbody) return;
    if (!items.length){ tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Không có dữ liệu</td></tr>'; return; }
    tbody.innerHTML = items.map(u => `
      <tr>
        <td>${escapeHtml(u.hoTen || '')}</td>
        <td>${escapeHtml(u.email || '')}</td>
        <td><span class="badge badge-${u.vaiTro==='admin'?'success':'secondary'}">${u.vaiTro}</span></td>
        <td>${Utils.formatDateTime(u.createdAt)}</td>
      </tr>
    `).join('');
  }

  function setText(id, value){
    const el = document.getElementById(id); if (el) el.textContent = value;
  }
  function escapeHtml(s){
    return (s||'').replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
})();
