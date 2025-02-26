const { BusinessLogicError } = require("../core/error.response");
const envModel = require("../models/env.model");

class EnvService {
  async init(env) {
    try {
      const data = await envModel.getAll({ env });
      global.env = JSON.parse(data);
      //   console.log("serviceInfo", global.serviceInfo);
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }
  async getAll(query) {
    try {
      const data = await envModel.getAll(query);
      return data;
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async register(body) {
    try {
      const data = await envModel.register(body);
      return data;
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }
}
module.exports = new EnvService();
