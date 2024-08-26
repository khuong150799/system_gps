const { REDIS_KEY_LIST_IMEI_OF_USERS } = require("../constants/redis.constant");
const { initialNameOfTableGps } = require("../constants/setting.constant");
const {
  tableDevice,
  tableVehicle,
  tableUsersDevices,
} = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const { del: delRedis } = require("./redis.model");
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

  //update
  async updateById(conn, body, params) {
    const {
      name,
      service_package_id,
      vehicle_type_id,
      quantity_channel,
      weight,
      warning_speed,
      note,
      is_checked,
      is_transmission_gps,
      is_transmission_image,
    } = body;
    const { id } = params;

    const vehicle = new VehicleSchema({
      name,
      service_package_id,
      vehicle_type_id,
      quantity_channel,
      weight,
      warning_speed,
      note,
      is_checked,
      is_transmission_gps,
      is_transmission_image,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete vehicle.device_id;
    delete vehicle.expired_on;
    delete vehicle.activation_date;
    delete vehicle.warranty_expired_on;
    delete vehicle.is_deleted;
    delete vehicle.created_at;

    await this.update(conn, tableVehicle, vehicle, "id", id);
    vehicle.id = id;
    return vehicle;
  }
}

module.exports = new VehicleModel();
