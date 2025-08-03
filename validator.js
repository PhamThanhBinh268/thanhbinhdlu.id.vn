function Validator(options) {
  const formElement = document.querySelector(options.form);
  if (formElement) {
    options.rules.forEach(function (rule) {
      const inputElement = formElement.querySelector(rule.selecter);
      const errorElement = inputElement.parentElement.querySelector(
        options.errorSelector
      );

      if (inputElement) {
        inputElement.onblur = function () {
          const errorMessage = rule.test(inputElement.value);

          if (errorMessage) {
            errorElement.innerText = errorMessage;
            inputElement.classList.add("invalid");
          } else {
            errorElement.innerText = "";
            inputElement.classList.remove("invalid");
          }
        };
      }
    });

    formElement.onsubmit = function (e) {
      e.preventDefault();

      var isValid = true;

      options.rules.forEach(function (rule) {
        const inputElement = formElement.querySelector(rule.selecter);
        const errorElement = inputElement.parentElement.querySelector(
          options.errorSelector
        );
        const errorMessage = rule.test(inputElement.value);

        if (errorMessage) {
          errorElement.innerText = errorMessage;
          inputElement.classList.add("invalid");
          isValid = false;
        } else {
          errorElement.innerText = "";
          inputElement.classList.remove("invalid");
        }
      });

      if (isValid) {
        alert("Đăng ký thành công!");
      } else {
        alert("Nhập sai thông tin tài khoản ");
      }
    };
  }
}

Validator.isRequired = function (selecter, message) {
  return {
    selecter,
    test: function (value) {
      return value.trim() ? undefined : message || "Vui lòng nhập trường này";
    },
  };
};

Validator.isEmail = function (selecter, message) {
  return {
    selecter,
    test: function (value) {
      const regex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
      return regex.test(value.trim())
        ? undefined
        : message || "Email không hợp lệ";
    },
  };
};

Validator.isPassword = function (selecter, min = 6, message) {
  return {
    selecter,
    test: function (value) {
      return value.length >= min
        ? undefined
        : message || `Mật khẩu phải ít nhất ${min} ký tự`;
    },
  };
};

Validator.isConfirmed = function (selecter, getConfirmValue, message) {
  return {
    selecter,
    test: function (value) {
      return value === getConfirmValue()
        ? undefined
        : message || "Mật khẩu nhập lại không khớp";
    },
  };
};