const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catch.async");
const vehicleTypeService = require("../services/vehicleType.service");

class VehicleTypeController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage } = await vehicleTypeService.getallrows(query);

    GET(res, data, totalPage);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await vehicleTypeService.getById(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await vehicleTypeService.register(body);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await vehicleTypeService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await vehicleTypeService.deleteById(params);
    DELETE(res, data);
  });

  updatePublish = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await vehicleTypeService.updatePublish(body, params);
    UPDATE(res, data);
  });
}

module.exports = new VehicleTypeController();
