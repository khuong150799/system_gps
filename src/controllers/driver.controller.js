const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const driverService = require("../services/driver.service");

class DriverController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage, totalRecord } = await driverService.getallrows(
      query
    );

    GET(res, data, totalPage, totalRecord);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await driverService.getById(params, query);
    GET(res, data);
  });

  getTree = catchAsync(async (req, res) => {
    const userId = req.userId;
    const query = req.query;
    const data = await driverService.getTree(query, userId);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const accId = req.userId;
    const body = req.body;
    const data = await driverService.register(body, accId);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await driverService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await driverService.deleteById(params);
    DELETE(res, data);
  });

  updateActived = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await driverService.updateActived(body, params);
    UPDATE(res, data);
  });

  updateCheck = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await driverService.updateCheck(body, params);
    UPDATE(res, data);
  });
}

module.exports = new DriverController();
