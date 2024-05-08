const messageReq = {
  //verify
  driverNotFound: "Không tìm thấy tài xế!",
  vehicleBusy: "Phương tiện đang chạy tuyến khác!",
  vehicleVerify: "Phương tiện đã xác minh",
  vehiclePendingMess: `Phương tiện đang chờ duyệt!`,
  verifyDataInvalid: `Không đủ dữ liệu!`,
  vehiclePendding: (routeString) => `Đang chờ duyệt!`,

  removePendingTrip: "Đã huỷ chuyến đi",
  removePendingTripSSDevice: "Quản trị viên từ chối",
  noTrip: "Vị trí không có tuyến",
  addedDriver: "Tài xế vừa được thêm vào hệ thống",
  tripPendingNotValid:
    "Thông tin chuyến đi được tạo có thể không chính xác! Không thể thêm vào hàng chờ",
  tripPendingVerifyNotValid:
    "Thông tin chuyến đi được tạo có thể không chính xác! Không thể xác nhận",
  successAddpenddingTrip: "Thêm thàng công chuyến đi",
  driverBlocked: `Tài xế đã bị chặn!`,
  succesVerifypenddingTrip: "Xác minh thành công",

  intrip: (routeString) => `Đang chạy tuyến!`,
  tripNotFound: `Chuyến đi không tồn tại`,
  routeNotFound: `Tuyến không tồn tại`,
  notInPenddingTrip: `Không nằm trong hàng chờ`,
  tripVerified: `Đã xác minh chuyến`,

  w_tripNotFound: `Chuyến đi không hợp lệ`,
  w_LocationNotFound: `Địa điểm không hợp lệ`,
  w_weightNotValid: `Khối lượng không hợp lệ`,
  //start
  startNotInLocation: "Ngoài vùng nhận hàng",
  devIdNotFound: "Không tìm thấy phương tiện",
  devIdNotFoundInStart: "Không trong hàng chờ nhận",
  startSuccess: (payload) => `Khối lượng nhận: ${payload?.weight}kg`,

  //finish
  finishNotInLocation: "Ngoài vùng giao hàng",
  devIdNotFoundInEnd: "Không trong hàng chờ giao",
  finishSuccess: (payload) => `Khối lượng giao: ${payload?.weight}kg`,

  // db
  DBReq: "Lỗi DBOO1",

  //status_record
  record_Verified: `Phương tiện xác minh tài xế`,
  record_Started: (startWeight, location) =>
    `Phương tiện cân và lấy hàng: ${startWeight}kg tại ${location || "-"}`,

  record_Finished: (endWeight, location, lossRate) =>
    `Phương tiện cân và hoàn thành chuyến đi: ${endWeight}kg tại ${
      location || "-"
    } | Tỉ lệ hao hụt: ${lossRate}%`,

  record_registerTrip: `Phương tiện đăng ký chuyến đi`,
  record_VerifiedTrip: `Quản trị viên xác nhận chuyến đi`,
  record_inTripStatus: (isIn) =>
    isIn ? `Phương tiện vào trong lộ trình` : `Phương tiện rời khỏi lộ trình`,

  serverError: "Có lỗi server!",
  planVerifyASCError: "Không xác định asc",
  success: "Thành công",
  dataNotCorect: "Không có dữ liệu",
  çç: "Có lỗi",
};

module.exports = { messageReq };
