(function() {
  'use strict';

  // Check authentication
  const currentUser = AuthManager.getUser();
  if (!currentUser) {
    window.location.href = '/login.html';
    return;
  }

  // Initialize page
  $(document).ready(function() {
    // Load both tabs immediately to update badge counts
    loadReceivedProposals();
    loadSentProposals();
    
    // Tab change event
    $('#transactionTabs a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
      const target = $(e.target).attr('href');
      if (target === '#received') {
        loadReceivedProposals();
      } else if (target === '#sent') {
        loadSentProposals();
      }
    });

    // Filter change events
    $('#receivedStatusFilter').on('change', loadReceivedProposals);
    $('#sentStatusFilter').on('change', loadSentProposals);

    // Event delegation for dynamically created buttons
    $(document).on('click', '.btn-accept-proposal', function() {
      const id = $(this).data('id');
      acceptProposal(id);
    });

    $(document).on('click', '.btn-reject-proposal', function() {
      const id = $(this).data('id');
      rejectProposal(id);
    });

    $(document).on('click', '.btn-cancel-proposal', function() {
      const id = $(this).data('id');
      cancelProposal(id);
    });

    $(document).on('click', '.btn-complete-transaction', function() {
      const id = $(this).data('id');
      completeTransaction(id);
    });

    $(document).on('click', '.btn-view-details', function() {
      const id = $(this).data('id');
      viewProposalDetails(id);
    });

    $(document).on('click', '.btn-setup-payment', function() {
      const transactionData = $(this).data('transaction');
      showPaymentSetupModal(transactionData);
    });
  });

  // Load proposals received by current user (as seller)
  window.loadReceivedProposals = async function() {
    const container = $('#receivedProposalsContainer');
    const statusFilter = $('#receivedStatusFilter').val();
    
    try {
      container.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');

      const params = new URLSearchParams({
        type: 'selling', // Proposals where I'm the seller
        limit: 100
      });
      if (statusFilter) params.append('trangThai', statusFilter);
      const response = await ApiService.get(`/transactions?${params.toString()}`);
      
      const proposals = response.transactions || [];

      // Update count badge - show total count
      $('#receivedCount').text(proposals.length);

      if (proposals.length === 0) {
        container.html(renderEmptyState('Chưa có đề nghị nào'));
        return;
      }

      const html = proposals.map(p => renderReceivedProposalCard(p)).join('');
      container.html(html);

    } catch (error) {
      console.error('Load received proposals error:', error);
      container.html(renderErrorState('Không thể tải đề nghị: ' + error.message));
    }
  };

  // Load proposals sent by current user (as buyer)
  window.loadSentProposals = async function() {
    const container = $('#sentProposalsContainer');
    const statusFilter = $('#sentStatusFilter').val();
    
    try {
      container.html('<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>');

      const params = new URLSearchParams({
        type: 'buying', // Proposals where I'm the buyer
        limit: 100
      });
      if (statusFilter) params.append('trangThai', statusFilter);
      const response = await ApiService.get(`/transactions?${params.toString()}`);
      
      const proposals = response.transactions || [];

      // Update count badge - show total count
      $('#sentCount').text(proposals.length);

      if (proposals.length === 0) {
        container.html(renderEmptyState('Bạn chưa gửi đề nghị nào'));
        return;
      }

      const html = proposals.map(p => renderSentProposalCard(p)).join('');
      container.html(html);

    } catch (error) {
      console.error('Load sent proposals error:', error);
      container.html(renderErrorState('Không thể tải đề nghị: ' + error.message));
    }
  };

  // Render received proposal card (for seller to review)
  function renderReceivedProposalCard(proposal) {
    const post = proposal.baiDang || {};
    const buyer = proposal.nguoiDeNghi || {};
    const swapPost = proposal.baiDangTraoDoi || {};
    
    const typeLabel = getTypeLabel(proposal.loaiGiaoDich);
    const statusLabel = getStatusLabel(proposal.trangThai);
    const canRespond = proposal.trangThai === 'cho-duyet';

    let proposalDetails = '';
    if (proposal.loaiGiaoDich === 'mua') {
      proposalDetails = `
        <div class="mb-2">
          <strong>Giá đề xuất:</strong> <span class="text-primary font-weight-bold">${Utils.formatCurrency(proposal.giaDeXuat)}</span>
          ${post.gia ? `<small class="text-muted ml-2">(Giá niêm yết: ${Utils.formatCurrency(post.gia)})</small>` : ''}
        </div>
      `;
    } else if (proposal.loaiGiaoDich === 'trao-doi') {
      proposalDetails = `
        <div class="mb-2">
          <strong>Đổi với sản phẩm:</strong>
          <div class="d-flex align-items-center mt-2">
            <img src="${swapPost.hinhAnh?.[0] || '/img/product-placeholder.jpg'}" class="product-thumb mr-3" />
            <div>
              <div class="font-weight-bold">${Utils.escapeHtml(swapPost.tieuDe || 'N/A')}</div>
              ${swapPost.gia ? `<div class="text-muted small">Giá: ${Utils.formatCurrency(swapPost.gia)}</div>` : ''}
            </div>
          </div>
          ${proposal.tienBu > 0 ? `<div class="mt-2"><strong>Tiền bù:</strong> <span class="text-success">${Utils.formatCurrency(proposal.tienBu)}</span></div>` : ''}
        </div>
      `;
    }

    return `
      <div class="transaction-card p-3">
        <div class="row">
          <div class="col-md-2">
            <img src="${post.hinhAnh?.[0] || '/img/product-placeholder.jpg'}" class="product-thumb w-100" />
          </div>
          <div class="col-md-7">
            <div class="d-flex align-items-center mb-2">
              <span class="transaction-type-badge type-${proposal.loaiGiaoDich}">${typeLabel}</span>
              <span class="transaction-type-badge status-${proposal.trangThai} ml-2">${statusLabel}</span>
            </div>
            <h5 class="mb-1">
              <a href="/detail.html?id=${post._id}" class="text-dark">${Utils.escapeHtml(post.tieuDe || 'Bài đăng')}</a>
            </h5>
            <div class="text-muted small mb-3">
              <i class="far fa-clock"></i> ${Utils.formatDateTime(proposal.createdAt)}
            </div>
            
            ${proposalDetails}
            
            ${proposal.loiNhan ? `
              <div class="alert alert-light mb-2">
                <i class="fas fa-comment"></i> <strong>Lời nhắn:</strong> ${Utils.escapeHtml(proposal.loiNhan)}
              </div>
            ` : ''}
            
            ${proposal.phuongThucThanhToan ? `
              <div class="mb-2">
                <strong>💳 Phương thức thanh toán:</strong> 
                <span class="badge badge-info">${formatPaymentMethod(proposal.phuongThucThanhToan)}</span>
              </div>
            ` : ''}
            
            ${proposal.hinhThucGiaoHang ? `
              <div class="mb-2">
                <strong>📦 Hình thức giao hàng:</strong> 
                <span class="badge badge-primary">${formatShippingMethod(proposal.hinhThucGiaoHang)}</span>
                ${proposal.diaDiemGap ? `
                  <div class="mt-1 ml-3">
                    <small><i class="fas fa-map-marker-alt text-danger"></i> <strong>Địa điểm:</strong> ${Utils.escapeHtml(proposal.diaDiemGap)}</small>
                  </div>
                ` : ''}
                ${proposal.diaChiGiaoHang ? `
                  <div class="mt-1 ml-3">
                    <small>
                      <i class="fas fa-home text-success"></i> <strong>Địa chỉ:</strong><br/>
                      <span class="ml-3">Người nhận: ${Utils.escapeHtml(proposal.diaChiGiaoHang.hoTen || '')}</span><br/>
                      <span class="ml-3">SĐT: ${Utils.escapeHtml(proposal.diaChiGiaoHang.soDienThoai || '')}</span><br/>
                      <span class="ml-3">${formatAddress(proposal.diaChiGiaoHang)}</span>
                    </small>
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            <div class="mb-2">
              <strong>Người đề nghị:</strong> 
              <span class="text-primary">${Utils.escapeHtml(buyer.hoTen || 'N/A')}</span>
              ${buyer.diemUyTin ? `<small class="text-muted ml-2"><i class="fas fa-star text-warning"></i> ${buyer.diemUyTin}</small>` : ''}
            </div>

            ${proposal.lyDoTuChoi ? `
              <div class="alert alert-danger mb-0">
                <i class="fas fa-times-circle"></i> <strong>Lý do từ chối:</strong> ${Utils.escapeHtml(proposal.lyDoTuChoi)}
              </div>
            ` : ''}
          </div>
          <div class="col-md-3 text-right">
            ${canRespond ? `
              <button class="btn btn-success btn-block mb-2 btn-accept-proposal" data-id="${proposal._id}">
                <i class="fas fa-check"></i> Đồng ý
              </button>
              <button class="btn btn-danger btn-block mb-2 btn-reject-proposal" data-id="${proposal._id}">
                <i class="fas fa-times"></i> Từ chối
              </button>
            ` : proposal.trangThai === 'da-dong-y' ? `
              <button class="btn btn-info btn-block mb-2 btn-complete-transaction" data-id="${proposal._id}">
                <i class="fas fa-check-circle"></i> Hoàn thành
              </button>
            ` : ''}
            <button class="btn btn-outline-secondary btn-block btn-view-details" data-id="${proposal._id}">
              <i class="fas fa-eye"></i> Chi tiết
            </button>
            <a href="/messages.html?user=${buyer._id}" class="btn btn-outline-primary btn-block">
              <i class="fas fa-comments"></i> Nhắn tin
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Render sent proposal card (for buyer to track)
  function renderSentProposalCard(proposal) {
    const post = proposal.baiDang || {};
    const seller = proposal.nguoiBan || {};
    const swapPost = proposal.baiDangTraoDoi || {};
    
    const typeLabel = getTypeLabel(proposal.loaiGiaoDich);
    const statusLabel = getStatusLabel(proposal.trangThai);
    const canCancel = ['cho-duyet', 'da-dong-y'].includes(proposal.trangThai);

    let proposalDetails = '';
    if (proposal.loaiGiaoDich === 'mua') {
      proposalDetails = `
        <div class="mb-2">
          <strong>Giá đề xuất:</strong> <span class="text-primary font-weight-bold">${Utils.formatCurrency(proposal.giaDeXuat)}</span>
        </div>
      `;
    } else if (proposal.loaiGiaoDich === 'trao-doi') {
      proposalDetails = `
        <div class="mb-2">
          <strong>Đổi với sản phẩm của bạn:</strong>
          <div class="d-flex align-items-center mt-2">
            <img src="${swapPost.hinhAnh?.[0] || '/img/product-placeholder.jpg'}" class="product-thumb mr-3" />
            <div>
              <div class="font-weight-bold">${Utils.escapeHtml(swapPost.tieuDe || 'N/A')}</div>
            </div>
          </div>
          ${proposal.tienBu > 0 ? `<div class="mt-2"><strong>Bạn bù thêm:</strong> <span class="text-success">${Utils.formatCurrency(proposal.tienBu)}</span></div>` : ''}
        </div>
      `;
    }

    return `
      <div class="transaction-card p-3">
        <div class="row">
          <div class="col-md-2">
            <img src="${post.hinhAnh?.[0] || '/img/product-placeholder.jpg'}" class="product-thumb w-100" />
          </div>
          <div class="col-md-7">
            <div class="d-flex align-items-center mb-2">
              <span class="transaction-type-badge type-${proposal.loaiGiaoDich}">${typeLabel}</span>
              <span class="transaction-type-badge status-${proposal.trangThai} ml-2">${statusLabel}</span>
            </div>
            <h5 class="mb-1">
              <a href="/detail.html?id=${post._id}" class="text-dark">${Utils.escapeHtml(post.tieuDe || 'Bài đăng')}</a>
            </h5>
            <div class="text-muted small mb-3">
              <i class="far fa-clock"></i> ${Utils.formatDateTime(proposal.createdAt)}
            </div>
            
            ${proposalDetails}
            
            ${proposal.loiNhan ? `
              <div class="alert alert-light mb-2">
                <i class="fas fa-comment"></i> <strong>Lời nhắn của bạn:</strong> ${Utils.escapeHtml(proposal.loiNhan)}
              </div>
            ` : ''}
            
            ${proposal.phuongThucThanhToan ? `
              <div class="mb-2">
                <strong>💳 Phương thức thanh toán:</strong> 
                <span class="badge badge-info">${formatPaymentMethod(proposal.phuongThucThanhToan)}</span>
              </div>
            ` : ''}
            
            ${proposal.hinhThucGiaoHang ? `
              <div class="mb-2">
                <strong>📦 Hình thức giao hàng:</strong> 
                <span class="badge badge-primary">${formatShippingMethod(proposal.hinhThucGiaoHang)}</span>
                ${proposal.diaDiemGap ? `
                  <div class="mt-1 ml-3">
                    <small><i class="fas fa-map-marker-alt text-danger"></i> <strong>Địa điểm:</strong> ${Utils.escapeHtml(proposal.diaDiemGap)}</small>
                  </div>
                ` : ''}
                ${proposal.diaChiGiaoHang ? `
                  <div class="mt-1 ml-3">
                    <small>
                      <i class="fas fa-home text-success"></i> <strong>Địa chỉ giao hàng:</strong><br/>
                      <span class="ml-3">Người nhận: ${Utils.escapeHtml(proposal.diaChiGiaoHang.hoTen || '')}</span><br/>
                      <span class="ml-3">SĐT: ${Utils.escapeHtml(proposal.diaChiGiaoHang.soDienThoai || '')}</span><br/>
                      <span class="ml-3">${formatAddress(proposal.diaChiGiaoHang)}</span>
                    </small>
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            <div class="mb-2">
              <strong>Người bán:</strong> 
              <span class="text-primary">${Utils.escapeHtml(seller.hoTen || 'N/A')}</span>
            </div>

            ${proposal.lyDoTuChoi ? `
              <div class="alert alert-danger mb-0">
                <i class="fas fa-times-circle"></i> <strong>Lý do từ chối:</strong> ${Utils.escapeHtml(proposal.lyDoTuChoi)}
              </div>
            ` : ''}
          </div>
          <div class="col-md-3 text-right">
            ${proposal.trangThai === 'cho-duyet' ? `
              <div class="alert alert-warning">
                <i class="fas fa-hourglass-half"></i> Đang chờ người bán phản hồi
              </div>
            ` : proposal.trangThai === 'da-dong-y' ? `
              <div class="alert alert-success mb-2">
                <i class="fas fa-check-circle"></i> Người bán đã đồng ý!
              </div>
              <button class="btn btn-primary btn-block mb-2 btn-setup-payment" data-transaction='${JSON.stringify(proposal).replace(/'/g, "&apos;")}'>
                <i class="fas fa-credit-card"></i> Thiết Lập Thanh Toán
              </button>
              <button class="btn btn-info btn-block mb-2 btn-complete-transaction" data-id="${proposal._id}">
                <i class="fas fa-check-circle"></i> Hoàn thành
              </button>
            ` : proposal.trangThai === 'tu-choi' ? `
              <div class="alert alert-danger">
                <i class="fas fa-times-circle"></i> Đã bị từ chối
              </div>
            ` : ''}
            
            ${canCancel ? `
              <button class="btn btn-outline-danger btn-block mb-2 btn-cancel-proposal" data-id="${proposal._id}">
                <i class="fas fa-ban"></i> Hủy đề nghị
              </button>
            ` : ''}
            
            <a href="/messages.html?user=${seller._id}" class="btn btn-outline-primary btn-block">
              <i class="fas fa-comments"></i> Nhắn tin
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Accept proposal (seller action)
  window.acceptProposal = async function(proposalId) {
    if (!confirm('Bạn có chắc chắn muốn đồng ý đề nghị này?')) return;

    try {
      Utils.showToast('Đang xử lý...', 'info');
      await ApiService.patch(`/transactions/${proposalId}/accept`, {});
      Utils.showToast('Đã đồng ý đề nghị!', 'success');
      loadReceivedProposals();
    } catch (error) {
      console.error('Accept proposal error:', error);
      Utils.showToast('Không thể đồng ý: ' + error.message, 'error');
    }
  };

  // Reject proposal (seller action)
  window.rejectProposal = async function(proposalId) {
    const reason = prompt('Nhập lý do từ chối (không bắt buộc):');
    if (reason === null) return; // User cancelled

    try {
      Utils.showToast('Đang xử lý...', 'info');
      await ApiService.patch(`/transactions/${proposalId}/reject`, {
        lyDoTuChoi: reason || 'Không phù hợp'
      });
      Utils.showToast('Đã từ chối đề nghị', 'success');
      loadReceivedProposals();
    } catch (error) {
      console.error('Reject proposal error:', error);
      Utils.showToast('Không thể từ chối: ' + error.message, 'error');
    }
  };

  // Cancel proposal (buyer action)
  window.cancelProposal = async function(proposalId) {
    if (!confirm('Bạn có chắc chắn muốn hủy đề nghị này?')) return;

    try {
      Utils.showToast('Đang xử lý...', 'info');
      await ApiService.patch(`/transactions/${proposalId}/cancel`, {
        lyDoHuy: 'Người mua hủy'
      });
      Utils.showToast('Đã hủy đề nghị', 'success');
      loadSentProposals();
    } catch (error) {
      console.error('Cancel proposal error:', error);
      Utils.showToast('Không thể hủy: ' + error.message, 'error');
    }
  };

  // Complete transaction (both parties can do this)
  window.completeTransaction = async function(proposalId) {
    if (!confirm('Xác nhận giao dịch đã hoàn thành?')) return;

    try {
      Utils.showToast('Đang xử lý...', 'info');
      await ApiService.patch(`/transactions/${proposalId}/complete`, {});
      Utils.showToast('Đã hoàn thành giao dịch!', 'success');
      
      // Reload current tab
      const activeTab = $('#transactionTabs .nav-link.active').attr('href');
      if (activeTab === '#received') {
        loadReceivedProposals();
      } else {
        loadSentProposals();
      }
    } catch (error) {
      console.error('Complete transaction error:', error);
      Utils.showToast('Không thể hoàn thành: ' + error.message, 'error');
    }
  };

  // View proposal details (placeholder - can expand to modal)
  window.viewProposalDetails = async function(proposalId) {
    try {
      const response = await ApiService.get(`/transactions/${proposalId}`);
      const proposal = response.transaction;
      
      // For now, just show alert. Can be expanded to modal
      alert(`Chi tiết đề nghị:\n\nID: ${proposal._id}\nTrạng thái: ${getStatusLabel(proposal.trangThai)}\nLoại: ${getTypeLabel(proposal.loaiGiaoDich)}`);
    } catch (error) {
      Utils.showToast('Không thể tải chi tiết: ' + error.message, 'error');
    }
  };

  // Helper functions
  function getTypeLabel(type) {
    const types = {
      'mua': 'Mua',
      'trao-doi': 'Trao đổi',
      'mien-phi': 'Miễn phí'
    };
    return types[type] || type;
  }

  function getStatusLabel(status) {
    const statuses = {
      'cho-duyet': 'Chờ duyệt',
      'da-dong-y': 'Đã đồng ý',
      'tu-choi': 'Từ chối',
      'hoan-thanh': 'Hoàn thành',
      'huy-bo': 'Hủy bỏ'
    };
    return statuses[status] || status;
  }

  function formatPaymentMethod(method) {
    const methods = {
      'tien-mat': '💵 Tiền mặt',
      'chuyen-khoan': '🏦 Chuyển khoản',
      'momo': '📱 Momo',
      'zalopay': '💳 ZaloPay',
      'khong-can-thanh-toan': '✓ Không cần thanh toán'
    };
    return methods[method] || method;
  }

  function formatShippingMethod(method) {
    const methods = {
      'gap-truc-tiep': '🤝 Gặp trực tiếp',
      'giao-hang-tan-noi': '📦 Giao hàng tận nơi'
    };
    return methods[method] || method;
  }

  function formatAddress(addr) {
    if (!addr) return '';
    const parts = [
      addr.diaChiChiTiet,
      addr.phuongXa,
      addr.quanHuyen,
      addr.tinhThanh
    ].filter(Boolean);
    return parts.join(', ');
  }

  function renderEmptyState(message) {
    return `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <h5>${message}</h5>
        <p class="text-muted">Các đề nghị sẽ xuất hiện ở đây</p>
      </div>
    `;
  }

  function renderErrorState(message) {
    return `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i> ${message}
      </div>
    `;
  }

})();
