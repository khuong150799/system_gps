const { UPDATE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const vehicleService = require("../services/vehicle.service");

class VehicleController {
  updateById = catchAsync(async (req, res) => {
    const { userId, body, params } = req;
    const data = await vehicleService.updateById(body, params, userId);
    UPDATE(res, [data]);
  });

  updateName = catchAsync(async (req, res) => {
    const { body, params } = req;
    const data = await vehicleService.updateName(body, params);
    UPDATE(res, [data]);
  });

  updatePackage = catchAsync(async (req, res) => {
    const { body, params } = req;
    const data = await vehicleService.updatePackage(body, params);
    UPDATE(res, [data]);
  });
}

module.exports = new VehicleController();
