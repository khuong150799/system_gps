const driverModel = require("../models/driver.model");
const db = require("../dbs/init.mysql");
const {
  ERROR,
  ALREADY_EXITS,
  WRITE_CARD_NOT_PERMISSION,
  NOT_EXITS,
} = require("../constants/msg.constant");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const validateModel = require("../models/validate.model");
const {
  tableDriver,
  tableCustomersDriver,
} = require("../constants/tableName.constant");
const usersModel = require("../models/users.model");

const databaseModel = new DatabaseModel();

class DriverService {
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      const { customer_id } = query;

      try {
        const dataInfo = await usersModel.getInfoParent(
          conn,
          null,
          customer_id
        );
        if (!dataInfo?.length) return [];

        const { right: rightRes, left: leftRes } = dataInfo[0];
        const chosseRight = rightRes;
        const chosseLeft = leftRes;
        const data = await driverModel.getallrows(
          conn,
          query,
          chosseLeft,
          chosseRight
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
      console.log(error);

      throw new BusinessLogicError(error.msg);
    }
  }

  async getTree(query, isMain, parentId, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const dataParent = await usersModel.getInfoParent(
          conn,
          isMain == 0 ? parentId : userId
        );
        if (!dataParent?.length) return [];

        const { right, left } = dataParent[0];
        const chosseRight = right;
        const chosseLeft = left;

        // const data = await driverModel.getTree(conn, query, userId, customerId);
        const data = await driverModel.getTree(
          conn,
          query,
          chosseLeft,
          chosseRight
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

  async writeCard(body, userId) {
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
        const data = await driverModel.writeCard(conn, body);
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
      const { conn, connPromise } = await db.getConnection();
      try {
        const { license_number, phone } = body;

        await validateModel.checkRegexLicense(license_number);

        if (phone) {
          await validateModel.checkRegexPhone(phone);
        }

        const driver = await driverModel.register(
          conn,
          connPromise,
          body,
          accId
        );
        return driver;
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
      const { conn, connPromise } = await db.getConnection();
      try {
        const { license_number, phone } = body;
        const { id } = params;
        await validateModel.checkRegexLicense(license_number);
        if (phone) {
          await validateModel.checkRegexPhone(phone);
        }

        const driverInfo = await databaseModel.select(
          conn,
          `${tableDriver} d INNER JOIN ${tableCustomersDriver} cd ON d.id = cd.driver_id`,
          "d.id as driver_id, d.license_number,cd.customer_id",
          "cd.id = ? AND cd.is_deleted = 0 AND d.is_deleted = 0",
          id,
          "d.id",
          "ASC",
          0,
          1
        );

        if (!driverInfo?.length) throw { msg: `ID ${NOT_EXITS}` };

        const {
          driver_id: driverId,
          customer_id: customerId,
          license_number: licenseNumber,
        } = driverInfo[0];

        const driver = await driverModel.updateById(
          conn,
          connPromise,
          body,
          params,
          driverId,
          customerId,
          licenseNumber
        );
        return driver;
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
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;

        const driverInfo = await databaseModel.select(
          conn,
          `${tableDriver} d INNER JOIN ${tableCustomersDriver} cd ON d.id = cd.driver_id`,
          "d.id as driver_id, d.license_number,cd.customer_id",
          "cd.id = ? AND cd.is_deleted = 0 AND d.is_deleted = 0",
          id,
          "d.id",
          "ASC",
          0,
          1
        );
        if (!driverInfo?.length) throw { msg: `ID ${NOT_EXITS}` };

        const { driver_id } = driverInfo[0];

        const countCustomerOfDriver = await databaseModel.count(
          conn,
          tableCustomersDriver,
          "*",
          "driver_id = ? AND is_deleted = ?",
          [driver_id, 0]
        );

        const isDeleteđriver =
          countCustomerOfDriver[0]?.total > 1 ? false : true;

        await driverModel.deleteById(
          conn,
          connPromise,
          params,
          driverInfo[0],
          isDeleteđriver
        );
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
