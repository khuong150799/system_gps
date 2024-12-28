const { Api400Error } = require("../core/error.response");
const permissionService = require("../services/permission.service");
const { hGetAll } = require("../models/redis.model");
const { REDIS_KEY_PERMISSION } = require("../constants/redis.constant");

const checkPermission = async function (req, res, next) {
  try {
    // return next();

    const { role, level, method, attchPath } = req;

    const { result, data: dataRedis } = await hGetAll(
      REDIS_KEY_PERMISSION,
      "checkPermission.middleware.js",
      Date.now()
    );
    const key = `${method}_${attchPath}`;

    let data = dataRedis;

    if (!result || (result && !Object.keys(data)?.length)) {
      data = await permissionService.init();
    }

    const permission = data?.[key];

    if (!permission) throw "lỗi";
    const { role: rolePermission, level: levelPermission } =
      JSON.parse(permission);

    if (
      Number(role) < Number(rolePermission) ||
      Number(level) < Number(levelPermission)
    ) {
      throw "lỗi";
    }
    next();
  } catch (error) {
    return next(new Api400Error());
  }
};

module.exports = {
  checkPermission,
};
