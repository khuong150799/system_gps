const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const licenseTypeModel = require("../models/licenseType.model");

class LicenseTypeService {
  async getAllRows() {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await licenseTypeModel.getAllRows(conn);
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
}

module.exports = new LicenseTypeService();
