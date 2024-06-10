const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const levelService = require("../services/level.service");

class LevelController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const level = req.level;
    const { data, totalPage } = await levelService.getallrows(query, level);
    GET(res, data, totalPage);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await levelService.getById(params, query);
    GET(res, data);
  });

  getPermission = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await levelService.getPermission(params, query);
    GET(res, data);
  });

  getModule = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await levelService.getModule(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await levelService.register(body);
    CREATED(res, [data]);
  });

  registerPermission = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await levelService.registerPermission(body);
    CREATED(res, [data]);
  });

  registerModule = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await levelService.registerModule(body);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await levelService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await levelService.deleteById(params);
    DELETE(res, data);
  });

  deletePermission = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await levelService.deletePermission(body, params);
    DELETE(res, data);
  });

  deleteModule = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await levelService.deleteModule(body, params);
    DELETE(res, data);
  });

  updatePublish = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await levelService.updatePublish(body, params);
    UPDATE(res, data);
  });

  updateSort = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await levelService.updateSort(body, params);
    UPDATE(res, data);
  });
}

module.exports = new LevelController();
