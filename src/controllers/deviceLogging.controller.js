const { GET } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const deviceLoggingService = require("../services/deviceLogging.service");

class DeviceLoggingController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage, totalRecord } =
      await deviceLoggingService.getallrows(query);

    GET(res, data, totalPage, totalRecord);
  });
}

module.exports = new DeviceLoggingController();
