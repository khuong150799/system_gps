const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const vehicleModel = require("../models/vehicle.model");

class vehicleService {
  //getallrow
  async playback(userId, query, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await vehicleModel.playback(conn, userId, query, params);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new vehicleService();
