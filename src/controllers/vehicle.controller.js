const { UPDATE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const vehicleService = require("../services/vehicle.service");

class VehicleController {
  updateById = catchAsync(async (req, res) => {
    const { body, params } = req;
    const data = await vehicleService.updateById(body, params);
    UPDATE(res, [data]);
  });

  updateName = catchAsync(async (req, res) => {
    const { body, params, userId } = req;
    const infoUser = { user_id: userId, ip: null, os: null, gps: null };
    const data = await vehicleService.updateName(body, params, infoUser);
    UPDATE(res, [data]);
  });

  updatePackage = catchAsync(async (req, res) => {
    const { body, params } = req;
    const data = await vehicleService.updatePackage(body, params);
    UPDATE(res, [data]);
  });
}

module.exports = new VehicleController();
