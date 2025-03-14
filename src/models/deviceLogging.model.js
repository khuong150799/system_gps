const { EDIT_ACTION, LOCK_ACTION } = require("../constants/action.constant");
const propertyConstant = require("../constants/property.constant");
const {
  tableDeviceLogging,
  tableUsers,
  tableDevice,
  tableVehicle,
  tableUsersCustomers,
  tableCustomers,
} = require("../constants/tableName.constant");
const handleCreateJoinTable = require("../helper/createJoinTable.helper");
const DatabaseModel = require("./database.model");
const DeviceLoggingSchema = require("./schema/deviceLogging.schema");

class DeviceLoggingModel extends DatabaseModel {
  constructor() {
    super();
  }

  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const { keyword } = query;

    const joinTable = handleCreateJoinTable(`${tableDeviceLogging} dl`, [
      {
        table: `${tableDevice} d`,
        on: `d.id = dl.device_id`,
        type: "INNER",
      },
      {
        table: `${tableUsers} u`,
        on: `u.id = dl.user_id`,
        type: "INNER",
      },
      {
        table: `${tableUsersCustomers} uc`,
        on: `dl.user_id = uc.user_id`,
        type: "INNER",
      },
      {
        table: `${tableCustomers} c`,
        on: `c.id = uc.customer_id`,
        type: "INNER",
      },
      {
        table: `${tableVehicle} v`,
        on: `dl.vehicle_id = v.id`,
        type: "LEFT",
      },
    ]);
    let whereClause = `d.imei LIKE ? OR v.name LIKE ? OR dl.des LIKE ?`;
    const conditions = [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`];

    const select = `d.dev_id, d.imei, dl.des, dl.action, u.username, COALESCE(c.name, c.company) AS name, v.name as vehicle_name`;
    const res_ = await this.select(
      conn,
      joinTable,
      select,
      whereClause,
      conditions,
      `d.id`,
      "DESC",
      offset,
      limit
    );

    return { data: res_, totalPage: 0, totalRecord: res_?.length };
  }

  async postOrDelete(conn, data) {
    const {
      user_id,
      device_id,
      vehicle_id,
      ip,
      os,
      gps,
      des,
      action,
      createdAt,
    } = data;
    const logs = new DeviceLoggingSchema({
      user_id,
      device_id,
      vehicle_id,
      ip: ip || null,
      os: os || null,
      des: des || "[]",
      action,
      gps,
      is_deleted: 0,
      created_at: createdAt,
    });
    await this.insert(conn, tableDeviceLogging, logs);
  }

  async postMulti(conn, data) {
    await this.insertMulti(
      conn,
      tableDeviceLogging,
      "user_id,ip,os,gps,device_id,action,des,is_deleted,created_at",
      data
    );
  }

  async update(
    conn,
    {
      dataModel = [],
      dataStatus = [],
      dataOld,
      dataNew,
      user_id,
      ip,
      os,
      gps,
      device_id,
    }
  ) {
    // console.log("{ dataOld, dataNew, user_id, ip, os, module }", {
    //   dataOld,
    //   dataNew,
    //   user_id,
    //   ip,
    //   os,
    // });
    // console.log({ dataModel, dataStatus });
    const dataModelFormat = dataModel.reduce((result, item) => {
      result = { ...result, [item.id]: item.name };
      return result;
    }, {});

    const dataStatusFormat = dataStatus.reduce((result, item) => {
      result = { ...result, [item.id]: item.title };
      return result;
    }, {});

    // console.log({ dataModelFormat, dataStatusFormat, dataOld });

    const arrChange = [];
    for (const key in dataOld) {
      if (dataOld[key] != dataNew[key]) {
        if (key === "model_id") {
          arrChange.push(
            `Thay đổi ${propertyConstant[key]}: ${
              dataModelFormat[dataOld[key]]
            } ==> ${dataModelFormat[dataNew[key]]}`
          );
        } else if (key === "device_status_id") {
          arrChange.push(
            `Thay đổi ${propertyConstant[key]}: ${
              dataStatusFormat[dataOld[key]]
            } ==> ${dataStatusFormat[dataNew[key]]}`
          );
        } else {
          arrChange.push(
            `Thay đổi ${propertyConstant[key]}: ${dataOld[key]} ==> ${dataNew[key]}`
          );
        }
      }
    }
    if (!arrChange.length) return null;
    const logs = new DeviceLoggingSchema({
      user_id,
      device_id,
      ip: ip || null,
      os: os || null,
      des: JSON.stringify(arrChange),
      action: EDIT_ACTION,
      gps,
      is_deleted: 0,
      created_at: Date.now(),
    });
    await this.insert(conn, tableDeviceLogging, logs);
  }

  async extendVehicle(
    conn,
    des,
    { user_id, device_id, vehicle_id, ip, os, gps, action }
  ) {
    const logs = new DeviceLoggingSchema({
      user_id,
      device_id,
      vehicle_id,
      ip: ip || null,
      os: os || null,
      des: JSON.stringify(Array.isArray(des) ? des : [des]),
      action,
      gps,
      is_deleted: 0,
      created_at: Date.now(),
    });
    await this.insert(conn, tableDeviceLogging, logs);
  }

  async extendMutiVehicle(conn, logs) {
    await this.insertMulti(
      conn,
      tableDeviceLogging,
      `user_id,
      device_id,
      vehicle_id,
      ip,
      os,
      des,
      action,
      gps,
      is_deleted,
      created_at`,
      logs
    );
  }

  async lockVehicle(
    conn,
    des,
    action = LOCK_ACTION,
    { user_id, device_id, vehicle_id, ip, os, gps }
  ) {
    const logs = new DeviceLoggingSchema({
      user_id,
      device_id,
      vehicle_id,
      ip: ip || null,
      os: os || null,
      des: JSON.stringify(des),
      action,
      gps,
      is_deleted: 0,
      created_at: Date.now(),
    });
    await this.insert(conn, tableDeviceLogging, logs);
  }

  async nameVehicle(
    conn,
    { user_id, device_id, vehicle_id, ip, os, gps, name_old, name_new }
  ) {
    const des = `BS củ: ${name_old} ===> BS mới: ${name_new}`;
    const logs = new DeviceLoggingSchema({
      user_id,
      device_id,
      vehicle_id,
      ip: ip || null,
      os: os || null,
      des: JSON.stringify([des]),
      action: EDIT_ACTION,
      gps,
      is_deleted: 0,
      created_at: Date.now(),
    });
    await this.insert(conn, tableDeviceLogging, logs);
  }

  async servicePackageVehicle(
    conn,
    { user_id, device_id, ip, os, gps, package_old, package_new }
  ) {
    const des = `Gói dịch vụ củ: ${package_old} ===> Gói dịch vụ mới: ${package_new}`;
    const logs = new DeviceLoggingSchema({
      user_id,
      device_id,
      ip: ip || null,
      os: os || null,
      des: JSON.stringify([des]),
      action: EDIT_ACTION,
      gps,
      is_deleted: 0,
      created_at: Date.now(),
    });
    await this.insert(conn, tableDeviceLogging, logs);
  }
}

module.exports = new DeviceLoggingModel();
