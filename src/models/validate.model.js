const { ERROR, NOT_PERMISSION, NOT_ADD_DEVICE } = require("../constants");
const { tableDevice, tableUserDevice } = require("../constants/tableName");
const DatabaseModel = require("./database.model");

class ValidateModel extends DatabaseModel {
  constructor() {
    super();
  }

  async checkOwnerDevice(conn, userId, devices) {
    const where = `${tableUserDevice}.device_id IN (?) AND ${tableUserDevice}.user_id = ? AND ${tableDevice}.device_status_id = ?`;
    const conditions = [devices, userId, 4];
    const joinTable = `${tableDevice} INNER JOIN ${tableUserDevice} ON ${tableDevice}.id = ${tableUserDevice}.device_id`;
    const select = `${tableDevice}.id`;
    const dataDevices = await this.select(
      conn,
      joinTable,
      select,
      where,
      conditions,
      `${tableDevice}.id`,
      "DESC",
      0,
      1000000000
    );
    if (dataDevices.length <= 0)
      throw {
        msg: ERROR,
        errors: [{ value: devices, msg: NOT_ADD_DEVICE, param: "devices" }],
      };

    const dataId = new Set(dataDevices.map((item) => item.id));

    const idNotExit = devices.filter((item) => !dataId.has(item));

    if (idNotExit.length)
      throw {
        msg: ERROR,
        errors: [{ value: idNotExit, msg: NOT_ADD_DEVICE, param: "devices" }],
      };
  }
}

module.exports = new ValidateModel();
