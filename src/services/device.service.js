const db = require("../dbs/init.mysql");
const deviceModel = require("../models/device.model");
const { ERROR, ALREADY_EXITS } = require("../constants/msg.contant");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const validateModel = require("../models/validate.model");
const {
  tableUsers,
  tableVehicle,
  tableDevice,
} = require("../constants/tableName.contant");

const databaseModel = new DatabaseModel();

class DeviceService {
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
      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params, query, customerId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await deviceModel.getById(conn, params, query, customerId);
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
      const { imei } = params;
      const { conn } = await db.getConnection();
      try {
        await deviceModel.checkOutside(conn, params);
        return { imei };
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
        const { imei } = params;
        await deviceModel.checkInside(conn, params, userId, parentId);
        return { imei };
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
        const {
          username,
          password,

          imei,
        } = body;
        const dataInfoDevice = await deviceModel.checkOutside(conn, { imei });

        await validateModel.checkRegexUsername(username);

        await validateModel.checkRegexPassword(password, true);

        await validateModel.checkExitValue(
          conn,
          tableUsers,
          "username",
          username,
          "Tài khoản",
          "username"
        );

        const { user_id, id } = dataInfoDevice[0];
        const dataBody = { ...body, parent_id: user_id, device_id: id };
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
        const { imei, vehicle } = body;

        const dataInfoDevice = await deviceModel.checkInside(
          conn,
          { imei },
          userId,
          parentId
        );
        const { id } = dataInfoDevice[0];

        const { is_actived, is_deleted } = await validateModel.checkUserInfo(
          conn,
          userId
        );

        await validateModel.checkStatusUser(is_actived, is_deleted);

        await validateModel.checkExitValue(
          conn,
          tableVehicle,
          "name",
          vehicle,
          "Biển số phương tiện",
          "vehicle"
        );

        const dataBody = { ...body, device_id: id };
        const data = await deviceModel.activationInside(
          conn,
          connPromise,
          dataBody,
          userId
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
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //Register
  async register(body, userId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { dev_id, imei } = body;

        await this.validate(conn, dev_id, imei);

        const device = await deviceModel.register(
          conn,
          connPromise,
          body,
          userId
        );
        return device;
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

  //update
  async updateById(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { dev_id, imei } = body;
        const { id } = params;

        await this.validate(conn, dev_id, imei, id);

        const device = await deviceModel.updateById(conn, body, params);
        return device;
      } catch (error) {
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
      const { conn, connPromise } = await db.getConnection();
      try {
        await deviceModel.deleteById(conn, connPromise, params);
        return [];
      } catch (error) {
        connPromise.rollback();
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
