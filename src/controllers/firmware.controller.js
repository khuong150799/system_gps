const { GET, CREATED, UPDATE, DELETE } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const firmwareService = require("../services/firmware.service");

class FirmwareController {
  getAllRows = catchAsync(async (req, res) => {
    const query = req.query;
    const { data, totalPage, totalRecord } = await firmwareService.getallrows(
      query
    );

    GET(res, data, totalPage, totalRecord);
  });

  getById = catchAsync(async (req, res) => {
    const params = req.params;
    const query = req.query;
    const data = await firmwareService.getById(params, query);
    GET(res, data);
  });

  register = catchAsync(async (req, res) => {
    const body = req.body;
    // const files = req.files;
    const fileFirmware = req?.files?.["firmware"];
    const fileNote = req?.files?.["file_note"];
    // const data = await firmwareService.register(body, files);
    const data = await firmwareService.register(body, fileFirmware, fileNote);
    CREATED(res, [data]);
  });

  updateById = catchAsync(async (req, res) => {
    const body = req.body;
    const params = req.params;
    // const files = req.files;
    const fileFirmware = req?.files?.["firmware"];
    const fileNote = req?.files?.["file_note"];
    const data = await firmwareService.updateById(
      body,
      params,
      fileFirmware,
      fileNote
    );
    UPDATE(res, [data]);
  });

  deleteById = catchAsync(async (req, res) => {
    const params = req.params;
    const data = await firmwareService.deleteById(params);
    DELETE(res, data);
  });
}

module.exports = new FirmwareController();
