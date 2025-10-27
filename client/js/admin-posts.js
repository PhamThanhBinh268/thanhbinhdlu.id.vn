// Admin - Quản lý bài đăng

(function(){
  document.addEventListener('DOMContentLoaded', init);

  let state = { page: 1, limit: 20, total: 0 };

  async function init(){
    // Chỉ cho phép admin
    const user = AuthManager.getUser();
    
    if (!user || user.vaiTro !== 'admin') {
      Utils.showToast('Bạn không có quyền truy cập trang quản trị', 'error');
      window.location.href = '../index.html';
      return;
    }
    
    // Events
    document.getElementById('applyFilterBtn').addEventListener('click', () => { state.page = 1; loadPosts(); });
    document.getElementById('prevPageBtn').addEventListener('click', () => { if (state.page>1){ state.page--; loadPosts(); }});
    document.getElementById('nextPageBtn').addEventListener('click', () => { const pages = Math.ceil(state.total/state.limit); if (state.page<pages){ state.page++; loadPosts(); }});

    await loadPosts();
  }

  function getFilters(){
    const filters = {
      page: state.page,
      limit: state.limit
    };
    
    const search = document.getElementById('searchInput')?.value.trim();
    const trangThai = document.getElementById('statusFilter')?.value;
    
    if (search) filters.search = search;
    if (trangThai) filters.trangThai = trangThai;
    
    return filters;
  }

  async function loadPosts(){
    try {
      const params = getFilters();
      const res = await ApiService.get('/posts/admin', params);
      const posts = res.data || res.posts || [];
      state.total = res.pagination?.total || posts.length;

      renderTable(posts);
      renderPagination();
    } catch (e) {
      console.error('❌ Error loading posts:', e);
      Utils.showToast('Không thể tải danh sách bài đăng (admin): '+e.message, 'error');
    }
  }

  function renderTable(posts){
    const tbody = document.querySelector('#postsTable tbody');
    if (!tbody) return;

    if (posts.length === 0){
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Không có dữ liệu</td></tr>';
      return;
    }

    const rows = posts.map(p => {
      // Sử dụng tinhNangDichVu.noiBat từ model mới thay vì tags
      const isHighlighted = p.tinhNangDichVu?.noiBat || false;
      
      // Hiển thị badges từ tinhNangDichVu (VIP, Boost, Featured)
      const badges = [];
      if (isHighlighted) badges.push(`<span class="badge badge-warning"><i class="fas fa-star"></i> Nổi bật</span>`);
      if (p.tinhNangDichVu?.tinVip) badges.push(`<span class="badge badge-purple ml-1"><i class="fas fa-crown"></i> VIP</span>`);
      if (p.tinhNangDichVu?.dayTin) badges.push(`<span class="badge badge-info ml-1"><i class="fas fa-rocket"></i> Boost</span>`);
      
      // Hiển thị seller discount nếu có
      if (p.tyLeGiamGia && p.tyLeGiamGia > 0) {
        badges.push(`<span class="badge badge-danger ml-1">-${p.tyLeGiamGia}%</span>`);
      }
      
      return `
      <tr>
        <td>
          <div class="d-flex align-items-center">
            <img src="${(p.hinhAnh && p.hinhAnh[0]) || '../img/product-placeholder.jpg'}" style="width:56px;height:42px;object-fit:cover;border-radius:4px;margin-right:8px;" />
            <div>
              <div class="font-weight-bold">${escapeHtml(p.tieuDe)}</div>
              <div class="small text-muted">${escapeHtml(p.moTa || '').slice(0,60)}</div>
            </div>
          </div>
        </td>
        <td>${p.danhMuc?.tenDanhMuc || '-'}</td>
        <td>${p.nguoiDang?.hoTen || '-'}<div class="small text-muted">${p.nguoiDang?.email || ''}</div></td>
        <td>
          <div class="d-flex align-items-center" style="gap:8px; flex-wrap: wrap;">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" ${isHighlighted ? 'checked' : ''} data-role="highlight" data-id="${p._id}">
              <label class="form-check-label">
                <i class="fas fa-star text-warning"></i> Đánh dấu nổi bật
              </label>
            </div>
            <button class="btn btn-sm btn-primary" data-action="save-featured" data-id="${p._id}">
              <i class="fas fa-save"></i> Lưu
            </button>
          </div>
          <div class="mt-2">${badges.join(' ') || '<span class="text-muted small">Không có dịch vụ</span>'}</div>
        </td>
        <td>${renderStatus(p.trangThai, p.lyDoTuChoi)}</td>
        <td>${Utils.formatDateTime(p.createdAt)}</td>
        <td>
          ${renderActions(p)}
        </td>
      </tr>
    `});

    tbody.innerHTML = rows.join('');

    // Bind actions
    tbody.querySelectorAll('[data-action="approve"]').forEach(btn => btn.addEventListener('click', onApprove));
    tbody.querySelectorAll('[data-action="reject"]').forEach(btn => btn.addEventListener('click', onReject));
    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', onDelete));
    tbody.querySelectorAll('[data-action="save-featured"]').forEach(btn => btn.addEventListener('click', onSaveFeatured));
  }

  function renderStatus(status, reason){
    const map = {
      pending: { cls:'warning', txt:'Chờ duyệt' },
      approved: { cls:'success', txt:'Đã duyệt' },
      rejected: { cls:'danger', txt:'Từ chối' },
      sold: { cls:'secondary', txt:'Đã bán' },
      hidden: { cls:'dark', txt:'Ẩn' },
    };
    const s = map[status] || { cls:'light', txt:status };
    let html = `<span class="badge badge-${s.cls}">${s.txt}</span>`;
    if (status==='rejected' && reason){ html += `<div class="small text-muted mt-1">${escapeHtml(reason)}</div>`; }
    return html;
  }

  function renderActions(p){
    const id = p._id;
    const btns = [];
    if (p.trangThai !== 'approved') btns.push(`<button class="btn btn-sm btn-success mr-1" data-action="approve" data-id="${id}"><i class="fas fa-check"></i></button>`);
    if (p.trangThai !== 'rejected') btns.push(`<button class="btn btn-sm btn-warning mr-1" data-action="reject" data-id="${id}"><i class="fas fa-times"></i></button>`);
    btns.push(`<button class="btn btn-sm btn-danger" data-action="delete" data-id="${id}"><i class="fas fa-trash"></i></button>`);
    return btns.join('');
  }

  function renderPagination(){
    const pages = Math.ceil(state.total / state.limit) || 1;
    document.getElementById('paginationInfo').textContent = `Trang ${state.page}/${pages} - Tổng ${state.total}`;
  }

  async function onApprove(e){
    const id = e.currentTarget.getAttribute('data-id');
    try {
      Utils.showToast('Đang duyệt...', 'info');
      await ApiService.patch(`/posts/${id}/approve`, {});
      await loadPosts();
      Utils.showToast('Đã duyệt bài đăng', 'success');
    } catch (err){
      Utils.showToast('Không thể duyệt: '+err.message, 'error');
    }
  }

  async function onReject(e){
    const id = e.currentTarget.getAttribute('data-id');
    const reason = prompt('Nhập lý do từ chối:');
    if (reason === null) return;
    if (!reason.trim()) { Utils.showToast('Vui lòng nhập lý do', 'warning'); return; }
    try {
      Utils.showToast('Đang từ chối...', 'info');
      await ApiService.patch(`/posts/${id}/reject`, { lyDoTuChoi: reason.trim() });
      await loadPosts();
      Utils.showToast('Đã từ chối bài đăng', 'success');
    } catch (err){
      Utils.showToast('Không thể từ chối: '+err.message, 'error');
    }
  }

  async function onDelete(e){
    const id = e.currentTarget.getAttribute('data-id');
    if (!confirm('Bạn chắc chắn muốn xóa bài đăng này?')) return;
    try {
      await ApiService.delete(`/posts/${id}`);
      await loadPosts();
      Utils.showToast('Đã xóa bài đăng', 'success');
    } catch (err){
      Utils.showToast('Không thể xóa: '+err.message, 'error');
    }
  }

  async function onSaveFeatured(e){
    const id = e.currentTarget.getAttribute('data-id');
    const row = e.currentTarget.closest('tr');
    if (!row) return;
    
    const highlightCheckbox = row.querySelector('input[data-role="highlight"][data-id="'+id+'"]');
    const noiBat = !!(highlightCheckbox && highlightCheckbox.checked);

    try {
      Utils.showToast('Đang cập nhật trạng thái nổi bật...', 'info');
      
      // Gọi API với tinhNangDichVu.noiBat mới
      await ApiService.put(`/posts/${id}`, { 
        'tinhNangDichVu.noiBat': noiBat 
      });
      
      // Reload danh sách để phản ánh thay đổi từ server
      await loadPosts();
      Utils.showToast(`Đã ${noiBat ? 'đánh dấu' : 'bỏ đánh dấu'} nổi bật`, 'success');
    } catch (err){
      console.error('Save featured error:', err);
      Utils.showToast('Không thể cập nhật: '+err.message, 'error');
    }
  }

  function escapeHtml(s){
    return (s||'').replace(/[&<>"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
})();
