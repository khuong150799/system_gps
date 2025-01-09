const taskApi = require("../api/task.api");
const { SERVICE_UNAVAILABLE } = require("../core/reasonPhrases");
const { GET } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const maintenanceService = require("../services/maintenance.service");

const maintenanceMiddleware = catchAsync(async (req, res, next) => {
  const result = await taskApi.get();
  if (result.data) {
    const { title, body } = await maintenanceService.getAll();
    return res.status(503).json({
      result: "true",
      status: 503,
      message: SERVICE_UNAVAILABLE,
      data: {
        title,
        body,
      },
    });
  }
  next();
});

module.exports = maintenanceMiddleware;
