const propertyConstant = require("../constants/property.constant");
const { tableWriteLogs } = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const WriteLogsSchema = require("./schema/writeLogs.schema");

class WriteLogsModel extends DatabaseModel {
  constructor() {
    super();
  }
  async post(conn, data) {
    const { user_id, module, ip, os, name, createdAt } = data;
    const logs = new WriteLogsSchema({
      user_id,
      module,
      ip: ip || null,
      os: os || null,
      des: `Thêm ${name}`,
      is_deleted: 0,
      created_at: createdAt,
    });
    await this.insert(conn, tableWriteLogs, logs);
  }

  async update(conn, { dataOld, dataNew, user_id, ip, os, module }) {
    const arrChange = [];
    for (const key in dataOld) {
      if (dataOld[key] != dataNew[key]) {
        arrChange.push(
          `Thay đổi ${propertyConstant[key]}: ${dataOld[key]} ==> ${dataNew[key]}`
        );
      }
    }
    if (!arrChange.length) return null;
    const logs = new WriteLogsSchema({
      user_id,
      module,
      ip: ip || null,
      os: os || null,
      des: JSON.stringify(arrChange),
      is_deleted: 0,
      created_at: Date.now(),
    });

    await this.insert(conn, tableWriteLogs, logs);
  }

  async delete(conn, data) {
    await this.insert(conn, tableWriteLogs, data);
  }
}

module.exports = new WriteLogsModel();
