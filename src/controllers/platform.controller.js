const { GET } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const platformService = require("../services/platform.service");

class RenewalCode {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage, totalRecord } = await platformService.getallrows(
      query
    );

    GET(res, data, totalPage, totalRecord);
  });
}

module.exports = new RenewalCode();
