const { Api400Error } = require("../core/error.response");
const permissionService = require("../services/permission.service");
const { get: getRedis } = require("../models/redis.model");
const { REDIS_KEY_PERMISSION } = require("../constants/redis.constant");

const checkPermission = async function (req, res, next) {
  try {
    // return next();

    const { role, level, method, attchPath } = req;

    const { result, data: dataRedis } = await getRedis(REDIS_KEY_PERMISSION);
    // console.log("perissionRedis", perissionRedis);
    let data = {};
    if (!result || (result && !dataRedis)) {
      data = await permissionService.init();
      if (Object.keys(data).length <= 0) throw "lỗi";
    } else if (result && dataRedis) {
      data = JSON.parse(dataRedis);
    } else {
      throw "lỗi";
    }

    const permission = data[`${method}_${attchPath}`];

    if (!permission) throw "lỗi";
    const { role: rolePermission, level: levelPermission } = permission;

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
