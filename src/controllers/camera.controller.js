const { CONFIG_SUCCESS } = require("../constants/msg.constant");
const { OK, GET } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const cameraService = require("../services/camera.service");

class CMSController {
  getVehicleInfo = catchAsync(async (req, res, _) => {
    const { userId, query } = req;
    const data = await cameraService.getVehicleInfo(query, userId);
    GET(res, data);
  });

  configVehicleInfo = catchAsync(async (req, res, _) => {
    const { userId, body, params } = req;
    const { imei } = params;
    const result = await cameraService.configVehicleInfo(imei, body, userId);
    OK(res, result, {}, CONFIG_SUCCESS);
  });

  configACC = catchAsync(async (req, res, _) => {
    const { userId, body, params } = req;
    const { imei } = params;
    const result = await cameraService.configACC(imei, body, userId);
    OK(res, result, {}, CONFIG_SUCCESS);
  });

  fatigueMode = catchAsync(async (req, res, _) => {
    const { userId, body, params } = req;
    const { imei } = params;
    const result = await cameraService.fatigueMode(imei, body, userId);
    OK(res, result, {}, CONFIG_SUCCESS);
  });

  overSpeed = catchAsync(async (req, res, _) => {
    const { userId, body, params } = req;
    const { imei } = params;
    const result = await cameraService.overSpeed(imei, body, userId);
    OK(res, result, {}, CONFIG_SUCCESS);
  });
  configMirror = catchAsync(async (req, res, _) => {
    const { userId, body, params } = req;
    const { imei } = params;
    const result = await cameraService.configMirror(imei, body, userId);
    OK(res, result, {}, CONFIG_SUCCESS);
  });
}

module.exports = new CMSController();
