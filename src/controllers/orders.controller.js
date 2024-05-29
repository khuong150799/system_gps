const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catch.async");
const ordersService = require("../services/orders.service");

class OrdersController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage } = await ordersService.getallrows(query);

    GET(res, data, totalPage);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await ordersService.getById(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const userId = req?.userId;
    const customerId = req?.customerId;
    const body = req.body;
    const data = await ordersService.register(body, userId, customerId);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await ordersService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await ordersService.deleteById(params);
    DELETE(res, data);
  });
}

module.exports = new OrdersController();
