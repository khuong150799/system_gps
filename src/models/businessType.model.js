const { tableBusinessType } = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");

class BusinessModel extends DatabaseModel {
  constructor() {
    super();
  }
  async getAllRows(conn) {
    const data = await this.select(
      conn,
      tableBusinessType,
      "id,title",
      "is_deleted = ?",
      [0],
      "id",
      "ASC",
      0,
      9999
    );
    return data;
  }
}

module.exports = new BusinessModel();
