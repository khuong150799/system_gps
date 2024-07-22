const { REDIS_KEY_LIST_IMEI_OF_USERS } = require("../constants/redis.contant");
const { initialNameOfTableGps } = require("../constants/setting.constant");
const {
  tableDevice,
  tableVehicle,
  tableUsersDevices,
} = require("../constants/tableName.contant");
const getTableName = require("../ultils/getTableName");
const DatabaseModel = require("./database.model");
const { hSet: hsetRedis, expire: expireRedis } = require("./redis.model");

class VehicleModel extends DatabaseModel {
  constructor() {
    super();
  }
  handleGetListDeviceId = async (
    conn,
    imei,
    userId,
    offset = 0,
    limit = 999999999
  ) => {
    const joinTableDeviceAnUsersDevice = `${tableDevice} INNER JOIN ${tableUsersDevices} ON ${tableDevice}.id = ${tableUsersDevices}.device_id`;

    const where = `${tableDevice}.imei IN (?) AND ${tableDevice}.is_deleted = ? AND ${tableUsersDevices}.user_id = ? AND ${tableDevice}.device_status_id = ?`;

    const conditions = [imei.split(","), 0, userId, 3];

    const [listDeviceId, count] = await Promise.all([
      this.select(
        conn,
        joinTableDeviceAnUsersDevice,
        `${tableDevice}.id`,
        where,
        conditions,
        `${tableDevice}.id`,
        "ASC",
        offset,
        limit
      ),
      this.count(conn, joinTableDeviceAnUsersDevice, "*", where, conditions),
    ]);
    const totalPage = Math.ceil(count?.[0]?.total / limit);
    return { data: listDeviceId, totalPage };
  };

  async removeListDeviceOfUsersRedis(conn, deviceId, dataUserId = []) {
    let listUserId = dataUserId;
    if (!dataUserId.length) {
      listUserId = await this.select(
        conn,
        tableUsersDevices,
        "user_id",
        "device_id = ? AND is_deleted = ?",
        [deviceId, 0],
        "user_id",
        "ASC",
        0,
        99999
      );
    }
    if (!listUserId?.length) return null;

    await Promise.all([
      listUserId.map((item) => {
        const user_id = dataUserId.length ? item : item.user_id;
        return expireRedis(`${REDIS_KEY_LIST_IMEI_OF_USERS}/${user_id}`, -1);
      }),
    ]);
  }
}

module.exports = new VehicleModel();
