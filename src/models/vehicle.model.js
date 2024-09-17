const { ERROR } = require("../constants/msg.constant");
const {
  REDIS_KEY_LIST_IMEI_OF_USERS,
  REDIS_KEY_LIST_DEVICE,
} = require("../constants/redis.constant");
const {
  tableDevice,
  tableVehicle,
  tableUsersDevices,
  tableDeviceVehicle,
  tableDeviceExtend,
  tableOrders,
  tableOrdersDevice,
} = require("../constants/tableName.constant");
const { date } = require("../ultils/getTime");
const DatabaseModel = require("./database.model");
const deviceModel = require("./device.model");
const deviceLoggingModel = require("./deviceLogging.model");
const { del: delRedis, hdelOneKey } = require("./redis.model");
const DeviceExtendSchema = require("./schema/deviceExtend.schema");

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

  async updateName(
    conn,
    connPromise,
    body,
    params,
    dataInfo,
    { user_id, ip, os, gps }
  ) {
    const { name } = body;
    const { id } = params;

    await connPromise.beginTransaction();

    await this.update(conn, tableVehicle, { name }, "id", id);
    // console.log("dataInfo", dataInfo);
    if (!dataInfo?.length) throw { msg: ERROR };
    const nameOld = dataInfo[0].name;
    const { redis: listPromiseDelRedis, logging: listPromiseLogging } =
      dataInfo.reduce(
        (result, { imei, device_id }) => {
          // console.log("result", result);

          result.redis.push(deviceModel.getInfoDevice(conn, imei));
          result.logging.push(
            deviceLoggingModel.nameVehicle(conn, {
              user_id,
              device_id,
              ip,
              os,
              gps,
              name_old: nameOld,
              name_new: name,
            })
          );

          return result;
        },
        { redis: [], logging: [] }
      );

    const listDataGetRedis = await Promise.all(listPromiseDelRedis);
    await Promise.all(listPromiseLogging);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const result = listDataGetRedis[i];

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback) throw { msg: ERROR };

    await connPromise.commit();

    return [];
  }

  //update
  async updateById(conn, connPromise, body, params, dataInfo) {
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
      deviceModel.getInfoDevice(conn, imei)
    );

    const listDataGetRedis = await Promise.all(listPromiseGetReidis);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const result = listDataGetRedis[i];

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback) throw { msg: ERROR };

    await connPromise.commit();
    vehicle.id = id;
    return vehicle;
  }

  async updateExpiredOn(
    conn,
    connPromise,
    body,
    params,
    dataInfo,
    { user_id, ip, os, gps }
  ) {
    const { extend_date, device_id } = body;
    const { id } = params;

    await connPromise.beginTransaction();

    await this.update(
      conn,
      tableDeviceVehicle,
      { expired_on: extend_date },
      "",
      [id, device_id],
      "expired_on",
      true,
      "vehicle_id = ? AND device_id = ?"
    );
    console.log("dataInfo", dataInfo);

    const {
      redis: listPromiseDelRedis,
      logging: listPromiseAddDb,
      extend: listPromiseExtend,
    } = dataInfo.reduce(
      (result, { imei, expired_on: current_date }) => {
        // console.log("result", result);

        const dataExtend = new DeviceExtendSchema({
          device_id,
          expired_on_old: current_date,
          extend_date,
          is_deleted: 0,
          created_at: Date.now(),
        });
        dataExtend.updated_at;

        const des = `Ngày hết hạn củ: ${date(
          current_date
        )} ===> Ngày hết hạn mới: ${date(extend_date)}`;

        result.redis.push(deviceModel.getInfoDevice(conn, imei));
        result.logging.push(
          deviceLoggingModel.extendVehicle(conn, des, {
            user_id,
            device_id,
            ip,
            os,
            gps,
          })
        );

        result.extend.push(this.insert(conn, tableDeviceExtend, dataExtend));

        return result;
      },
      { redis: [], logging: [], extend: [] }
    );

    console.log({ listPromiseDelRedis, listPromiseAddDb, listPromiseExtend });

    const listDataGetRedis = await Promise.all(listPromiseDelRedis);

    await Promise.all(listPromiseAddDb);

    await Promise.all(listPromiseExtend);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const result = listDataGetRedis[i];

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback) throw { msg: ERROR };

    await connPromise.commit();

    return [];
  }

  //updateActivationDate
  async updateActivationDate(
    conn,
    connPromise,
    body,
    params,
    dataInfo,
    { user_id, ip, os, gps }
  ) {
    const { activation_date, device_id } = body;
    const { id } = params;

    await connPromise.beginTransaction();

    await this.update(
      conn,
      tableDeviceVehicle,
      { activation_date },
      "",
      [id, device_id],
      "expired_on",
      true,
      "vehicle_id = ? AND device_id = ?"
    );
    // console.log("dataInfo", dataInfo);

    const { redis: listPromiseDelRedis, logging: listPromiseAddDb } =
      dataInfo.reduce(
        (result, { imei, activation_date: ac_date }) => {
          // console.log("result", result);

          const des = `Ngày kích hoạt củ: ${date(
            ac_date
          )} ===> Ngày kích hoạt mới: ${date(activation_date)}`;

          result.redis.push(deviceModel.getInfoDevice(conn, imei));
          result.logging.push(
            deviceLoggingModel.extendVehicle(conn, des, {
              user_id,
              device_id,
              ip,
              os,
              gps,
            })
          );

          return result;
        },
        { redis: [], logging: [] }
      );

    console.log({ listPromiseDelRedis, listPromiseAddDb });

    const listDataGetRedis = await Promise.all(listPromiseDelRedis);

    await Promise.all(listPromiseAddDb);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const result = listDataGetRedis[i];

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback) throw { msg: ERROR };

    await connPromise.commit();

    return [];
  }

  //updateWarrantyExpiredOn
  async updateWarrantyExpiredOn(
    conn,
    connPromise,
    body,
    params,
    dataInfo,
    { user_id, ip, os, gps }
  ) {
    const { warranty_expired_on, device_id } = body;
    const { id } = params;

    await connPromise.beginTransaction();

    await this.update(
      conn,
      tableDeviceVehicle,
      { warranty_expired_on },
      "",
      [id, device_id],
      "expired_on",
      true,
      "vehicle_id = ? AND device_id = ?"
    );
    // console.log("dataInfo", dataInfo);

    const { redis: listPromiseDelRedis, logging: listPromiseAddDb } =
      dataInfo.reduce(
        (result, { imei, warranty_expired_on: wr_date }) => {
          // console.log("result", result);

          const des = `Hạn bảo hành củ: ${date(
            wr_date
          )} ===> Hạn bảo hành mới: ${date(warranty_expired_on)}`;

          result.redis.push(deviceModel.getInfoDevice(conn, imei));
          result.logging.push(
            deviceLoggingModel.extendVehicle(conn, des, {
              user_id,
              device_id,
              ip,
              os,
              gps,
            })
          );

          return result;
        },
        { redis: [], logging: [] }
      );

    // console.log({ listPromiseDelRedis, listPromiseAddDb, listPromiseExtend });

    const listDataGetRedis = await Promise.all(listPromiseDelRedis);

    await Promise.all(listPromiseAddDb);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const result = listDataGetRedis[i];

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback) throw { msg: ERROR };

    await connPromise.commit();

    return [];
  }

  async delete(
    conn,
    connPromise,
    params,
    query,
    quantityDevice,
    inforOrder,
    listOrdersId,
    idUd,
    infoUser
  ) {
    const { id } = params;
    const { device_id } = query;
    const { user_device_id, vehicle_name } = idUd[0];
    await connPromise.beginTransaction();

    await this.update(
      conn,
      tableDevice,
      { device_status_id: 2 },
      "",
      [device_id],
      "device_id",
      true,
      "id = ?"
    );

    await this.update(
      conn,
      tableUsersDevices,
      { is_deleted: 1 },
      "",
      [user_device_id, device_id],
      "device_id",
      true,
      `id > ? AND device_id = ?`
    );

    await this.update(
      conn,
      tableUsersDevices,
      { is_moved: 0 },
      "",
      [user_device_id],
      "device_id",
      true,
      "id = ?"
    );

    if (Number(quantityDevice) < 2) {
      const joinTableVehicle = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id`;

      await this.update(
        conn,
        joinTableVehicle,
        `v.is_deleted = 1,dv.is_deleted = 1`,
        "",
        [id],
        "vehicle_id",
        true,
        "v.id = ?"
      );
    } else {
      await this.update(
        conn,
        `${tableDeviceVehicle} dv`,
        `dv.is_deleted = 1`,
        "",
        [device_id],
        "device_id",
        true,
        "dv.device_id = ?"
      );
    }

    if (inforOrder?.length) {
      const { od_id } = inforOrder[0];
      if (listOrdersId?.length) {
        const quantity = 1;
        await this.update(
          conn,
          tableOrders,
          `quantity = quantity - ${quantity}`,
          "",
          [listOrdersId],
          "device_id",
          true,
          `id IN (?)`
        );
      }

      await this.update(
        conn,
        tableOrdersDevice,
        { is_deleted: 1 },
        "",
        [od_id, device_id],
        "device_id",
        true,
        `id >= ? AND device_id = ?`
      );
    }

    const dataLog = {
      ...infoUser,
      device_id,
      action: "Xoá",
      des: `Xoá phương tiện ${vehicle_name}`,
      createdAt: Date.now(),
    };

    await deviceLoggingModel.postOrDelete(conn, dataLog);

    await connPromise.commit();
    return [];
  }

  //guarantee
  async guarantee(
    conn,
    connPromise,
    params,
    body,
    idUd,
    inforOrder,
    infoVehicleInsert,
    infoDeviceNew,
    infoDeviceOld,
    listOrdersId,
    infoUser
  ) {
    const { id } = params;
    const { device_id_old, device_id_new } = body;
    const { user_device_id, vehicle_name } = idUd[0];
    await connPromise.beginTransaction();

    await this.update(
      conn,
      tableDevice,
      { device_status_id: 2 },
      "",
      [device_id_old],
      "device_id",
      true,
      "id = ?"
    );

    await this.update(
      conn,
      tableDevice,
      { device_status_id: 3 },
      "",
      [device_id_new],
      "device_id",
      true,
      "id = ?"
    );

    await this.update(
      conn,
      tableUsersDevices,
      { is_deleted: 1 },
      "",
      [user_device_id, device_id_old],
      "device_id",
      true,
      `id > ? AND device_id = ?`
    );

    await this.update(
      conn,
      tableUsersDevices,
      { is_moved: 0 },
      "",
      [user_device_id],
      "device_id",
      true,
      "id = ?"
    );

    await this.update(
      conn,
      tableDeviceVehicle,
      `is_deleted = 1`,
      "",
      [id],
      "vehicle_id",
      true,
      "vehicle_id = ?"
    );

    if (inforOrder?.length) {
      const { od_id } = inforOrder[0];
      if (listOrdersId?.length) {
        const quantity = 1;
        await this.update(
          conn,
          tableOrders,
          `quantity = quantity - ${quantity}`,
          "",
          [listOrdersId],
          "device_id",
          true,
          `id IN (?)`
        );
      }

      await this.update(
        conn,
        tableOrdersDevice,
        { is_deleted: 1 },
        "",
        [od_id, device_id_old],
        "device_id",
        true,
        `id >= ? AND device_id = ?`
      );
    }

    await this.insert(conn, tableDeviceVehicle, infoVehicleInsert);

    const [{ result: resultOld }, resultNew] = await Promise.all([
      hdelOneKey(REDIS_KEY_LIST_DEVICE, infoDeviceOld.imei),
      deviceModel.getInfoDevice(conn, infoDeviceNew.imei),
    ]);
    let isRollback = false;
    if (!resultOld || !resultNew?.length) {
      isRollback = true;
    }
    if (isRollback) throw { msg: ERROR };
    const dataLog = {
      ...infoUser,
      device_id: device_id_old,
      action: "Sửa",
      des: `Bảo hành phương tiện ${vehicle_name}: ${infoDeviceOld.imei} ===> ${infoDeviceNew.imei}`,
      createdAt: Date.now(),
    };

    await deviceLoggingModel.postOrDelete(conn, dataLog);

    await connPromise.commit();
    return [];
  }
}

module.exports = new VehicleModel();
