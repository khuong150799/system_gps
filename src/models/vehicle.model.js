const { initialNameOfTableGps } = require("../constants/setting.constant");
const {
  tableDevice,
  tableVehicle,
  tableUsersDevices,
} = require("../constants/tableName.contant");
const getTableName = require("../ultils/getTableName");
const DatabaseModel = require("./database.model");

class VehicleModel extends DatabaseModel {
  constructor() {
    super();
  }
  async playback(conn, userId, query, params) {
    const { imei } = params;
    const { start_date, end_date, device_id } = query;

    const tableNameStart = getTableName(
      initialNameOfTableGps,
      device_id,
      start_date * 1000
    );
    const tableNameEnd = getTableName(
      initialNameOfTableGps,
      device_id,
      end_date * 1000
    );

    const joinTableGetVehicle = `${tableDevice} INNER JOIN ${tableVehicle} ON ${tableDevice}.id = ${tableVehicle}.device_id 
        INNER JOIN ${tableUsersDevices} ON ${tableDevice}.id = ${tableUsersDevices}.device_id`;

    const handleJoinTable = (
      tableName
    ) => `${tableDevice} INNER JOIN ${tableName} ON ${tableDevice}.imei = ${tableName}.imei 
        INNER JOIN ${tableUsersDevices} ON ${tableDevice}.id = ${tableUsersDevices}.device_id`;

    const joinTableStart = handleJoinTable(tableNameStart);
    const joinTableEnd = handleJoinTable(tableNameEnd);

    const select = `${tableDevice}.imei,license_number,latitude,longitude,speed,signal_quality,rotation,status,acc,syn,time,address`;

    const chooseQuery =
      joinTableStart !== joinTableEnd
        ? this.selectUnion(
            conn,
            [joinTableStart, joinTableEnd],
            select,
            `${tableDevice}.imei = ? AND time BETWEEN ? AND ? AND ${tableDevice}.is_deleted = ? AND ${tableUsersDevices}.user_id = ?`,
            [imei, start_date, end_date, 0, userId],
            `time`,
            "ASC",
            0,
            100000000000
          )
        : this.select(
            conn,
            joinTableStart,
            select,
            `${tableDevice}.imei = ? AND time BETWEEN ? AND ? AND ${tableDevice}.is_deleted = ? AND ${tableUsersDevices}.user_id = ?`,
            [imei, start_date, end_date, 0, userId],
            `time`,
            "ASC",
            0,
            100000000000
          );

    const [route, vehicle] = await Promise.all([
      chooseQuery,
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
