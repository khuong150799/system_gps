const { GET } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const writeLogService = require("../services/writeLog.service");

class WriteLogsController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage, totalRecord } = await writeLogService.getallrows(
      query
    );

    GET(res, data, totalPage, totalRecord);
  });
}

module.exports = new WriteLogsController();
