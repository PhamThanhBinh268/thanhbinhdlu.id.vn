// Reset admin password
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Kết nối MongoDB thành công\n');

    const admin = await User.findOne({ email: 'admin@oldmarket.com' });
    
    if (!admin) {
      console.log('❌ Không tìm thấy admin với email admin@oldmarket.com');
      mongoose.disconnect();
      return;
    }

    console.log(`📝 Tìm thấy admin: ${admin.hoTen}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🆔 ID: ${admin._id}\n`);

    // Set new password
    admin.matKhau = 'admin123';
    await admin.save();

    console.log('✅ Đã reset password thành công!');
    console.log('🔑 Password mới: admin123\n');

    mongoose.disconnect();
    console.log('👋 Đã ngắt kết nối MongoDB');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
    mongoose.disconnect();
  }
}

resetAdminPassword();
