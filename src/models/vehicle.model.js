const {
  tableDeviceGps,
  tableDevice,
  tableVehicle,
  tableUsersDevices,
} = require("../constants/tableName.contant");
const DatabaseModel = require("./database.model");

class VehicleModel extends DatabaseModel {
  constructor() {
    super();
  }
  async playback(conn, userId, query, params) {
    const { imei } = params;
    const { start_date, end_date } = query;

    const joinTableGetVehicle = `${tableDevice} INNER JOIN ${tableVehicle} ON ${tableDevice}.id = ${tableVehicle}.device_id 
        INNER JOIN ${tableUsersDevices} ON ${tableDevice}.id = ${tableUsersDevices}.device_id`;

    const joinTableGetGps = `${tableDevice} INNER JOIN ${tableDeviceGps} ON ${tableDevice}.imei = ${tableDeviceGps}.imei 
        INNER JOIN ${tableUsersDevices} ON ${tableDevice}.id = ${tableUsersDevices}.device_id`;

    const select = `${tableDeviceGps}.imei,license_number,latitude,longitude,speed,signal_quality,rotation,status,acc,time,address`;

    const [route, vehicle] = await Promise.all([
      this.select(
        conn,
        joinTableGetGps,
        select,
        `${tableDeviceGps}.imei = ? AND time BETWEEN ? AND ? AND ${tableDevice}.is_deleted = ? AND ${tableUsersDevices}.user_id = ?`,
        [imei, start_date, end_date, 0, userId],
        `${tableDeviceGps}.time`,
        "ASC",
        0,
        100000000000
      ),
      this.select(
        conn,
        joinTableGetVehicle,
        "name",
        `${tableDevice}.imei = ? AND ${tableDevice}.is_deleted = ?`,
        [imei, 0],
        `${tableDevice}.id`
      ),
    ]);

    return { vehicle_name: vehicle[0]?.name, route };
  }
}

module.exports = new VehicleModel();
