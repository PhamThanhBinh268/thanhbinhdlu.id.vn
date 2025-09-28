// =============================================================================
// Trang Checkout - Thanh toán / xác nhận đơn hàng (skeleton)
// =============================================================================

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    // Chờ layout inject xong (header/footer) nếu cần tương tác với nav
    if (document.getElementById("app-header")?.children.length === 0) {
      window.addEventListener("layout:ready", initCheckout, { once: true });
    } else {
      initCheckout();
    }
  });

  function initCheckout() {
    bindPaymentMethodEvents();
    // TODO: Load cart summary từ localStorage hoặc API
    // loadCartSummary();
  }

  function bindPaymentMethodEvents() {
    const radios = document.querySelectorAll('input[name="payment"]');
    radios.forEach((r) => r.addEventListener("change", handlePaymentChange));
  }

  function handlePaymentChange(e) {
    // Placeholder xử lý thay đổi phương thức thanh toán
    console.log("[checkout] Selected payment:", e.target.id);
  }

  // Placeholder future function
  function loadCartSummary() {
    // Ví dụ: ApiService.get('/cart') ... rồi render
  }
})();
