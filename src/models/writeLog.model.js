const propertyConstant = require("../constants/property.constant");
const {
  tableWriteLogs,
  tableUsers,
} = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const WriteLogsSchema = require("./schema/writeLogs.schema");

class WriteLogsModel extends DatabaseModel {
  constructor() {
    super();
  }

  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const where = "1 = ?";
    const conditions = [1];
    const select = "u.username,wl.ip,wl.os,wl.des,wl.created_at";
    const joinTable = `${tableWriteLogs} wl INNER JOIN ${tableUsers} u ON wl.user_id = u.id`;
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        "id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "*", where, conditions),
    ]);
    const totalPage = Math.ceil(count?.[0]?.total / limit);
    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  async post(conn, data) {
    const { user_id, module, ip, os, name, des, createdAt } = data;
    const logs = new WriteLogsSchema({
      user_id,
      module,
      ip: ip || null,
      os: os || null,
      des: name ? `Thêm ${name}` : des || null,
      is_deleted: 0,
      created_at: createdAt,
    });
    await this.insert(conn, tableWriteLogs, logs);
  }

  async update(conn, { dataOld, dataNew, user_id, ip, os, module }) {
    console.log("{ dataOld, dataNew, user_id, ip, os, module }", {
      dataOld,
      dataNew,
      user_id,
      ip,
      os,
      module,
    });
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
