const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const configTemperatureService = require("../services/configTemperature.service");

class ConfigTemperatureController {
  //   getAllRows = catchAsync(async (req, res) => {
  //     const query = req.query;
  //     const role = req.role;
  //     const { data, totalPage, totalRecord } = await configTemperatureService.getallrows(
  //       query,
  //       role
  //     );

  //     GET(res, data, totalPage, totalRecord);
  //   });

  getById = catchAsync(async (req, res) => {
    const query = req.query;
    const data = await configTemperatureService.getById(query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const { userId, body } = req;
    const data = await configTemperatureService.register(userId, body);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const { userId, body, params } = req;
    const data = await configTemperatureService.updateById(
      userId,
      body,
      params
    );
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await configTemperatureService.deleteById(params);
    DELETE(res, data);
  });
}

module.exports = new ConfigTemperatureController();
