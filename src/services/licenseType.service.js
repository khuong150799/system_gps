const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const tableName = "tbl_license_type";

class LicenseTypeService extends DatabaseService {
  constructor() {
    super();
  }
  async getAllRows() {
    try {
      const { conn } = await db.getConnection();
      const data = await this.select(
        conn,
        tableName,
        "id,title",
        "1 = 1",
        "id",
        "ASC"
      );
      conn.release();
      return data;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new LicenseTypeService();
