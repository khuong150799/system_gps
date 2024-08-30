const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const validateModel = require("../models/validate.model");
const configTemperatureModel = require("../models/configTemperature.model");
const { NOT_CONFIG_TEMP_DEVICE } = require("../constants/msg.constant");

class ConfigTemperatureService {
  //getallrow
  //   async getallrows(query, role) {
  //     try {
  //       const { conn } = await db.getConnection();
  //       try {
  //         const data = await configTemperatureModel.getallrows(conn, query, role);
  //         return data;
  //       } catch (error) {
  //         throw error;
  //       } finally {
  //         conn.release();
  //       }
  //     } catch (error) {
  //       throw new BusinessLogicError(error.msg);
  //     }
  //   }

  //getbyid
  async getById(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await configTemperatureModel.getById(conn, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //Register
  async register(userId, body) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { device_id } = body;

        const dataDevice = await validateModel.checkOwnerDevice(
          conn,
          userId,
          [device_id],
          NOT_CONFIG_TEMP_DEVICE
        );

        const { imei, vehicle_id } = dataDevice[0];

        const data = await configTemperatureModel.register(conn, connPromise, {
          ...body,
          imei,
          vehicle_id,
        });
        return data;
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log("error", error);

      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //update
  async updateById(userId, body, params) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { device_id } = body;

        const dataDevice = await validateModel.checkOwnerDevice(
          conn,
          userId,
          [device_id],
          NOT_CONFIG_TEMP_DEVICE
        );
        // console.log("dataDevice", dataDevice);

        const { imei, vehicle_id } = dataDevice[0];

        const data = await configTemperatureModel.updateById(
          conn,
          { ...body, imei, vehicle_id },
          params
        );
        return data;
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //delete
  async deleteById(params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await configTemperatureModel.deleteById(conn, params);
        return [];
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new ConfigTemperatureService();
