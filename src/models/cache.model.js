const { hGet, hSet, del, hdelOneKey } = require("./redis.model");
const safeJsonParse = require("../ultils/json.util");

class CacheModel {
  hgetRedis = async (key, feild) => {
    const { data } = await hGet(key, feild.toString());
    if (data) {
      console.log(key);

      return safeJsonParse(data);
    }
  };

  hsetRedis = async (key, feild, value) => {
    await hSet(key, feild.toString(), JSON.stringify(value));
  };
  delRedis = async (key) => {
    const { result } = await del(key);
    return result;
  };

  hdelOneKeyRedis = async (key, field) => {
    const { result } = await hdelOneKey(key, field);
    return result;
  };
}

module.exports = new CacheModel();
