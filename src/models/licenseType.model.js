const DatabaseModel = require("./database.model");
const tableName = "tbl_license_type";

class LicenseTypeModel extends DatabaseModel {
  constructor() {
    super();
  }
  async getAllRows(conn) {
    const data = await this.select(
      conn,
      tableName,
      "id,title",
      "1 = ?",
      [1],
      "id",
      "ASC"
    );
    return data;
  }
}

module.exports = new LicenseTypeModel();
