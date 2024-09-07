const { ERROR } = require("../constants/msg.constant");
const {
  REDIS_KEY_LIST_IMEI_OF_USERS,
  REDIS_KEY_LIST_DEVICE,
} = require("../constants/redis.constant");
const { initialNameOfTableGps } = require("../constants/setting.constant");
const {
  tableDevice,
  tableVehicle,
  tableUsersDevices,
  tableDeviceVehicle,
} = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const deviceLoggingModel = require("./deviceLogging.model");
const { del: delRedis, hGet, hSet, hdelOneKey } = require("./redis.model");
const VehicleSchema = require("./schema/vehicle.schema");

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
    // console.log("listUserId", listUserId);
    if (!listUserId?.length) return null;

    await Promise.all([
      listUserId.map((item) => {
        const user_id = dataUserId.length ? item : item.user_id;
        return delRedis(`${REDIS_KEY_LIST_IMEI_OF_USERS}/${user_id}`);
      }),
    ]);
    // console.log("listUserId123456", data);
  }

  async updatePackage(con, body, params) {
    const { device_id, service_package_id } = body;
    const { id } = params;

    await this.update(
      con,
      tableDeviceVehicle,
      { service_package_id },
      "",
      [id, device_id],
      "service_package_id",
      true,
      "vehicle_id = ? AND device_id = ?"
    );

    return [];
  }

  async updateName(con, connPromise, body, params, dataInfo) {
    const { name } = body;
    const { id } = params;

    await connPromise.beginTransaction();

    await this.update(con, tableVehicle, { name }, "id", id);

    const listPromiseGetReidis = dataInfo.map(({ imei }) =>
      hdelOneKey(REDIS_KEY_LIST_DEVICE, imei)
    );

    const listDataGetRedis = await Promise.all(listPromiseGetReidis);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const { result } = listDataGetRedis[i];

      if (!result) {
        isRollback = true;
      }
    }

    if (isRollback) throw { msg: ERROR };

    await connPromise.commit();

    return [];
  }

  //update
  async updateById(conn, connPromise, body, params, userId, dataInfo) {
    const { display_name, vehicle_type_id, weight, warning_speed } = body;
    const { id } = params;

    const vehicle = {
      display_name,
      vehicle_type_id,
      weight,
      warning_speed,
    };
    // console.log(id)

    await connPromise.beginTransaction();

    await this.update(conn, tableVehicle, vehicle, "id", id);

    const listPromiseGetReidis = dataInfo.map(({ imei }) =>
      hdelOneKey(REDIS_KEY_LIST_DEVICE, imei)
    );

    const listDataGetRedis = await Promise.all(listPromiseGetReidis);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const { result } = listDataGetRedis[i];

      if (!result) {
        isRollback = true;
      }
    }

    if (isRollback) throw { msg: ERROR };

    await deviceLoggingModel.postOrDelete(conn, {
      user_id: userId,
      device_id,
      ip: null,
      os: null,
      gps: null,
      des: null,
      action: "Chỉnh",
      createdAt,
    });

    await connPromise.commit();
    vehicle.id = id;
    return vehicle;
  }

  async updateExpiredOn(
    con,
    connPromise,
    body,
    params,
    dataInfo,
    { user_id, ip, os, gps }
  ) {
    const { current_date, extend_date, device_id } = body;
    const { id } = params;

    await connPromise.beginTransaction();

    await this.update(
      con,
      tableDeviceVehicle,
      { expired_on: extend_date },
      "",
      [id, device_id],
      "expired_on",
      true,
      "vehicle_id = ? AND device_id = ?"
    );

    const listPromiseGetReidis = dataInfo.map(({ imei }) =>
      hdelOneKey(REDIS_KEY_LIST_DEVICE, imei)
    );

    const listDataGetRedis = await Promise.all(listPromiseGetReidis);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const { result } = listDataGetRedis[i];

      if (!result) {
        isRollback = true;
      }
    }

    if (isRollback) throw { msg: ERROR };

    await deviceLoggingModel.extendVehicle(con, {
      user_id,
      device_id,
      ip,
      os,
      gps,
      current_date,
      extend_date,
    });

    await connPromise.commit();

    return [];
  }
}

module.exports = new VehicleModel();
