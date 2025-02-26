const { REDIS_KEY_ENV } = require("../constants/redis.constant");
const redisModel = require("./redis.model");

class EnvModel {
  async getAll(query = {}) {
    const isQueryProvided = !!query.env;

    const redisMethod = isQueryProvided ? "hGet" : "hGetAll";
    const redisArgs = isQueryProvided
      ? [REDIS_KEY_ENV, query.env]
      : [REDIS_KEY_ENV];

    const { data } = await redisModel[redisMethod](...redisArgs);

    return data;
  }

  async register(body) {
    const { env, data } = body;
    await redisModel.hSet(REDIS_KEY_ENV, env, data);
    return null;
  }
}

module.exports = new EnvModel();
