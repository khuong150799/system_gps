const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const settingCateService = require("../services/settingCate.service");

class SettingCateController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const role = req.role;
    const { data, totalPage, totalRecord } =
      await settingCateService.getallrows(query, role);

    GET(res, data, totalPage, totalRecord);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await settingCateService.getById(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await settingCateService.register(body);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await settingCateService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await settingCateService.deleteById(params);
    DELETE(res, data);
  });

  updatePublish = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await settingCateService.updatePublish(body, params);
    UPDATE(res, data);
  });

  updateSort = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await settingCateService.updateSort(body, params);
    UPDATE(res, data);
  });
}

module.exports = new SettingCateController();
