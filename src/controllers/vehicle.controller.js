const { UPDATE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const vehicleService = require("../services/vehicle.service");

class VehicleController {
  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await vehicleService.updateById(body, params);
    UPDATE(res, [data]);
  });
}

module.exports = new VehicleController();
