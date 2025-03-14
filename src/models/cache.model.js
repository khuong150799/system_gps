const { hGet, hSet, del, hdelOneKey } = require("./redis.model");
const safeJsonParse = require("../utils/json.util");
const { ERROR } = require("../constants/msg.constant");

class CacheModel {
  hgetRedis = async (key, feild) => {
    const { data } = await hGet(key, feild.toString());
    if (data) {
      return safeJsonParse(data);
    }
  };

  hsetRedis = async (key, feild, value, ischeckCache = false) => {
    const { result } = await hSet(key, feild.toString(), JSON.stringify(value));
    if (ischeckCache && !result) throw { msg: ERROR, error: [{ code: 1 }] };
    return result;
  };
  delRedis = async (key) => {
    const { result } = await del(key);
    return result;
  };

  hdelOneKeyRedis = async (key, field, ischeckCache = false) => {
    const { result } = await hdelOneKey(key, field.toString());
    if (ischeckCache && !result) throw { msg: ERROR, error: [{ code: 1 }] };
    return result;
  };
}

module.exports = new CacheModel();
