const errorCodes = {
  DB_PLAN_ADD_DRIVER: "EROR_DB_PLAN_ADD_DRIVER", // lỗi đb khi add tài xế lúc quét QR
  VERIFY_NOT_FOND_DATA: "ERROR_V_NFD", //
  VERIFY_NOT_FOND_VEHICLE: "ERROR_V_NFV", // không tìm thấy phương tiện
  VERIFY_NOT_FOND_DATA_NEC: "ERROR_V_NFDN", //không đủ data cần thiết verify
  WEIGTH_NOT_FOND_KG: "ERROR_W_KGNULL", // khối lượng null
  WEIGTH_IN_V1: "ERROR_W_R_V1", // lỗi ở hàm handleMQTT REQUSET
  WEIGTH_IN_DV1: "ERROR_W_D_V1", // lỗi ở hàm handleDevice REQUSET
  WEIGTH_IN_DV1_N: "ERROR_W_D_V1_N", // lỗi ở hàm handleDevice REQUSET
};

module.exports = {
  errorCodes,
};
