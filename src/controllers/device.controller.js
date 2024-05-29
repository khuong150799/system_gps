const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catch.async");
const deviceService = require("../services/device.service");

class DeviceController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage } = await deviceService.getallrows(query);

    GET(res, data, totalPage);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await deviceService.getById(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await deviceService.register(body);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await deviceService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await deviceService.deleteById(params);
    DELETE(res, data);
  });
}

module.exports = new DeviceController();
