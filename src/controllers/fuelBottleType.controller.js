const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const fuelBottleTypeService = require("../services/fuelBottleType.service");

class FuelBottleTypeController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage, totalRecord } =
      await fuelBottleTypeService.getallrows(query);

    GET(res, data, totalPage, totalRecord);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await fuelBottleTypeService.getById(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await fuelBottleTypeService.register(body);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await fuelBottleTypeService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await fuelBottleTypeService.deleteById(params);
    DELETE(res, data);
  });

  updatePublish = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await fuelBottleTypeService.updatePublish(body, params);
    UPDATE(res, data);
  });
}

module.exports = new FuelBottleTypeController();
