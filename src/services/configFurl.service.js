const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const { tableRole } = require("../constants/tableName.constant");
const validateModel = require("../models/validate.model");
const configFuelModel = require("../models/configFuel.model");
const {
  ERROR,
  CALIB_FAIL,
  CALIB_FAIL_QUANTITY,
  CALIB_FAIL_PARAM,
  NOT_CONFIG_FUEL_DEVICE,
} = require("../constants/msg.constant");

class ConfigFuelService {
  //getallrow
  //   async getallrows(query, role) {
  //     try {
  //       const { conn } = await db.getConnection();
  //       try {
  //         const data = await configFuelModel.getallrows(conn, query, role);
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
        const data = await configFuelModel.getById(conn, query);
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
        const { calib, device_id } = body;

        const calibParse = JSON.parse(calib);

        if (Object.keys(calibParse).length < 2)
          throw { nsg: ERROR, errors: [{ msg: CALIB_FAIL_QUANTITY }] };

        let i = 0;
        let prevItem = {};
        let isStructure = false;

        for (const percent in calibParse) {
          if (Object.prototype.hasOwnProperty.call(calibParse, percent)) {
            const lit = calibParse[percent];
            if (i > 0) {
              if (prevItem?.percent >= percent || prevItem?.lit >= lit) {
                isStructure = true;
                break;
              }
            }
            prevItem.lit = lit;
            prevItem.percent = percent;
            i++;
          }
        }

        if (isStructure)
          throw { nsg: ERROR, errors: [{ msg: CALIB_FAIL_PARAM }] };

        const dataDevice = await validateModel.checkOwnerDevice(
          conn,
          userId,
          [device_id],
          NOT_CONFIG_FUEL_DEVICE
        );

        const { imei, vehicle_id } = dataDevice[0];

        const data = await configFuelModel.register(conn, connPromise, {
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
        const { calib, device_id } = body;

        const calibParse = JSON.parse(calib);

        if (Object.keys(calibParse).length < 2)
          throw { nsg: ERROR, errors: [{ msg: CALIB_FAIL_QUANTITY }] };

        let i = 0;
        let prevItem = {};
        let isStructure = false;

        for (const percent in calibParse) {
          if (Object.prototype.hasOwnProperty.call(calibParse, percent)) {
            const lit = calibParse[percent];
            if (i > 0) {
              if (prevItem?.percent >= percent || prevItem?.lit >= lit) {
                isStructure = true;
                break;
              }
            }
            prevItem.lit = lit;
            prevItem.percent = percent;
            i++;
          }
        }

        if (isStructure)
          throw { nsg: ERROR, errors: [{ msg: CALIB_FAIL_PARAM }] };

        const dataDevice = await validateModel.checkOwnerDevice(
          conn,
          userId,
          [device_id],
          NOT_CONFIG_FUEL_DEVICE
        );
        // console.log("dataDevice", dataDevice);

        const { imei, vehicle_id } = dataDevice[0];

        const data = await configFuelModel.updateById(
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
        await configFuelModel.deleteById(conn, params);
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

module.exports = new ConfigFuelService();
