const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const {
  tableRole,
  tableRenewalCode,
} = require("../constants/tableName.constant");
const validateModel = require("../models/validate.model");
const renewalCodeModel = require("../models/renewalCode.model");

class RenewalCodeService {
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await renewalCodeModel.getallrows(conn, query);
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
  async register(body) {
    try {
      const { conn } = await db.getConnection();
      try {
        // const { code } = body;
        // const listCode = JSON.parse(code);
        // await validateModel.checkExitMultiValue(
        //   conn,
        //   tableRenewalCode,
        //   "code",
        //   listCode,
        //   "",
        //   "code",
        //   null,
        //   true,
        //   "code"
        // );

        const data = await renewalCodeModel.register(conn, body);
        return data;
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
}

module.exports = new RenewalCodeService();