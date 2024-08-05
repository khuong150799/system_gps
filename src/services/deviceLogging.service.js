const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");

const deviceLoggingModel = require("../models/deviceLogging.model");

class DeviceLoggingService {
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await deviceLoggingModel.getallrows(conn, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log("error", error);
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new DeviceLoggingService();
