const configureEnvironment = require("../config/dotenv.config");
const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const interfaceService = require("../services/interface.service");

const { SV_ASSET_STORAGE_FE } = configureEnvironment();

class InterfaceController {
  getAllRows = catchAsync(async (req, res) => {
    const { query } = req;
    const { data, totalPage, totalRecord } = await interfaceService.getallrows(
      query
    );

    GET(res, data, totalPage, totalRecord, {
      sv_static_file: SV_ASSET_STORAGE_FE,
    });
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await interfaceService.getById(params, query);
    GET(res, data, 0, 0, { sv_static_file: SV_ASSET_STORAGE_FE });
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    const bannerFiles = req?.files?.["banner"];
    const logoFile = req?.files?.["logo"];
    const faviconFile = req?.files?.["favicon"];
    const data = await interfaceService.register(
      body,
      logoFile,
      faviconFile,
      bannerFiles
    );
    CREATED(res, [data]);
  });

  uploadImage = catchAsync(async (req, res) => {
    const body = req.body;
    const bannerFiles = req?.files?.["banner"];
    const logoFile = req?.files?.["logo"];
    const faviconFile = req?.files?.["favicon"];
    const data = await interfaceService.uploadImage(
      body,
      logoFile,
      faviconFile,
      bannerFiles
    );
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await interfaceService.updateById(body, params);
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await interfaceService.deleteById(params);
    DELETE(res, data);
  });

  deleteImage = catchAsync(async (req, res) => {
    const body = req.body;
    const data = await interfaceService.deleteImage(body);
    DELETE(res, data);
  });

  updatePublish = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await interfaceService.updatePublish(body, params);
    UPDATE(res, data);
  });

  updateSort = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    const data = await interfaceService.updateSort(body, params);
    UPDATE(res, data);
  });
}

module.exports = new InterfaceController();
