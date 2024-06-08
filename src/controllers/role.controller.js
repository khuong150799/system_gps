const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catch.async");
const roleService = require("../services/role.service");

class RoleController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage } = await roleService.getallrows(query);

    GET(res, data, totalPage);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await roleService.getById(params, query);
    GET(res, data);
  });

  getPermission = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await roleService.getPermission(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await roleService.register(body);
    CREATED(res, [data]);
  });

  registerPermission = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await roleService.registerPermission(body);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await roleService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await roleService.deleteById(params);
    DELETE(res, data);
  });

  deletePermission = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await roleService.deletePermission(body, params);
    DELETE(res, data);
  });

  updatePublish = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await roleService.updatePublish(body, params);
    UPDATE(res, data);
  });

  updateSort = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await roleService.updateSort(body, params);
    UPDATE(res, data);
  });
}

module.exports = new RoleController();
