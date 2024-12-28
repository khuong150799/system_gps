const { GET } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");

class MonittorController {
  check = catchAsync(async (req, res) => {
    const data = "OK";
    GET(res, data);
  });
}

module.exports = new MonittorController();
