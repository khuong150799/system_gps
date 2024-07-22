const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const settingService = require("../services/setting.service");

class SettingCateController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const role = req.role;
    const { data, totalPage, totalRecord } = await settingService.getallrows(
      query,
      role
    );

    GET(res, data, totalPage, totalRecord);
  });

  getList = catchAsync(async (req, res) => {
    const userId = req.userId;
    const data = await settingService.getList(userId);
    GET(res, data);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await settingService.getById(params, query);
    GET(res, data);
  });

  registerUser = catchAsync(async (req, res) => {
    const body = req.body;
    const userId = req.userId;
    const data = await settingService.registerUser(body, userId);
    CREATED(res, [data]);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await settingService.register(body);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await settingService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await settingService.deleteById(params);
    DELETE(res, data);
  });

  updatePublish = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await settingService.updatePublish(body, params);
    UPDATE(res, data);
  });

  updateSort = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await settingService.updateSort(body, params);
    UPDATE(res, data);
  });
}

module.exports = new SettingCateController();
