const configureEnvironment = require("../config/dotenv.config");

const { ACCESS_TOKEN_SECRET_KEY, REFRESH_TOKEN_SECRET_KEY, PASSWORD_DEFAULT } =
  configureEnvironment();

const constants = {
  ACCESS_TOKEN_SECRET_KEY,
  REFRESH_TOKEN_SECRET_KEY,
  PASSWORD_DEFAULT,
  ACCESS_TOKEN_TIME_LIFE: 20,
  REFRESH_TOKEN_TIME_LIFE: 30,

  ADD_DATA_SUCCESS: "Thêm thành công",
  GET_DATA_SUCCESS: "Tải dữ liệu thành công",
  ACCOUNT_FAILED: "Tài khoản không chính xác",
  PASS_FAILED: "Mật khẩu không chính xác",
  PASS_OLD_FAILED: "Mật khẩu cũ không chính xác",
  UPDATE_DATA_SUCCESS: "Cập nhật thành công",
  // CONNECT_SUCCESS: "Kết nối thành công",
  DELETE_DATA_SUCCESS: "Xóa thành công",
  ERROR: "Đã xảy ra lỗi",
  // EXPIRED_ON_PASS: "Mật khẩu do hệ thống cấp đã hết hạn",
  ALREADY_EXITS_ORDERS: "đã có đơn hàng",
  ALREADY_EXITS: "đã tồn tại",
  NOT_ACTIVE_ACCOUNT: "Tài khoản đã vị vô hiệu",
  DELETED_ACCOUNT: "Tài khoản đã bị xóa",
  NOT_EXITS: "không tồn tại",
  NOT_DELETE_IMAGE: "Không thể xoá hình ảnh này",

  VALIDATE_ACCOUNT: "Tài khoản chỉ chứa kí tự thường và số",
  VALIDATE_PASS:
    "Mật khẩu bao gồm ít nhất 1 kí tự in hoa, chữ, số và không chứa kí tự đặc biệt",
  CHANGE_PASS_SUCCESS: "Thay đổi mật khẩu thành công",
  NOT_EMPTY: "Dữ liệu bắt buộc",
  VALIDATE_DATA: "Dữ liệu không hợp lệ",
  VALIDATE_EMAIL: "Email không hợp lệ",
  VALIDATE_NAME_FILE: "Tên file không hợp lệ",
  VALIDATE_PHONE: "Số điện thoại không hợp lệ",
  VALIDATE_FILE_COUNT: "Chỉ có thể upload tối đa",
  VALIDATE_FILE_SIZE: "Kích thước tệp tin không được vượt quá 2MB",
  VALIDATE_FILE_SIZE_WITH_INDEX: "có kích thước vượt quá 2MB",
  VALIDATE_PRICE: "Giá phải lớn hơn 0",
  VALIDATE_PRICE_SALE: "Giá khuyến mãi phải nhỏ hơn giá gốc",
  VALIDATE_DISCOUNT: "Giảm giá phải nhỏ hơn 100%",
  VALIDATE_DATA_LAGER_THAN_0: "Dữ liệu phải lớn hơn 0",
  // VALIDATE_NEWS_SIZE: "Dung lượng news phải nhỏ hơn 20MB",
  SERVER_ERROR: "Máy chủ xảy ra lỗi",
  LOGIN_SUCCESS: "Đăng nhập thành công",
  LOGOUT_SUCCESS: "Đăng xuất thành công",
  REFRESH_TOKEN_SUCCESS: "Lấy token thành công",
};

module.exports = constants;
