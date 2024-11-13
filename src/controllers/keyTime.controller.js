const { GET } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const keyTimeService = require("../services/keyTime.service");

class KeyTimeController {
  getAllRows = catchAsync(async (req, res) => {
    const { query } = req;
    const { data, totalPage, totalRecord } = await keyTimeService.getallrows(
      query
    );

    GET(res, data, totalPage, totalRecord);
  });

  // getAllRowsUsed = catchAsync(async (req, res) => {
  //   const { query } = req;
  //   const { data, totalPage, totalRecord } =
  //     await renewalCodeService.getallrows({ ...query, is_used: 1 });

  //   GET(res, data, totalPage, totalRecord);
  // });

  // register = catchAsync(async (req, res) => {
  //   const { body, userId } = req;
  //   if (userId != -10) throw new Api400Error();
  //   const data = await renewalCodeService.register(body);
  //   CREATED(res, [data]);
  // });
}

module.exports = new KeyTimeController();
