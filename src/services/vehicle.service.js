const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const vehicleModel = require("../models/vehicle.model");
const {
  tableVehicle,
  tableDevice,
  tableDeviceVehicle,
} = require("../constants/tableName.constant");
const DatabaseModel = require("../models/database.model");
const validateModel = require("../models/validate.model");

const dataBaseModel = new DatabaseModel();

class vehicleService {
  async updateName(body, params) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { name } = body;
        const { id } = params;

        await validateModel.checkExitValue(
          conn,
          tableVehicle,
          "name",
          name,
          "ID",
          "name",
          id
        );

        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.device_id
          INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei",
          "v.id = ?",
          id,
          "d.id"
        );

        const data = await vehicleModel.updateName(
          conn,
          connPromise,
          body,
          params,
          dataInfo
        );
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

  async updatePackage(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await vehicleModel.updatePackage(conn, body, params);
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

  async updateById(body, params, userId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.device_id
        INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei",
          "v.id = ?",
          id,
          "d.id"
        );
        const data = await vehicleModel.updateById(
          conn,
          connPromise,
          body,
          params,
          userId,
          dataInfo
        );
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
