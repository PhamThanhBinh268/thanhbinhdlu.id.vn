const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    hoTen: {
      type: String,
      required: [true, "Họ tên là bắt buộc"],
      trim: true,
      maxlength: [100, "Họ tên không được quá 100 ký tự"],
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Email không hợp lệ",
      ],
    },
    matKhau: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
    },
    soDienThoai: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"],
    },
    diaChi: {
      type: String,
      trim: true,
      maxlength: [200, "Địa chỉ không được quá 200 ký tự"],
    },
    vaiTro: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    diemUyTin: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    soLuotDanhGia: {
      type: Number,
      default: 0,
      min: 0,
    },
    trangThai: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    avatar: {
      type: String,
      default: "https://via.placeholder.com/150x150.png?text=User",
    },
    avatarPublicId: {
      type: String,
    },
    ngaySinh: {
      type: Date,
    },
    gioiThieu: {
      type: String,
      trim: true,
      maxlength: [500, "Giới thiệu không được quá 500 ký tự"],
    },
    lienKetMangXaHoi: {
      facebook: {
        type: String,
        trim: true,
        match: [
          /^https?:\/\/(www\.)?facebook\.com\/.*$/,
          "Link Facebook không hợp lệ",
        ],
      },
      instagram: {
        type: String,
        trim: true,
        match: [
          /^https?:\/\/(www\.)?instagram\.com\/.*$/,
          "Link Instagram không hợp lệ",
        ],
      },
      zalo: {
        type: String,
        trim: true,
        match: [/^[0-9]{10,11}$/, "Số Zalo không hợp lệ"],
      },
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  }
);

// Hash mật khẩu trước khi lưu
userSchema.pre("save", async function (next) {
  // Chỉ hash nếu mật khẩu được thay đổi
  if (!this.isModified("matKhau")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.matKhau = await bcrypt.hash(this.matKhau, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// So sánh mật khẩu
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.matKhau);
};

// Tính điểm uy tín trung bình
userSchema.methods.calculateRating = async function () {
  const Rating = mongoose.model("Rating");
  const ratings = await Rating.find({ denNguoiDung: this._id });

  if (ratings.length === 0) {
    this.diemUyTin = 0;
    this.soLuotDanhGia = 0;
  } else {
    const totalStars = ratings.reduce((sum, rating) => sum + rating.soSao, 0);
    this.diemUyTin = Math.round((totalStars / ratings.length) * 10) / 10; // Làm tròn 1 chữ số thập phân
    this.soLuotDanhGia = ratings.length;
  }

  await this.save();
};

// Loại bỏ mật khẩu khi trả về JSON
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.matKhau;
  return userObject;
};

module.exports = mongoose.model("User", userSchema);
