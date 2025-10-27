/**
 * Test Script - Kiểm tra API VIP Packages
 * Chạy: node test_vip_api.js
 */

require("dotenv").config();
const axios = require("axios");

const BASE_URL = "http://localhost:8080/api";

async function testVipAPI() {
  console.log("🧪 Bắt đầu test API VIP Packages\n");

  try {
    // Test 1: GET all packages
    console.log("📋 Test 1: GET /api/vip-packages");
    const packagesResponse = await axios.get(`${BASE_URL}/vip-packages`);
    console.log("✅ Success:", packagesResponse.data);
    console.log(`   Số lượng gói: ${packagesResponse.data.data.length}\n`);

    // Test 2: GET package detail
    const packageName = "professional";
    console.log(`📋 Test 2: GET /api/vip-packages/${packageName}`);
    const detailResponse = await axios.get(`${BASE_URL}/vip-packages/${packageName}`);
    console.log("✅ Success:", detailResponse.data);
    console.log(`   Giá: ${detailResponse.data.data.price.toLocaleString("vi-VN")}đ\n`);

    // Test 3: GET my subscription (no auth - should fail)
    console.log("📋 Test 3: GET /api/vip-packages/my-subscription (No Auth)");
    try {
      await axios.get(`${BASE_URL}/vip-packages/my-subscription`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("✅ Expected 401:", error.response.data.message);
        console.log("   (Đúng như mong đợi - cần authentication)\n");
      } else {
        throw error;
      }
    }

    // Test 4: POST subscribe (no auth - should fail)
    console.log("📋 Test 4: POST /api/vip-packages/subscribe (No Auth)");
    try {
      await axios.post(`${BASE_URL}/vip-packages/subscribe`, {
        packageName: "basic",
        paymentMethod: "momo",
      });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("✅ Expected 401:", error.response.data.message);
        console.log("   (Đúng như mong đợi - cần authentication)\n");
      } else {
        throw error;
      }
    }

    console.log("🎉 Tất cả tests đã pass!");
    console.log("\n📊 Tổng kết:");
    console.log("   - GET all packages: ✅");
    console.log("   - GET package detail: ✅");
    console.log("   - Authentication check: ✅");
    console.log("\n💡 Để test subscribe API, cần:");
    console.log("   1. Đăng nhập để lấy JWT token");
    console.log("   2. Thêm token vào header: Authorization: Bearer <token>");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("   Response:", error.response.data);
    }
    process.exit(1);
  }
}

// Chạy tests
testVipAPI()
  .then(() => {
    console.log("\n✅ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
