const { GET } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const vehicleService = require("../services/vehicle.service");

class VehicleController {
  playback = catchAsync(async (req, res) => {
    const query = req.query;
    const params = req.params;
    const userId = req.userId;
    const data = await vehicleService.playback(userId, query, params);

    GET(res, data);
  });
}

module.exports = new VehicleController();
