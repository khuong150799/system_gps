const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catch.async");
const moduleService = require("../services/module.service");

class ModuleController {
  getTree = catchAsync(async (req, res) => {
    const query = req.query;
    const data = await moduleService.getTree(query);
    GET(res, data);
  });

  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const data = await moduleService.getallrows(query);
    GET(res, data);
  });

  getById = catchAsync(async (req, res) => {
    // console.log({
    //   baseUrl: req.baseUrl,
    //   router: `${req.baseUrl}${req.route.path}`,
    // });
    const params = req.params;
    const query = req.query;
    const data = await moduleService.getById(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await moduleService.register(body);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await moduleService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await moduleService.deleteById(params);
    DELETE(res, data);
  });

  updatePublish = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await moduleService.updatePublish(body, params);
    UPDATE(res, data);
  });

  updateSort = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await moduleService.updateSort(body, params);
    UPDATE(res, data);
  });
}

module.exports = new ModuleController();
