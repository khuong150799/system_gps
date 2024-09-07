const propertyConstant = require("../constants/property.constant");
const {
  tableDeviceLogging,
  tableUsers,
  tableDevice,
  tableVehicle,
} = require("../constants/tableName.constant");
const { date } = require("../ultils/getTime");
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
    let where = "1 = ?";
    const conditions = [1];
    const select =
      "u.username,d.imei,v.name as vehicle_name,dl.ip,dl.os,dl.gps,dl.des,dl.action,dl.created_at";

    if (keyword) {
      where += ` AND (d.imei like ? OR v.name LIKE ?)`;
      conditions.push(`%${query.keyword}%`, `%${query.keyword}%`);
    }

    const joinTable = `${tableDeviceLogging} dl INNER JOIN ${tableUsers} u ON dl.user_id = u.id 
      INNER JOIN ${tableDevice} d ON dl.device_id = d.id 
      LEFT JOIN ${tableVehicle} v ON dl.device_id = v.device_id`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        "dl.id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "*", where, conditions),
    ]);
    const totalPage = Math.ceil(count?.[0]?.total / limit);
    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  async postOrDelete(conn, data) {
    const { user_id, device_id, ip, os, gps, des, action, createdAt } = data;
    const logs = new DeviceLoggingSchema({
      user_id,
      device_id,
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
      action: "Sửa",
      gps,
      is_deleted: 0,
      created_at: Date.now(),
    });
    await this.insert(conn, tableDeviceLogging, logs);
  }

  async extendVehicle(
    conn,
    { user_id, device_id, ip, os, gps, current_date, extend_date }
  ) {
    const des = `Ngày hết hạn củ: ${date(
      current_date
    )} ===> Ngày hết hạn mới: ${date(extend_date)}`;
    const logs = new DeviceLoggingSchema({
      user_id,
      device_id,
      ip: ip || null,
      os: os || null,
      des: JSON.stringify([des]),
      action: "Gia hạn",
      gps,
      is_deleted: 0,
      created_at: Date.now(),
    });
    await this.insert(conn, tableDeviceLogging, logs);
  }
}

module.exports = new DeviceLoggingModel();
