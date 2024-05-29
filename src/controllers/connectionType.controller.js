const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catch.async");
const connectionTypeService = require("../services/connectionType.service");

class ConnectionTypeController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage } = await connectionTypeService.getallrows(query);

    GET(res, data, totalPage);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await connectionTypeService.getById(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await connectionTypeService.register(body);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await connectionTypeService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await connectionTypeService.deleteById(params);
    DELETE(res, data);
  });

  updatePublish = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await connectionTypeService.updatePublish(body, params);
    UPDATE(res, data);
  });
}

module.exports = new ConnectionTypeController();
