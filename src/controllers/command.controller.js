const { SEND_COMMAND_SUSS } = require("../constants/msg.constant");
const { OK, GET } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const commandService = require("../services/command.service");

class CommandController {
  restart = catchAsync(async (req, res, _) => {
    const { body, userId } = req;
    const data = await commandService.restart(body, userId);
    OK(res, data, {}, SEND_COMMAND_SUSS);
  });

  peripheral = catchAsync(async (req, res, _) => {
    const { body, userId } = req;
    const data = await commandService.peripheral(body, userId);
    OK(res, data, {}, SEND_COMMAND_SUSS);
  });

  buzzerAlarm = catchAsync(async (req, res, _) => {
    const { body, userId } = req;
    const data = await commandService.buzzerAlarm(body, userId);
    OK(res, data, {}, SEND_COMMAND_SUSS);
  });

  setTemperateEnable = catchAsync(async (req, res, _) => {
    const { body, userId } = req;
    const data = await commandService.setTemperateEnable(body, userId);
    OK(res, data, {}, SEND_COMMAND_SUSS);
  });

  driverLogin = catchAsync(async (req, res, _) => {
    const { body, userId } = req;
    const data = await commandService.driverLogin(body, userId);
    OK(res, data, {}, SEND_COMMAND_SUSS);
  });

  setDrivingBreakTime = catchAsync(async (req, res, _) => {
    const { body, userId } = req;
    const data = await commandService.setDrivingBreakTime(body, userId);
    OK(res, data, {}, SEND_COMMAND_SUSS);
  });

  getConfigByImei = catchAsync(async (req, res, _) => {
    const { imei } = req.params;
    const data = await commandService.getConfigByImei(imei, req.query);
    GET(res, data);
  });
}

module.exports = new CommandController();
