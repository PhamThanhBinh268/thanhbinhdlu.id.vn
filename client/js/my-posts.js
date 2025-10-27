// My Posts page
(function(){
  document.addEventListener('DOMContentLoaded', init);
  let state = { page:1, limit:10, total:0 };

  async function init(){
    if (!AuthManager.isLoggedIn()){
      Utils.showToast('Bạn cần đăng nhập để xem bài đăng của mình', 'warning');
      setTimeout(()=>{ window.location.href='/login.html'; }, 1200);
      return;
    }
    document.getElementById('applyFilterBtn').addEventListener('click', ()=>{ state.page=1; load(); });
    document.getElementById('prevPageBtn').addEventListener('click', ()=>{ if(state.page>1){state.page--; load();}});
    document.getElementById('nextPageBtn').addEventListener('click', ()=>{ const pages=Math.ceil(state.total/state.limit)||1; if(state.page<pages){state.page++; load();}});
    await load();
  }

  function getParams(){
    const status = document.getElementById('statusFilter').value;
    const params = { page: state.page, limit: state.limit };
    if (status) params.trangThai = status;
    return params;
  }

  async function load(){
    try{
      const res = await ApiService.get('/posts/mine', getParams());
      const items = res.data || res.posts || [];
      state.total = res.pagination?.total || items.length;
      render(items);
      renderPagination();
    }catch(e){
      Utils.showToast('Không thể tải bài đăng của bạn: '+e.message, 'error');
    }
  }

  function render(items){
    const tbody = document.querySelector('#myPostsTable tbody');
    if(!tbody) return;
    if(items.length===0){ tbody.innerHTML='<tr><td colspan="4" class="text-center text-muted">Không có dữ liệu</td></tr>'; return; }
    tbody.innerHTML = items.map(p=>`
      <tr>
        <td><a href="/detail.html?id=${p._id}">${escapeHtml(p.tieuDe)}</a></td>
        <td>${renderStatus(p.trangThai, p.lyDoTuChoi)}</td>
        <td>${Utils.formatDateTime(p.createdAt)}</td>
        <td>${renderActions(p)}</td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-action="hide"]').forEach(b=>b.addEventListener('click', onHide));
    tbody.querySelectorAll('[data-action="unhide"]').forEach(b=>b.addEventListener('click', onUnhide));
  }

  function renderStatus(status, reason){
    const map={pending:'warning', approved:'success', rejected:'danger', hidden:'dark', sold:'secondary'};
    let html = `<span class="badge badge-${map[status]||'light'}">${status}</span>`;
    if(status==='rejected' && reason){ html += `<div class="small text-muted mt-1">${escapeHtml(reason)}</div>`;}
    return html;
  }

  function renderActions(p){
    const arr=[];
    if(p.trangThai!=='hidden') arr.push(`<button class="btn btn-sm btn-outline-secondary" data-action="hide" data-id="${p._id}">Ẩn</button>`);
    if(p.trangThai==='hidden') arr.push(`<button class="btn btn-sm btn-outline-primary" data-action="unhide" data-id="${p._id}">Hiển thị</button>`);
    return arr.join(' ');
  }

  async function onHide(e){ await updateStatus(e.currentTarget.dataset.id, 'hidden'); }
  async function onUnhide(e){ await updateStatus(e.currentTarget.dataset.id, 'pending'); }

  async function updateStatus(id, status){
    try{
      await ApiService.put(`/posts/${id}`, { trangThai: status });
      await load();
      Utils.showToast('Đã cập nhật trạng thái', 'success');
    }catch(err){ Utils.showToast('Không thể cập nhật: '+err.message, 'error'); }
  }

  function renderPagination(){
    const pages = Math.ceil(state.total/state.limit)||1;
    document.getElementById('paginationInfo').textContent = `Trang ${state.page}/${pages} - Tổng ${state.total}`;
  }

  function escapeHtml(s){
    return (s||'').replace(/[&<>"]+/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
})();
