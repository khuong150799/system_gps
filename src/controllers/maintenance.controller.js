const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const maintenanceService = require("../services/maintenance.service");

class MaintenanceController {
  getAll = catchAsync(async (req, res, next) => {
    const query = req.query;
    const data = await maintenanceService.getAll(query);
    GET(res, data);
  });

  renderApp = catchAsync(async (req, res, next) => {
    const data = await maintenanceService.renderApp();
    GET(res, data);
  });

  add = catchAsync(async (req, res, next) => {
    const { creator, ...payload } = req.body;
    const data = await maintenanceService.add(payload);
    CREATED(res, data);
  });

  deleteById = catchAsync(async (req, res, next) => {
    await maintenanceService.deleteById();
    DELETE(res, {});
  });
}

module.exports = new MaintenanceController();
