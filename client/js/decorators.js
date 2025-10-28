// =============================================================================
// Decorators for Product and User (client-side, non-invasive)
// =============================================================================
(function(){
  // ------- Helpers -------
  function normalizeTags(tags){
    if (!Array.isArray(tags)) return [];
    return tags.map(t => String(t || '').trim().toLowerCase());
  }

  // DEPRECATED: Old tag-based discount system (C2C: sellers set their own discounts)
  function getDiscountPercentFromTags(tags){
    const list = normalizeTags(tags);
    const found = list.find(t => /^discount-(\d{1,2})$/.test(t));
    if (!found) return 0;
    const m = found.match(/^discount-(\d{1,2})$/);
    const n = parseInt(m[1], 10);
    if (Number.isNaN(n)) return 0;
    return Math.max(1, Math.min(90, n));
  }

  function isHighlighted(tags){
    const list = normalizeTags(tags);
    return list.includes('highlight') || list.includes('sponsored') || list.includes('featured');
  }
  
  // NEW: Get seller discount from post fields (C2C model)
  function getSellerDiscount(post){
    if (!post || !post.tyLeGiamGia) return 0;
    const percent = Number(post.tyLeGiamGia);
    if (isNaN(percent) || percent <= 0) return 0;
    return Math.max(1, Math.min(100, percent));
  }

  function isVerified(post){
    return (post && post.trangThai === 'approved');
  }

  // ------- Product Decorators -------
  const ProductDecorators = {
    // DEPRECATED: Use getSellerDiscount instead (kept for backward compatibility)
    getDiscountPercent(post){
      // Try new field first, fallback to old tag-based
      const sellerDiscount = getSellerDiscount(post);
      if (sellerDiscount > 0) return sellerDiscount;
      return getDiscountPercentFromTags(post && post.tags);
    },
    isHighlighted(post){
      // NEW: Check tinhNangDichVu.noiBat first (admin-marked featured)
      if (post && post.tinhNangDichVu && post.tinhNangDichVu.noiBat) return true;
      // Fallback to old tag-based
      return isHighlighted(post && post.tags);
    },
    isVerified(post){
      return isVerified(post);
    },
    // Return HTML for price block; if discount, show discounted + original
    applyPrice(post, basePriceHtml){
      try {
        if (!post || post.loaiGia !== 'ban') return `<h5 class="text-primary mb-0">${basePriceHtml}</h5>`;
        
        const fmt = (window.Utils && Utils.formatCurrency) ? Utils.formatCurrency : (n)=> n.toLocaleString('vi-VN')+" ₫";
        
        // NEW: C2C seller discount logic (giaGoc + tyLeGiamGia)
        const sellerDiscount = getSellerDiscount(post);
        if (sellerDiscount > 0 && post.giaGoc && post.giaGoc > 0) {
          const discountedPrice = post.gia || Math.round(post.giaGoc * (100 - sellerDiscount) / 100);
          const newPrice = `<h5 class="text-danger mb-0">${fmt(discountedPrice)}</h5>`;
          const oldPrice = `<h6 class="text-muted ml-2"><del>${fmt(post.giaGoc)}</del></h6>`;
          return `${newPrice}${oldPrice}`;
        }
        
        // DEPRECATED: Old tag-based discount (fallback for legacy data)
        const percent = getDiscountPercentFromTags(post && post.tags);
        if (percent > 0 && post.gia && post.gia > 0) {
          const discounted = Math.round(post.gia * (100 - percent) / 100);
          const newPrice = `<h5 class="text-danger mb-0">${fmt(discounted)}</h5>`;
          const oldPrice = `<h6 class="text-muted ml-2"><del>${fmt(post.gia)}</del></h6>`;
          return `${newPrice}${oldPrice}`;
        }
        
        // No discount
        return `<h5 class="text-primary mb-0">${basePriceHtml}</h5>`;
      } catch(_){
        return `<h5 class="text-primary mb-0">${basePriceHtml}</h5>`;
      }
    },
    // Render small badges for product
    renderBadges(post){
      const badges = [];
      
      // Seller discount badge (NEW)
      const sellerDiscount = getSellerDiscount(post);
      if (sellerDiscount > 0) {
        badges.push(`<span class="badge badge-danger ml-1">-${sellerDiscount}%</span>`);
      } else {
        // Old tag-based discount (DEPRECATED fallback)
        const oldDiscount = getDiscountPercentFromTags(post && post.tags);
        if (oldDiscount > 0) badges.push(`<span class="badge badge-danger ml-1">-${oldDiscount}%</span>`);
      }
      
      // Service badges (NEW: VIP, Boost)
      if (post && post.tinhNangDichVu) {
        if (post.tinhNangDichVu.tinVip) {
          badges.push(`<span class="badge badge-purple ml-1" style="background-color: #6f42c1; color: white;">⭐ VIP</span>`);
        }
        if (post.tinhNangDichVu.dayTin) {
          badges.push(`<span class="badge badge-info ml-1">🚀 Đã đẩy</span>`);
        }
      }
      
      // Featured/Highlight badge
      if (ProductDecorators.isHighlighted(post)) {
        badges.push(`<span class="badge badge-warning ml-1">⭐ Nổi bật</span>`);
      }
      
      // Verified badge
      if (ProductDecorators.isVerified(post)) {
        badges.push(`<span class="badge badge-success ml-1">✓ Đã xác minh</span>`);
      }
      
      return badges.join(' ');
    }
  };

  // ------- User Decorators -------
  const UserDecorators = {
    getReputationLevel(diemUyTin){
      const score = Number(diemUyTin || 0);
      if (score >= 4.5) return { label: 'Legend', cls: 'warning' };
      if (score >= 3.5) return { label: 'Pro', cls: 'primary' };
      if (score >= 2.5) return { label: 'Trusted', cls: 'info' };
      return { label: 'Newbie', cls: 'secondary' };
    },
    isSeller(totalPosts){
      return Number(totalPosts || 0) > 0;
    },
    renderBadges(user, stats){
      const badges = [];
      const rep = UserDecorators.getReputationLevel(user && user.diemUyTin);
      badges.push(`<span class="badge badge-${rep.cls} mr-1">${rep.label}</span>`);
      const total = stats && stats.totalPosts;
      if (user && user.daXacMinhNguoiBan) {
        badges.push(`<span class="badge badge-success">Đã xác minh người bán</span>`);
      } else if (UserDecorators.isSeller(total)) {
        badges.push(`<span class="badge badge-info">Người bán</span>`);
      }
      return badges.join(' ');
    }
  };

  window.ProductDecorators = ProductDecorators;
  window.UserDecorators = UserDecorators;
})();
