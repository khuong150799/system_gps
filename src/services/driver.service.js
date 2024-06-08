const driverModel = require("../models/driver.model");
const db = require("../dbs/init.mysql");
const { ERROR, VALIDATE_PHONE, ALREADY_EXITS } = require("../constants");
const { regexPhoneNumber } = require("../ultils/regex");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const tableName = "tbl_driver";

const databaseModel = new DatabaseModel();

class DriverService {
  async validate(conn, licenseNumber, phone, id = null) {
    const errors = [];

    if (phone && !regexPhoneNumber(phone))
      return {
        result: false,
        errors: {
          msg: ERROR,
          errors: [
            {
              value: phone,
              msg: VALIDATE_PHONE,
              param: "phone",
            },
          ],
        },
      };

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
      tableName,
      "license_number,phone",
      where,
      conditions
    );
    if (dataCheck.length <= 0) return { result: true };

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

    return {
      result: false,
      errors,
    };
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

  //Register
  async register(body, accId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { license_number, phone } = body;

        const isCheck = await this.validate(conn, license_number, phone);
        if (!isCheck.result) {
          throw isCheck.errors;
        }

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

        const isCheck = await this.validate(conn, license_number, phone, id);
        if (!isCheck.result) {
          throw isCheck.errors;
        }

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
      const { id } = params;
      const { is_actived } = body;

      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { is_actived }, "id", id);
      conn.release();
      return [];
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
