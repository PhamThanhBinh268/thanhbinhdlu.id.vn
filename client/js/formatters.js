// =============================================================================
// Formatters & Strategy helpers for display logic
// =============================================================================
(function(){
  function getPriceLabel(loaiGia, gia){
    if (loaiGia === 'cho-mien-phi') return '<span class="text-success">Miễn phí</span>';
    if (loaiGia === 'trao-doi') return '<span class="text-primary">Trao đổi</span>';
    return (window.Utils && Utils.formatCurrency) ? Utils.formatCurrency(gia || 0) : String(gia || 0);
  }

  function getConditionText(tinhTrang){
    const map = {
      'moi': 'Mới',
      'nhu-moi': 'Như mới',
      'tot': 'Tốt',
      'kha': 'Khá',
      'can-sua-chua': 'Cần sửa chữa',
    };
    return map[tinhTrang] || tinhTrang || '';
  }

  function getConditionBadgeClass(tinhTrang){
    const map = {
      'moi': 'success',
      'nhu-moi': 'info',
      'tot': 'primary',
      'kha': 'warning',
      'can-sua-chua': 'danger',
    };
    return map[tinhTrang] || 'secondary';
  }

  function getLocation(post){
    if (!post) return '';
    return post.diaDiem || post.diaChi || '';
  }

  window.Formatters = { getPriceLabel, getConditionText, getConditionBadgeClass, getLocation };
})();
