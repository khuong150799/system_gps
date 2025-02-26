const { CONFIG_SUCCESS } = require("../constants/msg.constant");
const { OK } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const cameraService = require("../services/camera.service");

class CMSController {
  configVehicleInfo = catchAsync(async (req, res, _) => {
    const { imei } = req.params;
    const result = await cameraService.configVehicleInfo(imei, req.body);
    OK(res, result, {}, CONFIG_SUCCESS);
  });

  configACC = catchAsync(async (req, res, _) => {
    const { imei } = req.params;
    const result = await cameraService.configACC(imei, req.body);
    OK(res, result, {}, CONFIG_SUCCESS);
  });

  fatigueMode = catchAsync(async (req, res, _) => {
    const { imei } = req.params;
    const result = await cameraService.fatigueMode(imei, req.body);
    OK(res, result, {}, CONFIG_SUCCESS);
  });

  overSpeed = catchAsync(async (req, res, _) => {
    const { imei } = req.params;
    const result = await cameraService.overSpeed(imei, req.body);
    OK(res, result, {}, CONFIG_SUCCESS);
  });
  configMirror = catchAsync(async (req, res, _) => {
    const { imei } = req.params;
    const result = await cameraService.configMirror(imei, req.body);
    OK(res, result, {}, CONFIG_SUCCESS);
  });
}

module.exports = new CMSController();
