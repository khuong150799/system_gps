const { GET } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const typeCodeService = require("../services/typeCode.service");

class RenewalCode {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage, totalRecord } = await typeCodeService.getallrows(
      query
    );

    GET(res, data, totalPage, totalRecord);
  });
}

module.exports = new RenewalCode();
