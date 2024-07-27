const driverModel = require("../models/driver.model");
const db = require("../dbs/init.mysql");
const {
  ERROR,
  ALREADY_EXITS,
  WRITE_CARD_NOT_PERMISSION,
} = require("../constants/msg.contant");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const validateModel = require("../models/validate.model");
const { tableDriver } = require("../constants/tableName.contant");

const databaseModel = new DatabaseModel();

class DriverService {
  async validate(conn, licenseNumber, phone, id = null) {
    const errors = [];

    let where = `is_deleted = ?`;
    const conditions = [0];

    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    where += ` AND (license_number = ?`;
    conditions.push(licenseNumber);

    if (phone) {
      where += ` OR phone = ?`;
      conditions.push(phone);
    }

    where += `)`;

    const dataCheck = await databaseModel.select(
      conn,
      tableDriver,
      "license_number,phone",
      where,
      conditions
    );
    if (dataCheck.length <= 0) return [];

    dataCheck.forEach((item) => {
      if (item.license_number === licenseNumber) {
        errors.push({
          value: licenseNumber,
          msg: `Số bằng lái ${ALREADY_EXITS}`,
          param: "license_number",
        });
      } else if (phone && item.phone === phone) {
        errors.push({
          value: phone,
          msg: `Số diện thoại ${ALREADY_EXITS}`,
          param: "phone",
        });
      }
    });

    throw { msg: ERROR, errors };
  }

  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await driverModel.getallrows(conn, query);
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
  async getById(params, query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await driverModel.getById(conn, params, query);
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

  async getTree(query, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await driverModel.getTree(conn, query, userId);
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

  async wirteCard(body, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { device_id } = body;

        await validateModel.checkOwnerDevice(
          conn,
          userId,
          [device_id],
          WRITE_CARD_NOT_PERMISSION
        );
        const data = await driverModel.wirteCard(conn, body);
        return data;
      } catch (error) {
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

  //Register
  async register(body, accId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { license_number, phone } = body;

        if (phone) {
          await validateModel.checkRegexPhone(phone);
        }

        await this.validate(conn, license_number, phone);

        const driver = await driverModel.register(conn, body, accId);
        return driver;
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

  //update
  async updateById(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { license_number, phone } = body;
        const { id } = params;

        await this.validate(conn, license_number, phone, id);

        const driver = await driverModel.updateById(conn, body, params);
        return driver;
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
      const { conn } = await db.getConnection();
      try {
        await driverModel.deleteById(conn, params);
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

  //updateActived
  async updateActived(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await driverModel.updateActived(conn, body, params);
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

  //updateCheck
  async updateCheck(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await driverModel.updateCheck(conn, body, params);
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

module.exports = new DriverService();
