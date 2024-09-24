const db = require("../dbs/init.mysql");
const deviceModel = require("../models/device.model");
const {
  ERROR,
  ALREADY_EXITS,
  NOT_EXITS,
  NOT_EMPTY,
  ACC_CHILD_NOT_ACTIVE,
} = require("../constants/msg.constant");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const validateModel = require("../models/validate.model");
const {
  tableUsers,
  tableVehicle,
  tableDevice,
  tableDeviceVehicle,
  tableModel,
} = require("../constants/tableName.constant");

const databaseModel = new DatabaseModel();

class DeviceService {
  //dùng cho tool kích hoạt thiết bị
  selectId = async (imei) => {
    const { conn } = await db.getConnection();
    try {
      const data = await databaseModel.select(
        conn,
        tableDevice,
        "id",
        "imei IN (?)",
        [imei],
        "id",
        "ASC",
        0,
        100000
      );
      console.log("data", data);
      return data;
    } catch (error) {
      console.log(error);
    } finally {
      conn.release();
    }
  };

  async validate(conn, devId, imei, id = null) {
    let where = `(dev_id = ? OR imei = ?) AND is_deleted = ?`;
    const conditions = [devId, imei, 0];

    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await databaseModel.select(
      conn,
      tableDevice,
      "dev_id,imei",
      where,
      conditions
    );
    if (dataCheck.length <= 0) return [];
    console.log("dataCheck", dataCheck);
    const errors = dataCheck.map((item) => {
      if (item.dev_id) {
        return {
          value: devId,
          msg: `Mã đầu ghi ${ALREADY_EXITS}`,
          param: "dev_id",
        };
      } else if (item.imei) {
        return {
          value: imei,
          msg: `Imei ${ALREADY_EXITS}`,
          param: "imei",
        };
      }
    });

    throw {
      msg: ERROR,
      errors,
    };
  }

  // async getInfoDeviceLink(conn, vehicleId) {
  //   const joinTable = `${tableDevice} d INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id`;
  //   const select = "d.imei";
  //   const info = await databaseModel.select(
  //     conn,
  //     joinTable,
  //     select,
  //     "dv.vehicle_id = ?",
  //     vehicleId,
  //     "d.id",
  //     "ASC",
  //     0,
  //     1
  //   );
  //   if (!info?.length)
  //     throw {
  //       msg: ERROR,
  //       errors: [
  //         {
  //           msg: `Phương tiện ${NOT_EXITS}`,
  //           value: vehicleId,
  //           param: "vehicle_id",
  //         },
  //       ],
  //     };

  //   return info[0];
  // }

  //getallrow
  async getallrows(query, customerId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await deviceModel.getallrows(conn, query, customerId);
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

  //getbyid
  async getById(params, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await deviceModel.getById(conn, params, userId);
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

  async reference(params, parentId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await deviceModel.reference(conn, params, parentId);
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

  //check
  async checkOutside(params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { type, imei: imeiReciveData } = await deviceModel.checkOutside(
          conn,
          params
        );
        return { imei: imeiReciveData, type };
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //checked
  async checkInside(params, userId, parentId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { type, imei: imeiReciveData } = await deviceModel.checkInside(
          conn,
          params,
          userId,
          parentId
        );
        return { imei: imeiReciveData, type };
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //activation
  async activationOutside(body) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { username, password, is_check_exited, imei } = body;
        const dataInfoDevice = await deviceModel.checkOutside(conn, { imei });

        await validateModel.checkRegexUsername(username);

        await validateModel.checkRegexPassword(password, true);
        if (Number(is_check_exited) === 1) {
          await validateModel.checkExitValue(
            conn,
            tableUsers,
            "username",
            username,
            "Tài khoản",
            "username"
          );
        } else {
        }

        const {
          user_id,
          id,
          type: model_type_id,
          imei: imeiDb,
        } = dataInfoDevice;
        const dataBody = {
          ...body,
          parent_id: user_id,
          device_id: id,
          model_type_id,
          imei: imeiDb,
        };

        const data = await deviceModel.activationOutside(
          conn,
          connPromise,
          dataBody
        );
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

  async activationInside(body, userId, parentId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { imei, vehicle, type, vehicle_id } = body;

        if (!vehicle_id && (!vehicle || !type))
          throw {
            msg: ERROR,
            errors: [
              {
                value: vehicle || vehicle,
                msg: NOT_EMPTY,
                param: vehicle ? "Tên phương tiện" : "Loại phương tiện",
              },
            ],
          };

        const dataInfoDevice = await deviceModel.checkInside(
          conn,
          { imei },
          userId,
          parentId
        );

        const { id, type: model_type_id, imei: imeiDb } = dataInfoDevice;

        const { is_actived, is_deleted, is_main } =
          await validateModel.checkUserInfo(conn, userId);

        if (is_main == 0) throw { msg: ACC_CHILD_NOT_ACTIVE };

        await validateModel.checkStatusUser(is_actived, is_deleted);
        if (!vehicle_id) {
          await validateModel.checkExitValue(
            conn,
            tableVehicle,
            "name",
            vehicle,
            "Biển số phương tiện",
            "vehicle"
          );
        }

        const dataBody = {
          ...body,
          device_id: id,
          model_type_id,
          imei: imeiDb,
        };

        const data = await deviceModel.activationInside(
          conn,
          connPromise,
          dataBody,
          userId
        );
        return data;
      } catch (error) {
        console.log("error", error);
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //Register
  async register(body, userId, isMain, parentId, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { dev_id, imei, model_id, sv_cam_id } = body;

        await this.validate(conn, dev_id, imei);

        const dataModel = await validateModel.checkExitValue(
          conn,
          tableModel,
          "id",
          model_id,
          "Model",
          "model_id",
          null,
          false,
          "model_type_id"
        );

        const modelType = dataModel[0].model_type_id;

        if (Number(modelType) === 2 && !sv_cam_id)
          throw {
            msg: ERROR,
            errors: [{ value: sv_cam_id, msg: NOT_EMPTY, param: "sv_cam_id" }],
          };

        const device = await deviceModel.register(
          conn,
          connPromise,
          { ...body, model_type_id: modelType },
          userId,
          isMain,
          parentId,
          infoUser
        );
        return device;
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      // console.log(error);

      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //update
  async updateById(body, params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { dev_id, imei } = body;
        const { id } = params;

        await this.validate(conn, dev_id, imei, id);

        const device = await deviceModel.updateById(
          conn,
          connPromise,
          body,
          params,
          infoUser
        );
        return device;
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

  //delete
  async deleteById(params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        await deviceModel.deleteById(conn, connPromise, params, infoUser);
        return [];
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new DeviceService();
