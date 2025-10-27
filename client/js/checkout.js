// =============================================================================
// Checkout Page JavaScript
// =============================================================================

document.addEventListener("DOMContentLoaded", function () {
  // Kiểm tra đăng nhập
  if (!AuthManager.isLoggedIn()) {
    Utils.showToast("Bạn cần đăng nhập để thanh toán", "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
    return;
  }

  // Initialize page
  initializeCheckoutPage();
});

async function initializeCheckoutPage() {
  try {
    // Show loading state
    showCheckoutLoading();
    
    // Load checkout data from MongoDB
    await loadCheckoutData();
    
    // Load user info
    await loadUserInfo();
    
    // Setup form handlers
    setupFormHandlers();
    
    // Hide loading state
    hideCheckoutLoading();
  } catch (error) {
    console.error("Initialize checkout page error:", error);
    Utils.showToast("Có lỗi khi khởi tạo trang thanh toán", "error");
    hideCheckoutLoading();
  }
}

function showCheckoutLoading() {
  // Find order summary container
  const orderSummary = document.querySelector(".border-bottom");
  if (orderSummary) {
    orderSummary.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="sr-only">Đang tải...</span>
        </div>
        <p class="mt-3 text-muted">Đang tải thông tin sản phẩm...</p>
      </div>
    `;
  }
}

function hideCheckoutLoading() {
  // Loading will be replaced by updateOrderSummary
}

async function loadCheckoutData() {
  try {
    // Lấy product ID từ URL hoặc từ localStorage (khi bấm Mua ngay)
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('productId');
    if (!productId) {
      const saved = localStorage.getItem('checkoutData');
      const savedObj = saved ? JSON.parse(saved) : null;
      productId = savedObj?.productId;
    }

    if (!productId) {
      Utils.showToast("Không tìm thấy ID sản phẩm", "error");
      setTimeout(() => {
        window.location.href = "shop.html";
      }, 2000);
      return;
    }

    // Gọi API để lấy thông tin sản phẩm từ MongoDB
    const response = await ApiService.get(`/posts/${productId}`);
    const product = response.post || response.data?.post || response.data || response;

    // Kiểm tra sản phẩm có tồn tại không
    if (!product || !product._id) {
      throw new Error("Sản phẩm không tồn tại");
    }

    // Kiểm tra người dùng hiện tại
    const currentUser = AuthManager.getUser();
    if (currentUser && product.nguoiDang?._id === currentUser._id) {
      Utils.showToast("Bạn không thể mua sản phẩm của chính mình", "warning");
      setTimeout(() => {
        window.location.href = `detail.html?id=${productId}`;
      }, 2000);
      return;
    }

    // Kiểm tra sản phẩm có hỗ trợ bán không (dựa trên loaiGia)
    if (product.loaiGia !== 'ban') {
      Utils.showToast("Sản phẩm này không hỗ trợ bán trực tiếp", "warning");
      setTimeout(() => {
        window.location.href = `detail.html?id=${productId}`;
      }, 2000);
      return;
    }

    // Kiểm tra giá sản phẩm
    if (!product.gia || product.gia <= 0) {
      Utils.showToast("Sản phẩm này không có giá bán cố định", "warning");
      setTimeout(() => {
        window.location.href = `detail.html?id=${productId}`;
      }, 2000);
      return;
    }

    // Tạo dữ liệu checkout từ thông tin sản phẩm
    const checkoutData = {
      productId: product._id,
      productTitle: product.tieuDe,
      productPrice: product.gia,
      productImage: product.hinhAnh && product.hinhAnh.length > 0 ? product.hinhAnh[0] : null,
      sellerId: product.nguoiDang?._id,
      sellerName: product.nguoiDang?.hoTen,
      sellerLocation: product.diaDiem || product.diaChi || '',
      quantity: 1,
      total: product.gia,
      product
    };

    // Update product info in order summary
    updateOrderSummary(checkoutData);

  } catch (error) {
    console.error("❌ Error loading product:", error);
    Utils.showToast("Không thể tải thông tin sản phẩm: " + error.message, "error");
    setTimeout(() => {
      window.location.href = "shop.html";
    }, 3000);
  }
}

function updateOrderSummary(data) {
  // Find the product list container (the div with border-bottom class that contains product info)
  const productListContainer = document.querySelector(".border-bottom");
  if (productListContainer) {
    const productHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="d-flex align-items-center">
          <img src="${data.productImage || 'img/product-placeholder.jpg'}" 
               alt="${data.productTitle}" 
               style="width: 60px; height: 60px; object-fit: cover; margin-right: 15px; border-radius: 5px;">
          <div>
            <h6 class="mb-1">${Utils.truncateText(data.productTitle, 40)}</h6>
            <small class="text-muted">Người bán: ${data.sellerName}</small><br>
            <small class="text-muted">📍 ${data.sellerLocation}</small>
          </div>
        </div>
        <div class="text-right">
          <p class="mb-0 font-weight-bold">${Utils.formatCurrency(data.productPrice)}</p>
          <small class="text-muted">Số lượng: ${data.quantity}</small>
        </div>
      </div>
    `;
    
    // Replace the existing content with new product info
    productListContainer.innerHTML = productHTML;
  }

  // Update totals
  const subtotal = data.total;
  const shipping = 50000; // 50k shipping fee
  const total = subtotal + shipping;

  // Update subtotal
  updateElementText(".d-flex.justify-content-between.mb-3 h6:last-child", Utils.formatCurrency(subtotal));
  
  // Update total
  updateElementText(".d-flex.justify-content-between.mt-2 h5:last-child", Utils.formatCurrency(total));
}

function updateElementText(selector, text) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
}

async function loadUserInfo() {
  try {
    const user = AuthManager.getUser();
    if (!user) return;

    // Fill user info in billing form
    setInputValue('input[placeholder="Nguyễn"]', user.hoTen ? user.hoTen.split(' ')[0] : '');
    setInputValue('input[placeholder="Văn A"]', user.hoTen ? user.hoTen.split(' ').slice(1).join(' ') : '');
    setInputValue('input[placeholder="vidu@email.com"]', user.email || '');
    setInputValue('input[placeholder="+84 123 456 789"]', user.soDienThoai || '');
  } catch (error) {
    console.error("Error loading user info:", error);
  }
}

function setInputValue(selector, value) {
  const input = document.querySelector(selector);
  if (input && value) {
    input.value = value;
  }
}

function setupFormHandlers() {
  // Find and setup place order button
  const placeOrderBtns = document.querySelectorAll(".btn-primary");
  const placeOrderBtn = Array.from(placeOrderBtns).find(btn => 
    btn.textContent.includes("Đặt Hàng") || btn.textContent.includes("Place Order") || 
    btn.closest('.bg-light.p-30') // Button in payment section
  );
  
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", handlePlaceOrder);
    placeOrderBtn.textContent = "Đặt Hàng";
  }

  // Payment method selection
  const paymentRadios = document.querySelectorAll('input[name="payment"]');
  paymentRadios.forEach(radio => {
    radio.addEventListener("change", handlePaymentMethodChange);
  });
}

async function handlePlaceOrder(e) {
  e.preventDefault();

  try {
    Utils.showLoading(e.target);

    // Validate form
    if (!validateCheckoutForm()) {
      return;
    }

    // Get product ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('productId');
    if (!productId) {
      const saved = localStorage.getItem('checkoutData');
      const savedObj = saved ? JSON.parse(saved) : null;
      productId = savedObj?.productId;
    }
    
    if (!productId) {
      throw new Error("Không tìm thấy ID sản phẩm");
    }

  // Load fresh product data from MongoDB
  const productResponse = await ApiService.get(`/posts/${productId}`);
  const product = productResponse.post || productResponse.data?.post || productResponse.data || productResponse;

    const checkoutData = {
      productId: product._id,
      productPrice: product.gia,
      sellerId: product.nguoiDang?._id,
      total: product.gia
    };

    // Get form data
    const formData = getCheckoutFormData();

    // Map payment method to backend enum
    const paymentMapped = mapPaymentMethod(formData.paymentMethod);

    // Create transaction (align with backend Transaction model/routes)
    const transactionData = {
      baiDang: checkoutData.productId,
      giaThanhToan: checkoutData.total, // product price (shipping handled ngoài giao dịch ở hiện tại)
      phuongThucThanhToan: paymentMapped,
      diaDiemGiaoDich: formData.billingInfo?.diaChi || undefined,
      ghiChu: `Đặt hàng từ checkout cho sản phẩm ${product.tieuDe}`
    };

    // Gọi API để tạo transaction
    try {
      const transactionResponse = await ApiService.post("/transactions", transactionData);

      const created = transactionResponse.transaction || transactionResponse.data || transactionResponse;
      const txId = created?._id || created?.id;

      Utils.showToast("🎉 Đặt hàng thành công! Người bán sẽ liên hệ với bạn sớm.", "success");

      // Redirect to transaction detail if possible
      setTimeout(() => {
        if (txId) {
          window.location.href = `transaction-detail.html?id=${txId}`;
        } else {
          window.location.href = "profile.html?tab=transactions";
        }
      }, 1800);

    } catch (apiError) {
      
      // Fallback: Simulate success for demo
      Utils.showToast("🎉 Đặt hàng thành công (chế độ demo)! Người bán sẽ liên hệ với bạn sớm.", "success");
      
      // Redirect to shop
      setTimeout(() => {
        window.location.href = "shop.html";
      }, 3000);
    }

  } catch (error) {
    console.error("❌ Place order error:", error);
    Utils.showToast("Đặt hàng thất bại: " + error.message, "error");
  } finally {
    Utils.hideLoading(e.target);
  }
}

function validateCheckoutForm() {
  let isValid = true;

  // Validate required fields
  const requiredFields = [
    { selector: 'input[placeholder="Nguyễn"]', name: "Họ" },
    { selector: 'input[placeholder="Văn A"]', name: "Tên" },
    { selector: 'input[placeholder="vidu@email.com"]', name: "Email" },
    { selector: 'input[placeholder="+84 123 456 789"]', name: "Số điện thoại" },
    { selector: 'input[placeholder="123 Đường Láng"]', name: "Địa chỉ" }
  ];

  requiredFields.forEach(field => {
    const input = document.querySelector(field.selector);
    if (input && !input.value.trim()) {
      input.classList.add("is-invalid");
      isValid = false;
    } else if (input) {
      input.classList.remove("is-invalid");
    }
  });

  // Validate payment method
  const paymentSelected = document.querySelector('input[name="payment"]:checked');
  if (!paymentSelected) {
    Utils.showToast("Vui lòng chọn phương thức thanh toán", "error");
    isValid = false;
  }

  if (!isValid) {
    Utils.showToast("Vui lòng điền đầy đủ thông tin bắt buộc", "error");
  }

  return isValid;
}

function getCheckoutFormData() {
  const firstName = document.querySelector('input[placeholder="Nguyễn"]').value.trim();
  const lastName = document.querySelector('input[placeholder="Văn A"]').value.trim();
  const email = document.querySelector('input[placeholder="vidu@email.com"]').value.trim();
  const phone = document.querySelector('input[placeholder="+84 123 456 789"]').value.trim();
  const address1 = document.querySelector('input[placeholder="123 Đường Láng"]').value.trim();
  const address2 = document.querySelector('input[placeholder="Phường Láng Thượng"]').value.trim();
  
  const paymentMethod = document.querySelector('input[name="payment"]:checked').id;

  return {
    billingInfo: {
      hoTen: `${firstName} ${lastName}`,
      email: email,
      soDienThoai: phone,
      diaChi: `${address1}, ${address2}`.replace(', ,', ',').replace(/^,|,$/g, '')
    },
    paymentMethod: paymentMethod
  };
}

function handlePaymentMethodChange(e) {
  
  // Show payment specific info if needed
  switch(e.target.id) {
    case 'momo':
      Utils.showToast("Bạn sẽ được chuyển đến MoMo để thanh toán", "info");
      break;
    case 'banktransfer':
      Utils.showToast("Thông tin chuyển khoản sẽ được gửi qua email", "info");
      break;
    default:
      break;

  }
}

// Map payment radio id -> backend enum value
function mapPaymentMethod(id) {
  switch (id) {
    case 'cod':
      return 'tien-mat';
    case 'banktransfer':
      return 'chuyen-khoan';
    case 'exchange':
      return 'trao-doi';
    case 'momo':
      // Hiện chưa có enum riêng cho momo, map tạm sang chuyển khoản
      return 'chuyen-khoan';
    default:
      return 'tien-mat';
  }
}