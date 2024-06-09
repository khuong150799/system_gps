const { REDIS_PROPERTY_PERMISSION } = require("../constants");
const { Api400Error } = require("../core/error.response");
const permissionService = require("../services/permission.service");
const { get: getRedis } = require("../models/redis.model");

const checkPermission = async function (req, res, next) {
  try {
    return next();

    const { role, level, method, attchPath } = req;

    const perissionRedis = await getRedis(REDIS_PROPERTY_PERMISSION);
    let data = {};
    if (
      !perissionRedis.result ||
      (perissionRedis.result && !perissionRedis.data)
    ) {
      data = await permissionService.init();
      if (Object.keys(data).length <= 0) throw "lỗi";
    } else if (perissionRedis.result && perissionRedis.data) {
      data = JSON.parse(perissionRedis.data);
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
