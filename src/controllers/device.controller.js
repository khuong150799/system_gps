const { DEVICE_IS_READY } = require("../constants/msg.contant");
const {
  GET,
  CREATED,
  UPDATE,
  DELETE,
  OK,
} = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const deviceService = require("../services/device.service");

class DeviceController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const customerId = req.customerId;
    const { data, totalPage } = await deviceService.getallrows(
      query,
      customerId
    );

    GET(res, data, totalPage);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const customerId = req.customerId;
    const data = await deviceService.getById(params, query, customerId);
    GET(res, data);
  });

  reference = catchAsync(async (req, res) => {
    const params = req.params;
    const parentId = req.parentId;
    const data = await deviceService.reference(params, parentId);
    GET(res, data);
  });

  checkOutside = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await deviceService.checkOutside(params);
    OK(res, data, {}, DEVICE_IS_READY);
  });

  checkInside = catchAsync(async (req, res) => {
    const userId = req.userId;
    const parentId = req.parentId;
    const params = req.params;
    const data = await deviceService.checkInside(params, userId, parentId);
    OK(res, data, {}, DEVICE_IS_READY);
  });

  activationOutside = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await deviceService.activationOutside(body);
    CREATED(res, [data]);
  });

  activationInside = catchAsync(async (req, res) => {
    const body = req.body;
    const userId = req.userId;
    const parentId = req.parentId;
    const data = await deviceService.activationInside(body, userId, parentId);
    CREATED(res, [data]);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const userId = req.userId;
    const data = await deviceService.register(body, userId);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await deviceService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await deviceService.deleteById(params);
    DELETE(res, data);
  });
}

module.exports = new DeviceController();
