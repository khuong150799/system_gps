const {
  tableCommandConfigurations,
  tableDevice,
  tableUserDevice,
} = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");

class CommandModel extends DatabaseModel {
  constructor() {
    super();
  }

  async getConfigByImei(conn, query, userId) {
    const { imei, type, config_name } = query;
    const limit = query.limit || 10;
    const offset = query.offset || 0;

    const joinTable = `${tableDevice} d INNER JOIN ${tableCommandConfigurations} cmd ON d.id = cmd.device_id 
      INNER JOIN ${tableUserDevice} ud ON d.id = ud.device_id`;
    const select = `d.id,d.imei,cmd.config_name,cmd.value,cmd.created_at,cmd.updated_at`;
    let whereClause =
      "(d.id = ? OR d.imei = ?) AND d.is_deleted = ? AND ud.user_id = ? AND cmd.is_deleted = ?";
    const conditions = [imei, imei, 0, userId, 0];

    if (config_name || type) {
      whereClause += " AND cmd.config_name = ?";
      conditions.push(type || config_name);
    }
    const orderBy = "d.id";
    const res_ = await this.select(
      conn,
      joinTable,
      select,
      whereClause,
      conditions,
      orderBy,
      "DESC",
      offset,
      limit
    );
    return res_;
  }

  async add(conn, device_id, { config_name, value, binary }) {
    let valueInsert = value;
    if (binary) {
      const res = await this.select(
        conn,
        tableCommandConfigurations,
        "value",
        "config_name = ?",
        [config_name]
      );

      const { binaryData } = JSON.parse(res?.[0]?.value || "{}");
      if (!binaryData) {
        valueInsert = { ...value, binaryData: binary };
      } else {
        for (let i = 0; i < 5; i++) {
          binaryData[i] = binary[i] || binaryData[i] || 0;
        }

        valueInsert = { ...value, binaryData };
      }
    }
    // console.log("valueInsert", valueInsert);

    const res_ = await this.insertDuplicate(
      conn,
      tableCommandConfigurations,
      "device_id, config_name, value",
      [[device_id, config_name, JSON.stringify(valueInsert)]],
      `device_id = VALUES(device_id), config_name = VALUES(config_name), value = VALUES(value), updated_at = ${Date.now()}`
    );
    return res_;
  }
}

module.exports = new CommandModel();
