const { GET, CREATED } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const envService = require("../services/env.service");

class EnvController {
  getAll = catchAsync(async (req, res, _) => {
    const result = await envService.getAll(req.query);
    GET(res, result);
  });

  register = catchAsync(async (req, res, _) => {
    const result = await envService.register(req.body);
    CREATED(res, result);
  });
}

module.exports = new EnvController();
