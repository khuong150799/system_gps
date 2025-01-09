// const taskApi = require("../api/task.api");
const { REDIS_KEY_IS_MAINTENANCE } = require("../constants/redis.constant");
const { SERVICE_UNAVAILABLE } = require("../core/reasonPhrases");
// const { GET } = require("../core/success.response");
const catchAsync = require("../helper/catchAsync.helper");
const { get: getRedis } = require("../models/redis.model");
const maintenanceService = require("../services/maintenance.service");

const maintenanceMiddleware = catchAsync(async (req, res, next) => {
  // const result = await taskApi.get();

  const { data } = await getRedis(REDIS_KEY_IS_MAINTENANCE);
  // console.log("data", data);

  if (data) {
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
