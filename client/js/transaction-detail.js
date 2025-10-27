// =============================================================================
// Transaction Detail Page Logic
// =============================================================================

(function () {
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    try {
      // Must be logged in
      if (!AuthManager.isLoggedIn()) {
        Utils.showToast('Vui lòng đăng nhập để xem giao dịch', 'warning');
        setTimeout(() => (window.location.href = 'login.html'), 1500);
        return;
      }

      const id = Utils.getQueryParam('id');
      if (!id) {
        Utils.showToast('Thiếu ID giao dịch', 'error');
        setTimeout(() => (window.location.href = 'profile.html?tab=transactions'), 1500);
        return;
      }

      await loadTransaction(id);
    } catch (e) {
      console.error('[TransactionDetail:init] error', e);
      Utils.showToast('Không thể tải chi tiết giao dịch', 'error');
    }
  }

  async function loadTransaction(id) {
    const res = await ApiService.get(`/transactions/${id}`);
    const tx = res.transaction || res.data || res; // be tolerant to shape

    // Update status
    const statusBadge = document.getElementById('statusBadge');
    if (statusBadge) statusBadge.textContent = humanizeStatus(tx.trangThai);

    // Product info
    const product = tx.baiDang;
    if (product) {
      const img = document.getElementById('productImage');
      if (img) img.src = (product.hinhAnh && product.hinhAnh[0]) || 'img/product-placeholder.jpg';
      const title = document.getElementById('productTitle');
      if (title) title.textContent = product.tieuDe || 'Sản phẩm';
      const price = document.getElementById('productPrice');
      if (price) price.textContent = Utils.formatCurrency(product.gia || tx.giaThanhToan || 0);
    }

    // Participants
    const buyerInfo = document.getElementById('buyerInfo');
    if (buyerInfo && tx.nguoiMua) buyerInfo.textContent = `${tx.nguoiMua.hoTen || 'Người mua'} (${tx.nguoiMua.soDienThoai || '---'})`;
    const sellerInfo = document.getElementById('sellerInfo');
    if (sellerInfo && tx.nguoiBan) sellerInfo.textContent = `${tx.nguoiBan.hoTen || 'Người bán'} (${tx.nguoiBan.soDienThoai || '---'})`;

    // Payment
    document.getElementById('paymentMethod').textContent = mapPayment(tx.phuongThucThanhToan);
    document.getElementById('paymentAmount').textContent = Utils.formatCurrency(tx.giaThanhToan || product?.gia || 0);

    // Summary
    document.getElementById('summaryPrice').textContent = Utils.formatCurrency(product?.gia || tx.giaThanhToan || 0);
    const shippingFee = 0; // future: compute
    document.getElementById('summaryShipping').textContent = Utils.formatCurrency(shippingFee);
    document.getElementById('summaryTotal').textContent = Utils.formatCurrency((product?.gia || tx.giaThanhToan || 0) + shippingFee);

    // Actions
    renderActions(tx);
  }

  function renderActions(tx) {
    const container = document.getElementById('actionButtons');
    if (!container) return;
    container.innerHTML = '';

    const me = AuthManager.getUser();
    const isSeller = tx.nguoiBan?._id === me?._id;
    const isBuyer = tx.nguoiMua?._id === me?._id;

    // Accept (seller only) when đang-thỏa-thuận
    if (isSeller && tx.trangThai === 'dang-thoa-thuan') {
      container.appendChild(makeBtn('Chấp nhận giao dịch', 'success', () => updateStatus(tx._id, 'accept')));
    }
    // Complete (both) when đã-đồng-ý
    if ((isBuyer || isSeller) && tx.trangThai === 'da-dong-y') {
      container.appendChild(makeBtn('Đánh dấu hoàn thành', 'primary', () => updateStatus(tx._id, 'complete')));
    }
    // Cancel (both) when chưa hoàn thành
    if ((isBuyer || isSeller) && tx.trangThai !== 'hoan-thanh' && tx.trangThai !== 'huy-bo') {
      container.appendChild(makeBtn('Hủy giao dịch', 'danger', () => cancelTx(tx._id)));
    }
  }

  function makeBtn(text, style, onClick) {
    const btn = document.createElement('button');
    btn.className = `btn btn-${style}`;
    btn.textContent = text;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      Utils.showLoading(btn);
      try {
        await onClick();
      } catch (e) {
        Utils.showToast(e.message || 'Thao tác thất bại', 'error');
      } finally {
        Utils.hideLoading(btn);
      }
    });
    return btn;
  }

  async function updateStatus(id, action) {
    let endpoint = '';
    if (action === 'accept') endpoint = `/transactions/${id}/accept`;
    if (action === 'complete') endpoint = `/transactions/${id}/complete`;
    if (!endpoint) return;
    const res = await ApiService.patch(endpoint, {});
    Utils.showToast(res.message || 'Cập nhật thành công', 'success');
    await loadTransaction(id); // reload
  }

  async function cancelTx(id) {
    const reason = prompt('Lý do hủy (tuỳ chọn):');
    const res = await ApiService.patch(`/transactions/${id}/cancel`, { lyDoHuy: reason || 'Không có lý do' });
    Utils.showToast(res.message || 'Đã hủy giao dịch', 'success');
    await loadTransaction(id);
  }

  function mapPayment(m) {
    switch (m) {
      case 'tien-mat': return 'Tiền mặt';
      case 'chuyen-khoan': return 'Chuyển khoản';
      case 'trao-doi': return 'Trao đổi';
      case 'mien-phi': return 'Miễn phí';
      default: return m || '--';
    }
  }

  function humanizeStatus(s) {
    const map = {
      'dang-thoa-thuan': 'Đang thỏa thuận',
      'da-dong-y': 'Đã đồng ý',
      'hoan-thanh': 'Hoàn thành',
      'huy-bo': 'Hủy bỏ',
    };
    return map[s] || s || '--';
  }
})();
