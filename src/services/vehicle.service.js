const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const vehicleModel = require("../models/vehicle.model");
const { checkExitValue } = require("../models/validate.model");
const { tableVehicle } = require("../constants/tableName.constant");

class vehicleService {
  async updateName(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { name } = body;

        await checkExitValue(conn, tableVehicle, "name", name);

        const data = await vehicleModel.updateName(conn, body, params);
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

  async updateById(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await vehicleModel.updateById(conn, body, params);
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
