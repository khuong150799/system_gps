const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catch.async");
const vehicleIconService = require("../services/vehicleIcon.service");

class VehicleIconController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage } = await vehicleIconService.getallrows(query);

    GET(res, data, totalPage);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await vehicleIconService.getById(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await vehicleIconService.register(body);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await vehicleIconService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await vehicleIconService.deleteById(params);
    DELETE(res, data);
  });

  updatePublish = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await vehicleIconService.updatePublish(body, params);
    UPDATE(res, data);
  });
}

module.exports = new VehicleIconController();
