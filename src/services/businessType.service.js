const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const businessTypeModel = require("../models/businessType.model");

class BusinessTypeService {
  async getAllRows() {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await businessTypeModel.getAllRows(conn);
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

module.exports = new BusinessTypeService();
