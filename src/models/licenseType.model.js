const { tableLicenseType } = require("../constants/tableName.contant");
const DatabaseModel = require("./database.model");

class LicenseTypeModel extends DatabaseModel {
  constructor() {
    super();
  }
  async getAllRows(conn) {
    const data = await this.select(
      conn,
      tableLicenseType,
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
