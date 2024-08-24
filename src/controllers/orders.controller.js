const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const ordersService = require("../services/orders.service");

class OrdersController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const customerId = req?.customerId;
    const chooseCustomerId = query.customer_id || customerId;
    const { data, totalPage, totalRecord } = await ordersService.getallrows(
      query,
      chooseCustomerId
    );

    GET(res, data, totalPage, totalRecord);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await ordersService.getById(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const { userId, customerId, level, role, body } = req;

    const data = await ordersService.register(
      body,
      userId,
      customerId,
      level,
      role
    );
    CREATED(res, [data]);
  });

  merge = catchAsync(async (req, res) => {
    const userId = req?.userId;
    const customerId = req?.customerId;
    const body = req.body;
    const data = await ordersService.merge(body, userId, customerId);
    CREATED(res, [data]);
  });

  registerTree = catchAsync(async (req, res) => {
    const customerId = req?.customerId;
    const userId = req?.userId;
    const body = req.body;
    const data = await ordersService.registerTree(body, userId, customerId);
    CREATED(res, data);
  });

  updateById = catchAsync(async (req, res) => {
    const customerId = req?.customerId;
    const body = req.body;
    const params = req.params;
    const data = await ordersService.updateById(body, params, customerId);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await ordersService.deleteById(params);
    DELETE(res, data);
  });

  deleteDevice = catchAsync(async (req, res) => {
    const customerId = req?.customerId;
    const body = req.body;
    const params = req.params;
    const data = await ordersService.deleteDevice(body, params, customerId);
    DELETE(res, data);
  });
}

module.exports = new OrdersController();
