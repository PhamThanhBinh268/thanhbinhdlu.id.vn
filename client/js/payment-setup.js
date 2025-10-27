/**
 * Payment & Shipping Setup Modal
 * Hiển thị form để người mua thiết lập:
 * - Phương thức thanh toán (Tiền mặt / Chuyển khoản / Momo / ZaloPay)
 * - Thông tin thanh toán người bán
 * - Hình thức giao hàng (Gặp trực tiếp / Giao hàng tận nơi)
 * - Địa chỉ giao hàng
 * - Phí ship
 */

window.showPaymentSetupModal = function(transaction) {

  const post = transaction.baiDang || {};
  const seller = transaction.nguoiBan || {};
  const buyer = transaction.nguoiDeNghi || {};
  
  // Kiểm tra xem giao dịch có cần thanh toán không
  const needsPayment = transaction.loaiGiaoDich === 'mua' || 
    (transaction.loaiGiaoDich === 'trao-doi' && transaction.tienBu > 0);
  
  const paymentAmount = transaction.loaiGiaoDich === 'mua' 
    ? transaction.giaDeXuat 
    : transaction.tienBu;

  const modalHtml = `
    <div class="modal fade" id="paymentSetupModal" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="fas fa-credit-card"></i> Thiết Lập Thanh Toán & Giao Hàng
            </h5>
            <button type="button" class="close text-white" data-dismiss="modal">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <!-- Product Info -->
            <div class="card mb-4">
              <div class="card-body">
                <div class="row align-items-center">
                  <div class="col-md-3">
                    <img src="${post.hinhAnh?.[0] || '/img/product-placeholder.jpg'}" class="img-fluid rounded" />
                  </div>
                  <div class="col-md-9">
                    <h6 class="mb-1">${Utils.escapeHtml(post.tenSanPham || 'Sản phẩm')}</h6>
                    <p class="text-muted small mb-2">Người bán: ${Utils.escapeHtml(seller.hoTen || 'N/A')}</p>
                    ${needsPayment ? `
                      <p class="mb-0">
                        <strong>Số tiền cần thanh toán:</strong> 
                        <span class="text-danger h5 mb-0">${Utils.formatCurrency(paymentAmount)}</span>
                      </p>
                    ` : `
                      <p class="mb-0">
                        <span class="badge badge-success">Không cần thanh toán</span>
                      </p>
                    `}
                  </div>
                </div>
              </div>
            </div>

            <form id="paymentSetupForm">
              <!-- PHẦN 1: THANH TOÁN -->
              ${needsPayment ? `
                <div class="card mb-4">
                  <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="fas fa-money-bill-wave"></i> Phương Thức Thanh Toán</h6>
                  </div>
                  <div class="card-body">
                    <div class="form-group">
                      <label>Chọn phương thức thanh toán <span class="text-danger">*</span></label>
                      <select class="form-control" id="phuongThucThanhToan" required>
                        <option value="">-- Chọn --</option>
                        <option value="tien-mat">💵 Tiền mặt (khi gặp trực tiếp)</option>
                        <option value="chuyen-khoan">🏦 Chuyển khoản ngân hàng</option>
                        <option value="momo">📱 Momo</option>
                        <option value="zalopay">💳 ZaloPay</option>
                      </select>
                    </div>

                    <!-- Thông tin ngân hàng (hiện khi chọn Chuyển khoản) -->
                    <div id="bankInfoSection" class="d-none">
                      <hr>
                      <h6 class="text-primary mb-3">Thông tin chuyển khoản của người bán:</h6>
                      <div class="form-row">
                        <div class="form-group col-md-6">
                          <label>Tên ngân hàng <span class="text-danger">*</span></label>
                          <input type="text" class="form-control" id="tenNganHang" placeholder="VD: Vietcombank" />
                        </div>
                        <div class="form-group col-md-6">
                          <label>Số tài khoản <span class="text-danger">*</span></label>
                          <input type="text" class="form-control" id="soTaiKhoan" placeholder="VD: 0123456789" />
                        </div>
                      </div>
                      <div class="form-group">
                        <label>Tên chủ tài khoản <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="tenTaiKhoan" placeholder="VD: NGUYEN VAN A" />
                      </div>
                      <div class="alert alert-info small mb-0">
                        <i class="fas fa-info-circle"></i> Sau khi chuyển khoản, vui lòng upload ảnh chứng minh.
                      </div>
                    </div>

                    <!-- Thông tin Momo (hiện khi chọn Momo) -->
                    <div id="momoInfoSection" class="d-none">
                      <hr>
                      <h6 class="text-primary mb-3">Thông tin Momo của người bán:</h6>
                      <div class="form-group">
                        <label>Số điện thoại Momo <span class="text-danger">*</span></label>
                        <input type="tel" class="form-control" id="soDienThoaiMomo" placeholder="VD: 0912345678" />
                      </div>
                      <div class="alert alert-info small mb-0">
                        <i class="fas fa-info-circle"></i> Chuyển tiền qua Momo và upload ảnh chứng minh.
                      </div>
                    </div>

                    <!-- Thông tin ZaloPay (hiện khi chọn ZaloPay) -->
                    <div id="zaloInfoSection" class="d-none">
                      <hr>
                      <h6 class="text-primary mb-3">Thông tin ZaloPay của người bán:</h6>
                      <div class="form-group">
                        <label>Số điện thoại ZaloPay <span class="text-danger">*</span></label>
                        <input type="tel" class="form-control" id="soDienThoaiZalo" placeholder="VD: 0912345678" />
                      </div>
                      <div class="alert alert-info small mb-0">
                        <i class="fas fa-info-circle"></i> Chuyển tiền qua ZaloPay và upload ảnh chứng minh.
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- PHẦN 2: GIAO HÀNG -->
              <div class="card mb-4">
                <div class="card-header bg-light">
                  <h6 class="mb-0"><i class="fas fa-truck"></i> Hình Thức Giao Hàng</h6>
                </div>
                <div class="card-body">
                  <div class="form-group">
                    <label>Chọn hình thức giao hàng <span class="text-danger">*</span></label>
                    <div class="custom-control custom-radio">
                      <input type="radio" class="custom-control-input" id="gapTrucTiep" name="hinhThucGiaoHang" value="gap-truc-tiep" checked>
                      <label class="custom-control-label" for="gapTrucTiep">
                        🤝 Gặp trực tiếp (giao tận tay)
                      </label>
                    </div>
                    <div class="custom-control custom-radio">
                      <input type="radio" class="custom-control-input" id="giaoHang" name="hinhThucGiaoHang" value="giao-hang-tan-noi">
                      <label class="custom-control-label" for="giaoHang">
                        📦 Giao hàng tận nơi (qua đơn vị vận chuyển)
                      </label>
                    </div>
                  </div>

                  <!-- Địa điểm gặp (hiện khi chọn Gặp trực tiếp) -->
                  <div id="meetingLocationSection">
                    <hr>
                    <div class="form-group">
                      <label>Địa điểm hẹn gặp <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" id="diaDiemGap" placeholder="VD: Starbucks Nguyễn Huệ, Q1, TP.HCM" />
                      <small class="form-text text-muted">Nhập địa chỉ cụ thể để hẹn gặp.</small>
                    </div>
                  </div>

                  <!-- Địa chỉ giao hàng (hiện khi chọn Giao hàng) -->
                  <div id="deliveryAddressSection" class="d-none">
                    <hr>
                    <h6 class="text-primary mb-3">Địa chỉ nhận hàng:</h6>
                    <div class="form-row">
                      <div class="form-group col-md-6">
                        <label>Họ tên người nhận <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="hoTenNhan" placeholder="VD: Nguyễn Văn A" />
                      </div>
                      <div class="form-group col-md-6">
                        <label>Số điện thoại <span class="text-danger">*</span></label>
                        <input type="tel" class="form-control" id="soDienThoaiNhan" placeholder="VD: 0912345678" />
                      </div>
                    </div>
                    <div class="form-group">
                      <label>Địa chỉ chi tiết <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" id="diaChiChiTiet" placeholder="VD: Số 123, Đường ABC" />
                    </div>
                    <div class="form-row">
                      <div class="form-group col-md-4">
                        <label>Phường/Xã <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="phuongXa" placeholder="VD: Phường 1" />
                      </div>
                      <div class="form-group col-md-4">
                        <label>Quận/Huyện <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="quanHuyen" placeholder="VD: Quận 1" />
                      </div>
                      <div class="form-group col-md-4">
                        <label>Tỉnh/Thành phố <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="tinhThanh" placeholder="VD: TP.HCM" />
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group col-md-6">
                        <label>Phí ship (VNĐ) <span class="text-danger">*</span></label>
                        <input type="number" class="form-control" id="phiShip" placeholder="VD: 30000" min="0" value="0" />
                        <small class="form-text text-muted">Nhập 0 nếu miễn phí ship.</small>
                      </div>
                      <div class="form-group col-md-6">
                        <label>Người trả ship <span class="text-danger">*</span></label>
                        <select class="form-control" id="nguoiTraShip">
                          <option value="nguoi-mua">Người mua trả</option>
                          <option value="nguoi-ban">Người bán trả</option>
                          <option value="chia-doi">Chia đôi</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i> <strong>Lưu ý:</strong> 
                ${needsPayment ? 'Sau khi thiết lập, bạn cần chuyển tiền và upload ảnh chứng minh thanh toán.' : 'Sau khi thiết lập, giao dịch sẽ chuyển sang bước giao hàng.'}
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">
              <i class="fas fa-times"></i> Hủy
            </button>
            <button type="button" class="btn btn-primary" id="submitPaymentSetup">
              <i class="fas fa-check"></i> Xác Nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal
  $('#paymentSetupModal').remove();
  
  // Add modal to body
  $('body').append(modalHtml);
  
  // Show modal
  $('#paymentSetupModal').modal('show');

  // Handle payment method change
  $('#phuongThucThanhToan').on('change', function() {
    const method = $(this).val();
    $('#bankInfoSection').addClass('d-none');
    $('#momoInfoSection').addClass('d-none');
    $('#zaloInfoSection').addClass('d-none');

    if (method === 'chuyen-khoan') {
      $('#bankInfoSection').removeClass('d-none');
    } else if (method === 'momo') {
      $('#momoInfoSection').removeClass('d-none');
    } else if (method === 'zalopay') {
      $('#zaloInfoSection').removeClass('d-none');
    }
  });

  // Handle shipping method change
  $('input[name="hinhThucGiaoHang"]').on('change', function() {
    const method = $(this).val();
    if (method === 'gap-truc-tiep') {
      $('#meetingLocationSection').removeClass('d-none');
      $('#deliveryAddressSection').addClass('d-none');
    } else {
      $('#meetingLocationSection').addClass('d-none');
      $('#deliveryAddressSection').removeClass('d-none');
    }
  });

  // Handle submit
  $('#submitPaymentSetup').on('click', async function() {
    const btn = $(this);
    const originalHtml = btn.html();

    try {
      // Validate form
      const hinhThucGiaoHang = $('input[name="hinhThucGiaoHang"]:checked').val();
      
      // Build payload
      const payload = {
        hinhThucGiaoHang,
      };

      // Payment info
      if (needsPayment) {
        const phuongThucThanhToan = $('#phuongThucThanhToan').val();
        if (!phuongThucThanhToan) {
          alert('Vui lòng chọn phương thức thanh toán');
          return;
        }

        payload.phuongThucThanhToan = phuongThucThanhToan;
        payload.thongTinThanhToan = {};

        if (phuongThucThanhToan === 'chuyen-khoan') {
          const tenNganHang = $('#tenNganHang').val().trim();
          const soTaiKhoan = $('#soTaiKhoan').val().trim();
          const tenTaiKhoan = $('#tenTaiKhoan').val().trim();
          
          if (!tenNganHang || !soTaiKhoan || !tenTaiKhoan) {
            alert('Vui lòng nhập đầy đủ thông tin ngân hàng');
            return;
          }
          
          payload.thongTinThanhToan = { tenNganHang, soTaiKhoan, tenTaiKhoan };
        } else if (phuongThucThanhToan === 'momo') {
          const soDienThoaiMomo = $('#soDienThoaiMomo').val().trim();
          if (!soDienThoaiMomo) {
            alert('Vui lòng nhập số điện thoại Momo');
            return;
          }
          payload.thongTinThanhToan = { soDienThoaiMomo };
        } else if (phuongThucThanhToan === 'zalopay') {
          const soDienThoaiZalo = $('#soDienThoaiZalo').val().trim();
          if (!soDienThoaiZalo) {
            alert('Vui lòng nhập số điện thoại ZaloPay');
            return;
          }
          payload.thongTinThanhToan = { soDienThoaiZalo };
        }
      } else {
        // Không cần thanh toán
        payload.phuongThucThanhToan = 'khong-can-thanh-toan';
      }

      // Shipping info
      if (hinhThucGiaoHang === 'gap-truc-tiep') {
        const diaDiemGap = $('#diaDiemGap').val().trim();
        if (!diaDiemGap) {
          alert('Vui lòng nhập địa điểm hẹn gặp');
          return;
        }
        payload.diaDiemGap = diaDiemGap;
      } else {
        const hoTen = $('#hoTenNhan').val().trim();
        const soDienThoai = $('#soDienThoaiNhan').val().trim();
        const diaChiChiTiet = $('#diaChiChiTiet').val().trim();
        const phuongXa = $('#phuongXa').val().trim();
        const quanHuyen = $('#quanHuyen').val().trim();
        const tinhThanh = $('#tinhThanh').val().trim();
        const phiShip = parseInt($('#phiShip').val()) || 0;
        const nguoiTraShip = $('#nguoiTraShip').val();

        if (!hoTen || !soDienThoai || !diaChiChiTiet || !phuongXa || !quanHuyen || !tinhThanh) {
          alert('Vui lòng nhập đầy đủ địa chỉ giao hàng');
          return;
        }

        payload.diaChiGiaoHang = {
          hoTen,
          soDienThoai,
          diaChiChiTiet,
          phuongXa,
          quanHuyen,
          tinhThanh,
        };
        payload.phiShip = phiShip;
        payload.nguoiTraShip = nguoiTraShip;
      }

      // Loading state
      btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Đang xử lý...');

      // Call API
      const response = await TransactionAPI.setupPayment(transaction._id, payload);

      // Success
      $('#paymentSetupModal').modal('hide');
      alert('Thiết lập thanh toán thành công!\n' + (response.nextStep || ''));
      
      // Reload transactions
      if (typeof window.loadSentProposals === 'function') {
        window.loadSentProposals();
      }

    } catch (error) {
      console.error('[Payment Setup] Error:', error);
      alert('Lỗi: ' + (error.message || 'Không thể thiết lập thanh toán'));
      btn.prop('disabled', false).html(originalHtml);
    }
  });

  // Cleanup on modal close
  $('#paymentSetupModal').on('hidden.bs.modal', function() {
    $(this).remove();
  });
};
