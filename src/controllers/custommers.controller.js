const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const customersService = require("../services/customers.service");

class CustomersController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const userId = req.userId;
    const { data, totalPage } = await customersService.getallrows(
      query,
      userId
    );
    GET(res, data, totalPage);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await customersService.getById(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const userId = req.userId;
    const level = req.level;
    const data = await customersService.register(body, userId, level);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await customersService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await customersService.deleteById(params);
    DELETE(res, data);
  });

  updatePublish = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await customersService.updatePublish(body, params);
    UPDATE(res, data);
  });
}

module.exports = new CustomersController();
