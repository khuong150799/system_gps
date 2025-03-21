const {
  ERROR,
  REMOTE_TURN_OFF_DEVICE_ERROR,
  REMOTE_TURN_ON_DEVICE_ERROR,
  NOT_EXITS,
  NOT_UPDATE_REALTIME,
} = require("../constants/msg.constant");
const {
  REDIS_KEY_LIST_IMEI_OF_USERS,
  REDIS_KEY_LIST_DEVICE,
  REDIS_KEY_LOCK_ACC_WITH_EXTEND,
  REDIS_KEY_DATA_SLEEP_TIME,
  // REDIS_KEY_REALTIME_SOCKET,
} = require("../constants/redis.constant");
const {
  tableDevice,
  tableVehicle,
  tableUsersDevices,
  tableDeviceVehicle,
  tableOrders,
  tableOrdersDevice,
  tableVehicleType,
  tableVehicleIcon,
  tableModel,
  tableDeviceStatus,
  tableUsersCustomers,
  tableCustomers,
  tableUsers,
  tableRenewalCode,
  tableRenewalCodeDevice,
  tableServicePackage,
  tableTransmission,
  tableBusinessType,
} = require("../constants/tableName.constant");
const { date, String2Unit } = require("../utils/time.util");
const { makeCode } = require("../helper/makeCode.helper");
const DatabaseModel = require("./database.model");
const deviceLoggingModel = require("./deviceLogging.model");
const ordersModel = require("./orders.model");
const { del: delRedis, hdelOneKey, hSet: hsetRedis } = require("./redis.model");
const configureEnvironment = require("../config/dotenv.config");
const { fork } = require("child_process");
const deviceApi = require("../api/device.api");
const { UPDATE_TYPE } = require("../constants/global.constant");
const transmissionInfoApi = require("../api/transmissionInfo.api");
const {
  EDIT_ACTION,
  DEL_ACTION,
  LOCK_ACTION,
  UN_LOCK_ACTION,
  GUARANTEE_ACTION,
  AFTER_UPDATE_PACKAGE,
} = require("../constants/action.constant");
// const cacheModel = require("./cache.model");
const {
  is_transmission_gps,
  is_transmission_image,
} = require("../constants/property.constant");

const { SV_NOTIFY } = configureEnvironment();

class VehicleModel extends DatabaseModel {
  constructor() {
    super();
    this.transmission = { is_transmission_gps, is_transmission_image };
    this.valueTransmission = { 0: "Tắt", 1: "Mở" };
  }

  // async getVehicleTransmission(conn, listImei) {
  //   let where = `d.imei IN (?) AND d.is_deleted = ? AND dv.is_deleted = ?`;
  //   let conditions = [listImei, 0, 0];

  //   const joinTable = `${tableDevice} d INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id`;

  //   const select = `dv.device_id,dv.vehicle_id`;

  //   const data = await this.select(
  //     conn,
  //     joinTable,
  //     select,
  //     where,
  //     conditions,
  //     "dv.id",
  //     "ASC",
  //     0,
  //     999999
  //   );

  //   return data;
  // }

  async getTransmission(conn, query, userId) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;

    const {
      keyword,
      model_id,
      start_activation_date,
      end_activation_date,
      is_deleted,
    } = query;

    const isDeleted = is_deleted || 0;
    let where = `d.is_deleted = ? AND m.is_deleted = ? AND dv.is_deleted = ? AND v.is_deleted = ? AND sp.is_deleted = ?`;
    let conditions = [
      userId,
      1,
      isDeleted,
      isDeleted,
      isDeleted,
      isDeleted,
      isDeleted,
      isDeleted,
    ];

    if (keyword) {
      where = `(d.imei LIKE ? OR d.dev_id LIKE ? OR v.name LIKE ?) AND ${where}`;
      conditions.unshift(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (model_id) {
      where = `d.model_id = ? AND ${where}`;
      conditions.unshift(model_id);
    }

    if (start_activation_date && end_activation_date) {
      where = `dv.activation_date BETWEEN ? AND ? AND ${where}`;
      conditions.unshift(start_activation_date, end_activation_date);
    }

    const supQuery = `SELECT device_id
            FROM ${tableUsersDevices} 
            WHERE user_id = ? AND is_main = ? AND is_deleted = ?`;

    const joinTable = `(${supQuery}) ud INNER JOIN ${tableDevice} d ON ud.device_id = d.id
    INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id
    INNER JOIN ${tableVehicle} v ON dv.vehicle_id = v.id
    INNER JOIN ${tableServicePackage} sp ON dv.service_package_id = sp.id
    INNER JOIN ${tableModel} m ON d.model_id = m.id
    LEFT JOIN ${tableTransmission} t ON v.id = t.vehicle_id AND d.id = t.device_id `;

    const select = `d.id as device_id,d.dev_id,d.imei,dv.activation_date,dv.is_req_transmission,dv.is_transmission_gps,dv.is_transmission_image,v.id as vehicle_id,
      v.name as vehicle_name,m.name as model_name,sp.name as service_package_name,t.first_time,t.last_time,t.location,t.quantity,t.time,t.note`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        // `${where} GROUP BY d.id`,
        where,
        conditions,
        "dv.activation_date",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  async getInfoTransmission({ conn, vehicleId, deviceId, isCheck }) {
    const joinTable = `${tableVehicle} v INNER JOIN ${tableDeviceVehicle} dv ON v.id = dv.vehicle_id
    INNER JOIN ${tableDevice} d ON dv.device_id = d.id
    INNER JOIN ${tableUsersDevices} ud ON d.id = ud.device_id
    INNER JOIN ${tableUsersCustomers} uc ON ud.user_id = uc.user_id
    INNER JOIN ${tableCustomers} c ON uc.customer_id = c.id
    INNER JOIN ${tableModel} m ON d.model_id = m.id
    LEFT JOIN ${tableBusinessType} bt ON v.business_type_id = bt.id AND bt.is_deleted = 0`;
    let select = `v.id as vehicle_id,v.name as vehicle_name,v.business_type_id,bt.title as business_type_name,c.tax_code,
    d.imei,d.serial as sim,v.created_at,v.updated_at,v.chassis_number,v.weight`;

    if (isCheck) {
      select +=
        ",m.compliance_device_number,m.compliance_device_type as model_name";
    }

    const where = `v.id = ? AND v.is_deleted = ? AND d.id = ? AND d.is_deleted = ?
       AND ud.device_id = ? AND ud.is_main = ? AND ud.is_deleted = ? AND ud.is_moved = ?
       AND c.is_deleted = ? AND m.is_deleted = ?`;

    const conditions = [vehicleId, 0, deviceId, 0, deviceId, 1, 0, 0, 0, 0];

    const vehicle = await this.select(
      conn,
      joinTable,
      select,
      where,
      conditions,
      "v.id",
      "ASC",
      0,
      1
    );

    return vehicle;
  }

  async getInfoDevice(conn, imei, device_id, user_id) {
    const joinTable = `${tableDevice} d INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id
    INNER JOIN ${tableVehicle} v ON dv.vehicle_id = v.id
    INNER JOIN ${tableVehicleType} vt ON v.vehicle_type_id = vt.id
    INNER JOIN ${tableVehicleIcon} vi ON vt.vehicle_icon_id = vi.id
    INNER JOIN ${tableModel} m ON d.model_id = m.id
    INNER JOIN ${tableDeviceStatus} ds ON d.device_status_id = ds.id
    INNER JOIN ${tableUsersDevices} ud ON d.id = ud.device_id
    INNER JOIN ${tableUsersCustomers} uc1 ON ud.user_id = uc1.user_id
    INNER JOIN ${tableCustomers} c0 ON uc1.customer_id = c0.id
    INNER JOIN ${tableUsers} u ON uc1.user_id = u.id
    INNER JOIN ${tableServicePackage} sp ON dv.service_package_id = sp.id
    LEFT JOIN ${tableUsers} u1 ON u.parent_id = u1.id
    LEFT JOIN ${tableUsersCustomers} uc2 ON u1.id = uc2.user_id
    LEFT JOIN ${tableCustomers} c ON uc2.customer_id = c.id`;

    const select = `
      d.id as device_id,d.imei,dv.expired_on,dv.activation_date,dv.warranty_expired_on,dv.is_use_gps,dv.quantity_channel,dv.quantity_channel_lock,dv.is_lock,dv.is_transmission_gps,dv.is_transmission_image,
      v.display_name,v.name as vehicle_name,v.id as vehicle_id,v.vehicle_type_id,vt.name as vehicle_type_name,vt.vehicle_icon_id,vt.max_speed,
      m.name as model_name,m.model_type_id,ds.title as device_status_name,COALESCE(c0.company,
      c0.name) as customer_name,COALESCE(c.company, c.name) as agency_name,c.phone as agency_phone,vi.name as vehicle_icon_name,
      c0.id as customer_id,c0.tax_code as tax_code,c.id as agency_id,d.sv_cam_id,sp.is_require_transmission`;

    let where = `AND ud.is_moved = 0 AND ud.is_main = 1 AND ud.is_deleted = 0 AND d.is_deleted = 0 AND c0.is_deleted = 0 AND u.is_deleted = 0 AND dv.is_deleted = 0`;
    const condition = [];
    if (device_id) {
      where = `d.id = ? ${where}`;
      condition.push(device_id);
    } else if (imei) {
      where = `d.imei = ? ${where}`;
      condition.push(imei);
    } else if (user_id) {
      where = `ud.user_id = ? ${where}`;
      condition.push(user_id);
    } else {
      where = `1 = ? ${where}`;
      condition.push(1);
    }

    const data = await this.select(
      conn,
      joinTable,
      select,
      where,
      condition,
      `d.id`,
      "ASC",
      0,
      99999
    );

    // console.log("data", data.length);

    if (data.length) {
      await Promise.all(
        data.map((item) =>
          hsetRedis(REDIS_KEY_LIST_DEVICE, item.imei, JSON.stringify(item))
        )
      );
    }
    return data;
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

  async updatePackage(
    conn,
    connPromise,
    body,
    params,
    { user_id, ip, os, gps }
  ) {
    const { device_id, service_package_id } = body;
    const { id } = params;

    const joinTable = `${tableDevice} d INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id
      INNER JOIN ${tableServicePackage} sp ON dv.service_package_id = sp.id`;
    const selectOld = "d.activation_date,dv.expired_on,sp.name";
    const [dataOld, dataPackage] = await Promise.all([
      this.select(
        conn,
        joinTable,
        selectOld,
        "dv.device_id = ? AND dv.vehicle_id = ? AND dv.is_deleted = ?",
        [device_id, id, 0],
        "dv.id"
      ),
      this.select(
        conn,
        tableServicePackage,
        "name,times",
        "id = ?",
        service_package_id
      ),
    ]);

    if (!dataOld?.length)
      throw {
        msg: ERROR,
        errors: [{ msg: `Phương tiện ${NOT_EXITS}`, value: id, params: "id" }],
      };

    if (!dataPackage?.length)
      throw {
        msg: ERROR,
        errors: [
          {
            msg: `Gói dịch vụ ${NOT_EXITS}`,
            value: service_package_id,
            params: "service_package_id",
          },
        ],
      };

    const {
      activation_date,
      expired_on,
      name: sevicePackageNameOld,
    } = dataOld[0];
    const { times: quantityMonth, name: sevicePackageName } = dataPackage[0];

    const activationDate = new Date(activation_date);

    activationDate.setMonth(activationDate.getMonth() + Number(quantityMonth));

    const expiredOn = activationDate.getTime();
    // console.log(Date.now(), Number(activation_date));

    const isUpdateExpiredOn =
      Date.now() - Number(activation_date) <= 5 * 24 * 3600 * 1000;
    await connPromise.beginTransaction();

    if (isUpdateExpiredOn) {
      await this.update(
        conn,
        tableDeviceVehicle,
        { service_package_id, expired_on: expiredOn, updated_at: Date.now() },
        "",
        [device_id, id],
        "service_package_id",
        true,
        "device_id = ? AND vehicle_id = ?"
      );
      await this.update(
        conn,
        tableDevice,
        { expired_on: expiredOn },
        "id",
        device_id
      );

      const result = await this.getInfoDevice(conn, "", device_id);

      if (!result?.length)
        throw {
          msg: ERROR,
          errors: [{ msg: NOT_UPDATE_REALTIME }],
        };
    } else {
      await this.update(
        conn,
        tableDeviceVehicle,
        { service_package_id },
        "",
        [device_id, id],
        "service_package_id",
        true,
        "device_id = ? AND vehicle_id = ?"
      );
    }
    const des = isUpdateExpiredOn
      ? `[Thay đổi gói dịch vụ ${sevicePackageNameOld} ===> ${sevicePackageName}, Ngày hết hạn củ ${date(
          expired_on
        )} ===> Ngày hết hạn mới ${date(expiredOn)}]`
      : `[Thay đổi gói dịch vụ ${sevicePackageNameOld} ===> ${sevicePackageName}]`;

    await deviceLoggingModel.postOrDelete(conn, {
      user_id,
      device_id,
      vehicle_id: id,
      ip,
      os,
      gps,
      des,
      action: AFTER_UPDATE_PACKAGE,
      createdAt: Date.now(),
    });
    await connPromise.commit();
    return [];
  }

  async remote(
    conn,
    connPromise,
    body,
    imei,

    infoUser
  ) {
    const { device_id, state, level } = body;

    await connPromise.beginTransaction();

    const dataLog = {
      ...infoUser,
      device_id,
      des: null,
      action: state == 0 ? "Mở máy" : "Tắt máy",
      createdAt: Date.now(),
    };

    await deviceLoggingModel.postOrDelete(conn, dataLog);

    const { result } = await deviceApi.remote({
      imei,
      state,
      level,
    });
    // console.log("result", result);
    if (!result)
      throw {
        msg:
          state == 1
            ? REMOTE_TURN_OFF_DEVICE_ERROR
            : REMOTE_TURN_ON_DEVICE_ERROR,
      };
    await connPromise.commit();
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

    if (!dataInfo?.length) throw { msg: ERROR };
    await connPromise.beginTransaction();

    await this.update(conn, tableVehicle, { name }, "id", id);
    // console.log("dataInfo", dataInfo);
    const nameOld = dataInfo[0].name;
    const { redis: listPromiseDelRedis, logging: listPromiseLogging } =
      dataInfo.reduce(
        (result, { imei, device_id }) => {
          // console.log("imei", imei);

          result.redis.push(this.getInfoDevice(conn, imei));
          result.logging.push(
            deviceLoggingModel.nameVehicle(conn, {
              user_id,
              device_id,
              vehicle_id: id,
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
      // console.log("result", result);

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback)
      throw {
        msg: ERROR,
        errors: [{ msg: NOT_UPDATE_REALTIME }],
      };
    // throw { msg: ERROR };

    await connPromise.commit();

    return [];
  }

  async updateLock(
    conn,
    connPromise,
    body,
    params,
    dataInfo,
    { user_id, ip, os, gps }
  ) {
    const { device_id, is_lock, des } = body;
    const { id } = params;
    // console.log("dataInfo", dataInfo);

    if (!dataInfo?.length) throw { msg: ERROR };

    await connPromise.beginTransaction();

    await this.update(
      conn,
      tableDeviceVehicle,
      { is_lock },
      "",
      [device_id, id],
      "vehicle_id",
      true,
      "device_id = ? AND vehicle_id = ?"
    );
    // console.log("dataInfo", dataInfo);

    const { redis: listPromiseDelRedis, logging: listPromiseLogging } =
      dataInfo.reduce(
        (result, { imei, device_id }) => {
          // console.log("imei", imei);

          result.redis.push(this.getInfoDevice(conn, imei));
          result.logging.push(
            deviceLoggingModel.lockVehicle(
              conn,
              des ? [des] : [],
              is_lock == 0 ? UN_LOCK_ACTION : LOCK_ACTION,
              {
                user_id,
                device_id,
                vehicle_id: id,
                ip,
                os,
                gps,
              }
            )
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
      // console.log("result", result);

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback)
      throw {
        msg: ERROR,
        errors: [{ msg: NOT_UPDATE_REALTIME }],
      };
    // throw { msg: ERROR };

    await connPromise.commit();

    const { imei, name } = dataInfo[0];

    const joinTable = `${tableDevice} d INNER JOIN ${tableUsersDevices} ud ON d.id = ud.device_id`;

    const dataUsers = await this.select(
      conn,
      joinTable,
      "ud.user_id",
      "d.imei = ? AND d.is_deleted = ? AND ud.is_main = ? AND ud.is_deleted = ?",
      [imei, 0, 1, 0],
      "d.id",
      "ASC",
      0,
      99
    );

    if (SV_NOTIFY) {
      const process = fork(`./src/process/notify.process.js`);
      process.send({
        data: {
          dataUsers,
          keyword: is_lock == 1 ? "1_1_13" : "1_1_14",
          replaces: {
            vehicle_name: name,
          },
          sv: SV_NOTIFY,
        },
      });
    }

    // return dataUsers;

    return [];
  }

  //update
  async updateById(conn, connPromise, body, params, dataInfo) {
    const {
      display_name,
      vehicle_type_id,
      weight,
      warning_speed,
      quantity_channel,
      quantity_channel_lock,
      device_id,
      chassis_number,
      business_type_id,
    } = body;
    const { id } = params;

    const vehicle = {
      display_name,
      vehicle_type_id,
      weight,
      warning_speed,
      chassis_number: chassis_number || null,
      business_type_id: business_type_id || null,
    };
    // console.log(id)

    await connPromise.beginTransaction();

    await this.update(conn, tableVehicle, vehicle, "id", id);

    await this.update(
      conn,
      tableDeviceVehicle,
      {
        quantity_channel,
        quantity_channel_lock,
      },
      "",
      [device_id, id],
      "id",
      true,
      "device_id = ? AND vehicle_id = ?"
    );

    // console.log("dataInfo", dataInfo);

    const listPromiseGetReidis = dataInfo.map(({ imei }) =>
      this.getInfoDevice(conn, imei)
    );

    const listDataGetRedis = await Promise.all(listPromiseGetReidis);

    // console.log("listDataGetRedis", listDataGetRedis);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const result = listDataGetRedis[i];

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback)
      throw {
        msg: ERROR,
        errors: [{ msg: NOT_UPDATE_REALTIME }],
      };

    await connPromise.commit();
    vehicle.id = id;
    return vehicle;
  }

  //updateChnCapture
  async updateChnCapture(
    conn,
    connPromise,
    body,
    params,
    dataInfo,
    { user_id, ip, os, gps }
  ) {
    const { device_id, chn_capture } = body;
    const { id } = params;

    await connPromise.beginTransaction();

    await this.update(
      conn,
      tableDeviceVehicle,
      {
        chn_capture,
      },
      "",
      [device_id, id],
      "id",
      true,
      "device_id = ? AND vehicle_id = ?"
    );

    // console.log("dataInfo", dataInfo);
    const des = `[Thay đổi kênh chụp qua trạm: kênh ${chn_capture}]`;
    await deviceLoggingModel.postOrDelete(conn, {
      user_id,
      device_id,
      vehicle_id: id,
      ip,
      os,
      gps,
      des,
      action: EDIT_ACTION,
      createdAt: Date.now(),
    });

    const listPromiseGetReidis = dataInfo.map(({ imei }) =>
      this.getInfoDevice(conn, imei)
    );

    const listDataGetRedis = await Promise.all(listPromiseGetReidis);

    // console.log("listDataGetRedis", listDataGetRedis);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const result = listDataGetRedis[i];

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback)
      throw {
        msg: ERROR,
        errors: [{ msg: NOT_UPDATE_REALTIME }],
      };

    await connPromise.commit();
    return id;
  }

  async handleUpdate({ conn, dataUpdate, device_id, vehicle_id }) {
    await this.update(
      conn,
      tableDeviceVehicle,
      dataUpdate,
      "",
      [device_id, vehicle_id],
      "id",
      true,
      "device_id = ? AND vehicle_id = ?"
    );
  }

  async handleTransmission({ conn, vehicleId, deviceId, isReq }) {
    const vehicle = await this.getInfoTransmission({
      conn,
      vehicleId,
      deviceId,
      isCheck: true,
    });
    if (!vehicle?.length)
      throw { msg: ERROR, errors: [{ msg: "Vehicle not found" }] };

    const {
      vehicle_name,
      business_type_id,
      tax_code,
      compliance_device_number,
      model_name,
      imei,
      sim,
      created_at,
      updated_at,
      chassis_number,
      weight,
    } = vehicle[0];

    if (!business_type_id || !chassis_number || !tax_code || !weight)
      throw {
        msg: ERROR,
        errors: [
          { msg: "Thông tin tích truyền không đầy đủ, vui lòng kiểm tra lại" },
        ],
      };

    // const driverInfo = await cacheModel.hgetRedis(
    //   REDIS_KEY_REALTIME_SOCKET,
    //   imei
    // );

    // // console.log("driverInfo", driverInfo);
    // const license_number = driverInfo?.license_number;
    // if (!license_number)
    //   throw {
    //     msg: ERROR,
    //     errors: [{ msg: "Vui lòng đăng nhập thông tin tài xế" }],
    //   };

    if (isReq) return null;

    const body = {
      vehicle_name,
      business_type: business_type_id,
      license_number: null,
      tax_code,
      compliance_device_number,
      model: model_name,
      imei,
      sim,
      installation_or_adjustmentDate: updated_at
        ? date(updated_at)
        : date(created_at),
      chassis_number,
      weight: weight ? Math.floor(weight / 1000) : 0,
      time: String2Unit(Date.now()),
      type: UPDATE_TYPE,
    };

    // console.log("body", body);

    await transmissionInfoApi.vehicle(body);
  }

  async updateTransmission(
    conn,
    connPromise,
    body,
    params,
    { user_id, ip, os, gps }
  ) {
    const { property, value, device_id } = body;
    const { id: vehicle_id } = params;
    const dataTranmission = {
      is_transmission_gps: { is_transmission_gps: value },
      is_transmission_image: { is_transmission_image: value },
      is_req_transmission: { is_req_transmission: value },
    };

    const dataUpdate = dataTranmission[property];

    if (!dataUpdate)
      throw { msg: ERROR, errors: [{ msg: "Transmission is not defined" }] };

    await connPromise.beginTransaction();

    await this.handleUpdate({ conn, dataUpdate, device_id, vehicle_id });

    const isReqTransmissoin = property === "is_req_transmission";
    if (value == 1) {
      await this.handleTransmission({
        conn,
        vehicleId: vehicle_id,
        deviceId: device_id,
        isReq: isReqTransmissoin ? true : false,
      });
    }

    const des = isReqTransmissoin
      ? "Yêu cầu tích truyền"
      : `[Trạng thái ${this.transmission[property]} ===> ${this.valueTransmission[value]}]`;

    await deviceLoggingModel.postOrDelete(conn, {
      user_id,
      device_id,
      vehicle_id,
      ip,
      os,
      gps,
      des,
      action: EDIT_ACTION,
      createdAt: Date.now(),
    });

    if (!isReqTransmissoin) {
      const dataSaveRedis = await this.getInfoDevice(conn, null, device_id);

      if (!dataSaveRedis?.length)
        throw {
          msg: ERROR,
          errors: [{ msg: NOT_UPDATE_REALTIME }],
        };
    }

    await connPromise.commit();
    return [];
  }

  async updateExpiredOn(
    conn,
    connPromise,
    dataInfo,
    dataFormat,
    listCode,
    dataCodeFormat,
    dataKeyTimeFormat,
    { user_id, ip, os, gps, action }
  ) {
    await connPromise.beginTransaction();

    const {
      listPromiseDelRedis,
      dataExtendVehicle,
      dataInsertRenewalCodeDevice,
      dataUpdateExpired,
      dataUpdateLock,
      dataUpdateExpiredDevice,
    } = dataInfo.reduce(
      (result, { id, imei, expired_on: current_date, expired_on_device }) => {
        const { vehicle_id, device_id, code, value_time } = dataFormat[id];

        const startExtendDate = new Date(
          Math.max(Date.now(), Number(current_date))
        );

        const startExtendDateDevice = new Date(
          Math.max(Date.now(), Number(expired_on_device))
        );

        const currentMonth = startExtendDate.getMonth();
        const currentMonthDevice = startExtendDateDevice.getMonth();

        const extendDate = startExtendDate.setMonth(
          currentMonth + code.split(";").length * value_time
        );

        const extendDateDevice = startExtendDateDevice.setMonth(
          currentMonthDevice + code.split(";").length * value_time
        );

        const des = [
          `Ngày hết hạn củ của PT: ${date(
            current_date
          )} ===> Ngày hết hạn mới của PT: ${date(extendDate)}`,
          `Ngày hết hạn củ của TB ${imei}: ${date(
            expired_on_device
          )} ===> Ngày hết hạn mới của TB ${imei}: ${date(extendDateDevice)}`,
        ];
        result.dataExtendVehicle.push([
          user_id,
          id,
          vehicle_id,
          ip,
          os,
          JSON.stringify(des),
          action,
          gps,
          0,
          Date.now(),
        ]);

        result.dataInsertRenewalCodeDevice.push(
          ...code
            .split(";")
            .map((item) => [
              user_id,
              dataCodeFormat[item],
              device_id,
              vehicle_id,
              dataKeyTimeFormat[value_time],
              Date.now(),
            ])
        );

        result.dataUpdateExpired.push({
          conditionField: ["vehicle_id", "device_id", "is_deleted"],
          conditionValue: [vehicle_id, device_id, 0],
          updateValue: extendDate,
        });

        result.dataUpdateLock.push({
          conditionField: ["vehicle_id", "device_id", "is_deleted"],
          conditionValue: [vehicle_id, device_id, 0],
          updateValue: 0,
        });

        result.dataUpdateExpiredDevice.push({
          conditionField: ["id", "is_deleted"],
          conditionValue: [device_id, 0],
          updateValue: extendDateDevice,
        });

        result.listPromiseDelRedis.push(() => this.getInfoDevice(conn, imei));

        return result;
      },
      {
        listPromiseDelRedis: [],
        dataExtendVehicle: [],
        dataInsertRenewalCodeDevice: [],
        dataUpdateExpired: [],
        dataUpdateLock: [],
        dataUpdateExpiredDevice: [],
      }
    );

    await this.update(conn, tableRenewalCode, { is_used: 1 }, "code", listCode);

    // console.log("dataInsertRenewalCodeDevice", dataInsertRenewalCodeDevice);

    await this.insertMulti(
      conn,
      tableRenewalCodeDevice,
      `user_id,
      renewal_code_id,
      device_id,
      vehicle_id,
      key_time_id,
      created_at`,
      dataInsertRenewalCodeDevice
    );

    await deviceLoggingModel.extendMutiVehicle(conn, dataExtendVehicle);

    const dataUpdate = [
      {
        field: "expired_on",
        conditions: dataUpdateExpired,
      },
      {
        field: "is_lock",
        conditions: dataUpdateLock,
      },
    ];

    await this.updatMultiRowsWithMultiConditions(
      conn,
      tableDeviceVehicle,
      dataUpdate,
      "",
      "device_id"
    );

    const dataUpdateDevice = [
      {
        field: "expired_on",
        conditions: dataUpdateExpiredDevice,
      },
    ];
    await this.updatMultiRowsWithMultiConditions(
      conn,
      tableDevice,
      dataUpdateDevice
    );

    // console.log("dataInfo", dataInfo);

    const listDataGetRedis = await Promise.all(
      listPromiseDelRedis.map((fn) => fn())
    );

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const result = listDataGetRedis[i];

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback)
      throw {
        msg: ERROR,
        errors: [{ msg: NOT_UPDATE_REALTIME }],
      };

    await hdelOneKey(REDIS_KEY_LOCK_ACC_WITH_EXTEND, user_id.toString());

    await connPromise.commit();

    return [];
  }

  async updateSleepTime(
    conn,
    connPromise,
    dataInfo,
    body,
    params,
    { user_id, ip, os, gps }
  ) {
    await connPromise.beginTransaction();

    const { device_id, minute } = body;
    const { id } = params;

    await this.update(
      conn,
      tableDeviceVehicle,
      { sleep_time: minute },
      "",
      [id, device_id, 0],
      "vehicle_id",
      true,
      "vehicle_id = ? AND device_id = ? AND is_deleted = ?"
    );

    const { imei, sleep_time } = dataInfo[0];

    const des = `Thay đổi thời gian ngủ của thiết bị ${sleep_time} phút ===> ${minute} phút`;

    await deviceLoggingModel.postOrDelete(conn, {
      user_id,
      device_id,
      vehicle_id: id,
      ip,
      os,
      gps,
      des,
      action: EDIT_ACTION,
      createdAt: Date.now(),
    });

    const { result } = await hsetRedis(
      REDIS_KEY_DATA_SLEEP_TIME,
      imei,
      minute.toString()
    );
    if (!result)
      throw {
        msg: ERROR,
        errors: [{ msg: "Không thể cập nhật thời gian ngủ cho thiết bị" }],
      };

    await connPromise.commit();

    return [];
  }

  async recallExtend(
    conn,
    connPromise,
    body,
    dataInfo,
    dataRenewal,

    { user_id, ip, os, gps }
  ) {
    const { vehicle_id: id, device_id } = body;

    await connPromise.beginTransaction();

    const { codeId, valueTime } = dataRenewal;

    // console.log({ codeId, valueTime });

    await this.update(conn, tableRenewalCode, { is_used: 0 }, "id", codeId);

    await this.delete(
      conn,
      tableRenewalCodeDevice,
      "renewal_code_id = ?",
      codeId,
      "",
      false
    );

    const { expired_on, imei, expired_on_device } = dataInfo[0];

    const startExtendDate = new Date(expired_on);

    const startExtendDateDevice = new Date(expired_on_device);

    const currentMonth = startExtendDate.getMonth();

    const currentMonthDevice = startExtendDateDevice.getMonth();

    const extendDate = startExtendDate.setMonth(currentMonth - valueTime);

    const extendDateDevice = startExtendDateDevice.setMonth(
      currentMonthDevice - valueTime
    );

    await this.update(
      conn,
      tableDeviceVehicle,
      `expired_on = ${extendDate}`,
      "",
      [id, device_id, 0],
      "vehicle_id",
      true,
      "vehicle_id = ? AND device_id = ? AND is_deleted = ?"
    );

    await this.update(
      conn,
      tableDevice,
      { expired_on: extendDateDevice },
      "id",
      device_id
    );

    const des = [
      `Ngày hết hạn củ của PT: ${date(
        expired_on
      )} ===> Ngày hết hạn mới của PT: ${date(extendDate)}`,
      `Ngày hết hạn củ của TB: ${date(
        expired_on_device
      )} ===> Ngày hết hạn mới của TB: ${date(extendDateDevice)}`,
    ];

    await deviceLoggingModel.extendMutiVehicle(conn, [
      [
        user_id,
        device_id,
        id,
        ip,
        os,
        JSON.stringify(des),
        "Thu hồi gia hạn",
        gps,
        0,
        Date.now(),
      ],
    ]);

    // console.log("dataInsertRenewalCodeDevice", dataInsertRenewalCodeDevice);

    // console.log("dataInfo", dataInfo);
    const listDataGetRedis = await Promise.all([
      this.getInfoDevice(conn, imei),
    ]);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const result = listDataGetRedis[i];

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback)
      throw {
        msg: ERROR,
        errors: [{ msg: NOT_UPDATE_REALTIME }],
      };

    await connPromise.commit();

    return [];
  }

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
      [id, device_id, 0],
      "vehicle_id",
      true,
      "vehicle_id = ? AND device_id = ? AND is_deleted = ?"
    );

    // await this.update(
    //   conn,
    //   tableDevice,
    //   { activation_date },
    //   "id",
    //   [device_id],
    //   "device_id"
    // );
    // console.log("dataInfo", dataInfo);

    const { redis: listPromiseDelRedis, logging: listPromiseAddDb } =
      dataInfo.reduce(
        (result, { imei, activation_date: ac_date }) => {
          // console.log("result", result);

          const des = `Ngày kích hoạt củ: ${date(
            ac_date
          )} ===> Ngày kích hoạt mới: ${date(activation_date)}`;

          result.redis.push(this.getInfoDevice(conn, imei));
          result.logging.push(
            deviceLoggingModel.extendVehicle(conn, des, {
              user_id,
              device_id,
              vehicle_id: id,
              ip,
              os,
              gps,
              action: EDIT_ACTION,
            })
          );

          return result;
        },
        { redis: [], logging: [] }
      );

    // console.log({ listPromiseDelRedis, listPromiseAddDb });

    await Promise.all(listPromiseAddDb);

    const listDataGetRedis = await Promise.all(listPromiseDelRedis);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const result = listDataGetRedis[i];

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback)
      throw {
        msg: ERROR,
        errors: [{ msg: NOT_UPDATE_REALTIME }],
      };

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
    if (!dataInfo?.length) throw { msg: ERROR };
    await connPromise.beginTransaction();

    // await this.update(
    //   conn,
    //   tableDeviceVehicle,
    //   { warranty_expired_on },
    //   "",
    //   [id, device_id],
    //   "expired_on",
    //   true,
    //   "vehicle_id = ? AND device_id = ?"
    // );

    const { warranty_expired_on, device_id } = body;
    const { id } = params;
    const {
      // warranty_expired_on: warrantyExpiredOnOldVehicle,
      warranty_expired_on_device: warrantyExpiredOnOldDevice,
    } = dataInfo[0];

    // const timeWarrantyExpiredON =
    //   Number(warranty_expired_on) - Number(warrantyExpiredOnOldVehicle);

    await this.update(
      conn,
      tableDeviceVehicle,
      { warranty_expired_on },
      "device_id",
      [device_id],
      "device_id"
    );

    // if (timeWarrantyExpiredON > 0) {
    if (Number(warranty_expired_on) > Number(warrantyExpiredOnOldDevice)) {
      await this.update(
        conn,
        tableDevice,
        {
          // warranty_expired_on:
          //   Number(warrantyExpiredOnOldDevice) + timeWarrantyExpiredON,
          warranty_expired_on,
        },
        "id",
        [device_id],
        "device_id"
      );
    }

    // console.log("dataInfo", dataInfo);

    const { redis: listPromiseDelRedis, logging: listPromiseAddDb } =
      dataInfo.reduce(
        (
          result,
          { imei, warranty_expired_on: wr_date, warranty_expired_on_device }
        ) => {
          // console.log("result", result);

          const des = [
            `Hạn bảo hành củ của PT: ${date(
              wr_date
            )} ===> Hạn bảo hành mới của PT: ${date(warranty_expired_on)}`,
            `Hạn bảo hành củ của TB: ${date(
              warranty_expired_on_device
            )} ===> Hạn bảo hành mới PT: ${date(warranty_expired_on)}`,
          ];

          result.redis.push(this.getInfoDevice(conn, imei));
          result.logging.push(
            deviceLoggingModel.extendVehicle(conn, des, {
              user_id,
              device_id,
              vehicle_id: id,
              ip,
              os,
              gps,
              action: EDIT_ACTION,
            })
          );

          return result;
        },
        { redis: [], logging: [] }
      );

    // console.log({ listPromiseDelRedis, listPromiseAddDb, listPromiseExtend });

    await Promise.all(listPromiseAddDb);

    const listDataGetRedis = await Promise.all(listPromiseDelRedis);

    let isRollback = false;

    for (let i = 0; i < listDataGetRedis.length; i++) {
      const result = listDataGetRedis[i];

      if (!result?.length) {
        isRollback = true;
      }
    }

    if (isRollback)
      throw {
        msg: ERROR,
        errors: [{ msg: NOT_UPDATE_REALTIME }],
      };

    await connPromise.commit();

    return [];
  }

  async deleteById(
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
      vehicle_id: id,
      action: DEL_ACTION,
      des: JSON.stringify([`Xoá phương tiện ${vehicle_name}`]),
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
    {
      device_id,
      vehicle_id,
      expired_on,
      activation_date,
      warranty_expired_on,
      service_package_id,
      type,
      is_use_gps,
      quantity_channel,
      quantity_channel_lock,
      is_transmission_gps,
      is_transmission_image,
      is_deleted,
      created_at,
    },
    // infoDeviceNew,
    {
      imei: imeiNew,
      // activation_date: activationDate,
      warranty_expired_on: warrantyExpiredOn,
      // expired_on: expiredOnNew,
    },
    // infoDeviceOld,
    {
      imei: imeiOld,
      //  expired_on: expiredOnOld
    },
    // { activation_date: activationDate, warranty_expired_on:warrantyExpiredOn },
    listOrdersId,
    infoUser
  ) {
    const { id } = params;
    const { device_id_old, device_id_new } = body;
    const { user_device_id, vehicle_name } = idUd[0];
    await connPromise.beginTransaction();

    // console.log("body", body);

    // console.log({ activationDate, warranty_expired_on });

    if (!warrantyExpiredOn) {
      const createdAt = Date.now();
      const date = new Date(createdAt);
      date.setFullYear(date.getFullYear() + 1);

      await this.update(
        conn,
        tableDevice,
        {
          device_status_id: 3,
          activation_date: createdAt,
          warranty_expired_on: date.getTime(),
          expired_on,
        },
        "",
        [device_id_new],
        "device_id",
        true,
        "id = ?"
      );

      // await this.update(
      //   conn,
      //   tableDevice,
      //   {
      //     device_status_id: 2,
      //      expired_on: null
      //   },
      //   "",
      //   [device_id_old],
      //   "device_id",
      //   true,
      //   "id = ?"
      // );
    } else {
      await this.update(
        conn,
        tableDevice,
        {
          device_status_id: 3,
          expired_on,
        },
        "id",
        [device_id_new],
        "device_id"
      );
    }

    await this.update(
      conn,
      tableDevice,
      {
        device_status_id: 2,
        expired_on: Date.now(),
      },
      "",
      [device_id_old],
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
      false,
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
      [device_id_old, id],
      "vehicle_id",
      true,
      "device_id = ? AND vehicle_id = ?"
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

    const field =
      "device_id,vehicle_id,expired_on,activation_date,warranty_expired_on,service_package_id,type,is_use_gps,quantity_channel,quantity_channel_lock,is_transmission_gps,is_transmission_image,is_deleted,created_at";
    const dataInsert = [
      [
        device_id,
        vehicle_id,
        expired_on,
        activation_date,
        warranty_expired_on,
        service_package_id,
        type,
        is_use_gps,
        quantity_channel,
        quantity_channel_lock,
        is_transmission_gps,
        is_transmission_image,
        is_deleted,
        created_at,
      ],
    ];
    const dataDuplicate = `expired_on=VALUES(expired_on),activation_date=VALUES(activation_date),warranty_expired_on=VALUES(warranty_expired_on),
      service_package_id=VALUES(service_package_id),
      type=VALUES(type),is_use_gps=VALUES(is_use_gps),quantity_channel=VALUES(quantity_channel),
      quantity_channel_lock=VALUES(quantity_channel_lock),is_transmission_gps=VALUES(is_transmission_gps),
      is_transmission_image=VALUES(is_transmission_image),is_deleted=VALUES(is_deleted),created_at=VALUES(created_at)`;
    await this.insertDuplicate(
      conn,
      tableDeviceVehicle,
      field,
      dataInsert,
      dataDuplicate
    );
    // console.log("infoDeviceNew.imei", infoDeviceNew.imei);

    const [{ result: resultOld }, resultNew] = await Promise.all([
      hdelOneKey(REDIS_KEY_LIST_DEVICE, imeiOld),
      this.getInfoDevice(conn, imeiNew),
    ]);
    // console.log({ resultOld, resultNew });

    let isRollback = false;
    if (!resultOld || !resultNew?.length) {
      isRollback = true;
    }
    if (isRollback)
      throw {
        msg: ERROR,
        errors: [{ msg: NOT_UPDATE_REALTIME }],
      };
    const dataLog = {
      ...infoUser,
      device_id: device_id_old,
      vehicle_id: id,
      action: GUARANTEE_ACTION,
      des: JSON.stringify(
        `Bảo hành phương tiện ${vehicle_name}: ${imeiOld} ===> ${imeiNew}`
      ),
      createdAt: Date.now(),
    };

    await deviceLoggingModel.postOrDelete(conn, dataLog);

    await connPromise.commit();
    return [];
  }

  async move(
    conn,
    connPromise,
    body,
    imei,
    vehicle_name,
    userId,
    infoUserMove,
    infoReciver,
    dataRemoveOrders,
    dataAddOrders,
    listDeviceId,
    infoUser
  ) {
    await connPromise.beginTransaction();

    const { id: reciver, username: nameReciver } = infoReciver;
    const { id: userIdMove, username: nameUserMove } = infoUserMove;

    if (dataAddOrders?.length) {
      const dataInsertUserDevice = [];
      const dateNow = Date.now();
      const listReciver = [];
      for (let i = 0; i < dataAddOrders.length; i++) {
        const { id: user_id, customer_id } = dataAddOrders[i];
        for (let i1 = 0; i1 < listDeviceId.length; i1++) {
          const deviceID = listDeviceId[i1];
          dataInsertUserDevice.push([user_id, deviceID, 0, dateNow]);
        }
        listReciver.push(customer_id);
      }
      await ordersModel.registerTree(
        conn,
        connPromise,
        dataAddOrders,
        {
          code: makeCode(),
          devices_id: JSON.stringify(listDeviceId),
          recivers: JSON.stringify(listReciver),
          note: "Đơn hàng chuyển phương tiện",
        },
        userId,
        false
      );
    }

    if (dataRemoveOrders?.length) {
      const { listUserId, listCustomerId } = dataRemoveOrders.reduce(
        (result, { id, customer_id }) => {
          result.listUserId.push(id);
          result.listCustomerId.push(customer_id);
          return result;
        },
        {
          listUserId: [],
          listCustomerId: [],
        }
      );

      await this.update(
        conn,
        tableUsersDevices,
        { is_deleted: 1 },
        "",
        [listUserId, listDeviceId],
        "device_id",
        false,
        `user_id IN (?) AND device_id IN (?)`
      );

      const joinTableOrder = `${tableOrders} o INNER JOIN ${tableOrdersDevice} od ON o.id = od.orders_id`;

      const whereOrders = `(o.creator_customer_id IN (?) OR o.reciver IN (?)) AND od.device_id IN (?)`;
      // console.log("listDeviceId", listDeviceId);

      await this.update(
        conn,
        joinTableOrder,
        `od.is_deleted = 1`,
        "",
        [listCustomerId, listCustomerId, listDeviceId],
        "device_id",
        false,
        whereOrders
      );
    }

    await this.update(
      conn,
      tableUsersDevices,
      { is_moved: 1 },
      "",
      [listDeviceId[0], 0],
      "device_id",
      true,
      "device_id = ? AND is_moved = ?"
    );

    await this.insertDuplicate(
      conn,
      tableUsersDevices,
      "user_id,device_id,is_main,is_deleted,is_moved,created_at",
      [[reciver, listDeviceId[0], 1, 0, 0, Date.now()]],
      `is_main=VALUES(is_main),is_deleted=VALUES(is_deleted),is_moved=VALUES(is_moved),created_at=VALUES(created_at)`
    );

    await this.getInfoDevice(conn, imei);

    const dataLog = {
      ...infoUser,
      device_id: listDeviceId[0],
      vehicle_id: body.vehicle_id,
      action: "Chuyển",
      des: JSON.stringify(
        `Chuyển phương tiện ${vehicle_name}: ${nameUserMove}(${userIdMove}) ===> ${reciver}(${nameReciver})`
      ),
      createdAt: Date.now(),
    };

    await deviceLoggingModel.postOrDelete(conn, dataLog);

    await connPromise.commit();
    return [];
  }
}

module.exports = new VehicleModel();
