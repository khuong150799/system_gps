const taskApi = require("../api/task.api");
const { ERROR } = require("../constants/msg.constant");
const { REDIS_KEY_MAINTENANCE } = require("../constants/redis.constant");
// const maintenanceTask = require("../tasks/maintenance.task");
const DatabaseModel = require("./database.model");
const { get: getRedis, set: setRedis, del } = require("./redis.model");
// const redisModel = require("./redis.model");
class MaintenanceModel extends DatabaseModel {
  constructor() {
    super();
  }

  async getAll() {
    try {
      const { data } = await getRedis(
        REDIS_KEY_MAINTENANCE,
        "gateway.model.js",
        Date.now()
      );
      return data ? JSON.parse(data) : {};
    } catch (error) {
      throw error;
    }
  }

  async renderApp() {
    try {
      const { result, data } = await getRedis(
        REDIS_KEY_MAINTENANCE,
        "gateway.model.js",
        Date.now()
      );
      if (result && data) return JSON.parse(data);
      return {};
    } catch (error) {
      throw error;
    }
  }

  async add(payload) {
    try {
      const { start_time, end_time, title, body, render_app } = payload;
      const defaultData = {
        start_time,
        end_time,
        title,
        body,
        render_app,
      };
      const { result } = await setRedis(
        REDIS_KEY_MAINTENANCE,
        JSON.stringify(defaultData),
        "gateway.model.js",
        Date.now()
      );
      console.log("res", result);

      if (!result) throw { msg: ERROR };
      console.log("payload", payload);

      await taskApi.register(payload);
      return [];
    } catch (error) {
      throw error;
    }
  }

  async deleteById() {
    try {
      const { result } = await del(
        REDIS_KEY_MAINTENANCE,
        "gateway.model.js",
        Date.now()
      );
      if (!result) throw { msg: ERROR };
      await taskApi.delete();
      return [];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new MaintenanceModel();
