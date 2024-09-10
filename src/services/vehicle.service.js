const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const vehicleModel = require("../models/vehicle.model");
const {
  tableVehicle,
  tableDevice,
  tableDeviceVehicle,
  tableServicePackage,
} = require("../constants/tableName.constant");
const DatabaseModel = require("../models/database.model");
const validateModel = require("../models/validate.model");

const dataBaseModel = new DatabaseModel();

class vehicleService {
  async updateName(body, params, infoUser) {
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

        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
          INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei,v.name,d.id as device_id",
          "v.id = ?",
          id,
          "d.id"
        );

        console.log("body", body);

        const data = await vehicleModel.updateName(
          conn,
          connPromise,
          body,
          params,
          dataInfo,
          infoUser
        );
        return data;
      } catch (error) {
        await connPromise.rollback();
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

  async updateById(body, params) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
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
          dataInfo
        );
        return data;
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      throw new BusinessLogicError(error.msg);
    }
  }

  async updateExpiredOn(body, params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        const { device_id } = body;

        // console.log(id, device_id);

        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
        INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei,dv.expired_on",
          "v.id = ? AND d.id = ?",
          [id, device_id],
          "d.id"
        );
        const data = await vehicleModel.updateExpiredOn(
          conn,
          connPromise,
          body,
          params,
          dataInfo,
          infoUser
        );
        return data;
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      throw new BusinessLogicError(error.msg);
    }
  }

  //updateActivationDate
  async updateActivationDate(body, params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        const { device_id } = body;

        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
        INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei,dv.activation_date",
          "v.id = ? AND d.id = ?",
          [id, device_id],
          "d.id"
        );
        const data = await vehicleModel.updateActivationDate(
          conn,
          connPromise,
          body,
          params,
          dataInfo,
          infoUser
        );
        return data;
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      throw new BusinessLogicError(error.msg);
    }
  }

  //updateWarrantyExpiredOn
  async updateWarrantyExpiredOn(body, params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        const { device_id } = body;

        const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
        INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

        const dataInfo = await dataBaseModel.select(
          conn,
          joinTable,
          "d.imei,dv.warranty_expired_on",
          "v.id = ? AND d.id = ?",
          [id, device_id],
          "d.id"
        );
        const data = await vehicleModel.updateWarrantyExpiredOn(
          conn,
          connPromise,
          body,
          params,
          dataInfo,
          infoUser
        );
        return data;
      } catch (error) {
        await connPromise.rollback();
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
