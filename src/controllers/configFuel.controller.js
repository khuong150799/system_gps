const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const configFurlService = require("../services/configFurl.service");

class ConfigFuelController {
  //   getAllRows = catchAsync(async (req, res) => {
  //     const query = req.query;
  //     const role = req.role;
  //     const { data, totalPage, totalRecord } = await configFurlService.getallrows(
  //       query,
  //       role
  //     );

  //     GET(res, data, totalPage, totalRecord);
  //   });

  getById = catchAsync(async (req, res) => {
    const query = req.query;
    const data = await configFurlService.getById(query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const { userId, body } = req;
    const data = await configFurlService.register(userId, body);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const { userId, body, params } = req;
    const data = await configFurlService.updateById(userId, body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await configFurlService.deleteById(params);
    DELETE(res, data);
  });
}

module.exports = new ConfigFuelController();
