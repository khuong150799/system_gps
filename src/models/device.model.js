const DatabaseModel = require("./database.model");
const DeviceSchema = require("./schema/device.schema");
const {
  NOT_EXITS,
  IS_ACTIVED,
  DEVICE_CANNOT_ACTIVATE,
  ERROR,
  NOT_OWN,
} = require("../constants/msg.constant");
const VehicleSchema = require("./schema/vehicle.schema");
const {
  tableDevice,
  tableOrders,
  tableCustomers,
  tableUsersDevices,
  tableUsersCustomers,
  tableOrdersDevice,
  tableFirmware,
  tableModel,
  tableLevel,
  tableVehicle,
  tableServicePackage,
  tableDeviceStatus,
  tableUsers,
  tableVehicleType,
  tableVehicleIcon,
  tableDeviceVehicle,
  tableModelType,
  tableServerCamera,
} = require("../constants/tableName.constant");
const {
  hSet: hsetRedis,
  expire: expireRedis,
  del: delRedis,
} = require("./redis.model");
const {
  REDIS_KEY_LIST_DEVICE,
  REDIS_KEY_DEVICE_SPAM,
} = require("../constants/redis.constant");
const getTableName = require("../ultils/getTableName");
const {
  initialNameOfTableGps,
  initialNameOfTableSpeed,
  initialNameOfTableReportOneDay,
  initialNameOfTableRunning,
  initialNameOfTableReportRegion,
} = require("../constants/setting.constant");
const usersModel = require("./users.model");
const { makeCode } = require("../ultils/makeCode");
const vehicleModel = require("./vehicle.model");
const deviceLoggingModel = require("./deviceLogging.model");
const DeviceVehicleSchema = require("./schema/deviceVehicle.schema");
const cameraApi = require("../api/camera.api");
const configureEnvironment = require("../config/dotenv.config");
const { SV_CMS1, SV_CMS2 } = configureEnvironment();

class DeviceModel extends DatabaseModel {
  constructor() {
    super();
  }
  async activationCms(conn, svCamId, vehicle, imei, quantity_channel) {
    const dataServerCam = await this.select(
      conn,
      tableServerCamera,
      "host,port",
      "id = ?",
      svCamId
    );
    // console.log("dataServerCam", dataServerCam);

    if (!dataServerCam?.length)
      throw {
        msg: ERROR,
      };

    const { host, port } = dataServerCam[0];

    const dataAddDeviceCms = {
      devIdno: imei,
      chnCount: quantity_channel,
    };

    const dataAddVehicleCms = {
      vehiIdno: vehicle,
      devIdno: imei,
    };

    let resCms = {};

    const { result: resAddDevice } = await cameraApi.addDeviceCMS1({
      ...dataAddDeviceCms,
      url: `${host}:${port}`,
    });
    // console.log("resAddDevice", resAddDevice);

    if (resAddDevice != 0)
      throw {
        msg: ERROR,
      };

    resCms = await cameraApi.addVehicleCMS1({
      ...dataAddVehicleCms,
      url: `${host}:${port}`,
    });

    // if (SV_CMS1.includes(hostCmc)) {
    //   const { result: resAdđevice } = await cameraApi.addDeviceCMS1(
    //     dataAddDeviceCms
    //   );

    //   if (resAdđevice != 0)
    //     throw {
    //       msg: ERROR,
    //     };

    //   resCms = await cameraApi.addVehicleCMS1(dataAddVehicleCms);
    // } else if (SV_CMS2.includes(hostCmc)) {
    //   const { result: resAdđevice } = await cameraApi.addDeviceCMS2(
    //     dataAddDeviceCms
    //   );
    //   console.log("resAdđevice", resAdđevice);
    //   if (resAdđevice != 0)
    //     throw {
    //       msg: ERROR,
    //     };

    //   resCms = await cameraApi.addVehicleCMS2(dataAddVehicleCms);
    // }
    console.log("resCms", resCms, {
      ...dataAddVehicleCms,
      url: `${host}:${port}`,
    });

    const { result: resultCms } = resCms;
    if (resultCms != 0)
      throw {
        msg: ERROR,
      };
  }

  async validateCheckOutside(conn, imei) {
    let errors = {};
    const where = `d.imei = ? AND d.is_deleted = ? AND ud.is_moved = ?`;
    const conditions = [imei, 0, 0];
    const select = `d.id,d.device_status_id,ud.user_id,m.model_type_id as type`;
    const joinTable = `${tableDevice} d INNER JOIN ${tableUsersDevices} ud ON d.id = ud.device_id 
      INNER JOIN ${tableModel} m ON d.model_id = m.id`;

    const res = await this.select(
      conn,
      joinTable,
      select,
      where,
      conditions,
      `d.id`
    );

    if (!res || res?.length <= 0) {
      errors = { msg: `Thiết bị ${NOT_EXITS} hoặc ${NOT_OWN}` };
    } else if (res[0].device_status_id === 4) {
      errors = { msg: `Thiết bị ${IS_ACTIVED}` };
    } else if (res[0].device_status_id === 3) {
      errors = { msg: DEVICE_CANNOT_ACTIVATE };
    }

    if (Object.keys(errors).length) {
      return { result: false, errors };
    }

    return { result: true, data: res[0] };
  }

  async validateCheckInside(conn, imei, userId, parentId) {
    // console.log({ imei, userId, parentId });
    let errors = {};
    const where = `d.imei = ? AND d.is_deleted = ? AND ud.is_moved = ?`;
    const conditions = [imei, 0, 0];
    const joinTable = `${tableDevice} d INNER JOIN ${tableUsersDevices} ud ON d.id = ud.device_id 
      INNER JOIN ${tableModel} m ON d.model_id = m.id`;
    const select = `d.id,d.device_status_id,ud.user_id,m.model_type_id as type`;

    const [res, infoUser] = await Promise.all([
      this.select(conn, joinTable, select, where, conditions, `d.id`),
      this.select(conn, tableUsers, "parent_id", "id = ?", userId),
    ]);
    // console.log({ res });
    if (
      !res ||
      res?.length <= 0 ||
      (res[0].user_id !== userId &&
        res[0].user_id !== parentId &&
        res[0].user_id !== infoUser[0].parent_id) // trường hợp dùng cho khi truyền lên là user id con
    ) {
      errors = { msg: `Thiết bị ${NOT_EXITS} hoặc ${NOT_OWN}` };
    } else if (res[0].device_status_id === 4) {
      errors = { msg: `Thiết bị ${IS_ACTIVED}` };
    } else if (res[0].device_status_id === 3) {
      errors = { msg: DEVICE_CANNOT_ACTIVATE };
    }

    if (Object.keys(errors).length) {
      return { result: false, errors };
    }

    return { result: true, data: res[0] };
  }

  async getInfoDevice(conn, imei, device_id) {
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
    LEFT JOIN ${tableUsers} u1 ON u.parent_id = u1.id
    LEFT JOIN ${tableUsersCustomers} uc2 ON u1.id = uc2.user_id
    LEFT JOIN ${tableCustomers} c ON uc2.customer_id = c.id`;

    const select = `
      d.id as device_id,d.imei,dv.expired_on,dv.activation_date,dv.warranty_expired_on,dv.is_use_gps,dv.quantity_channel,dv.quantity_channel_lock,dv.is_transmission_gps,dv.is_transmission_image,
      v.display_name,v.name as vehicle_name,v.id as vehicle_id,v.vehicle_type_id,vt.name as vehicle_type_name,vt.vehicle_icon_id,vt.max_speed,
      m.name as model_name,m.model_type_id,ds.title as device_status_name,COALESCE(c0.company,
      c0.name) as customer_name,COALESCE(c.company, c.name) as agency_name,c.phone as agency_phone,vi.name as vehicle_icon_name,
      c0.id as customer_id,c.id as agency_id,d.sv_cam_id`;

    let where = `AND ud.is_moved = 0 AND d.is_deleted = 0 AND c0.is_deleted = 0 AND u.is_deleted = 0`;
    const condition = [];
    if (device_id) {
      where = `d.id = ? ${where}`;
      condition.push(device_id);
    } else if (imei) {
      where = `d.imei = ? ${where}`;
      condition.push(imei);
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
      `d.id`
    );
    if (data.length) {
      await Promise.all(
        data.map((item) =>
          hsetRedis(REDIS_KEY_LIST_DEVICE, item.imei, JSON.stringify(item))
        )
      );
    }
    return data;
  }

  // async getInfoDevice(conn, device_id, vehicle_id, imei_link) {
  //   const joinTable = `${tableDevice} d INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id
  //    INNER JOIN ${tableVehicle} v ON dv.vehicle_id = v.id
  //   INNER JOIN ${tableVehicleType} vt ON v.vehicle_type_id = vt.id
  //   INNER JOIN ${tableVehicleIcon} vi ON vt.vehicle_icon_id = vi.id
  //   INNER JOIN ${tableModel} m ON d.model_id = m.id
  //   INNER JOIN ${tableDeviceStatus} ds ON d.device_status_id = ds.id
  //   INNER JOIN ${tableUsersDevices} ud ON d.id = ud.device_id
  //   INNER JOIN ${tableUsersCustomers} uc1 ON ud.user_id = uc1.user_id
  //   INNER JOIN ${tableCustomers} c0 ON uc1.customer_id = c0.id
  //   INNER JOIN ${tableUsers} u ON uc1.user_id = u.id
  //   LEFT JOIN ${tableUsers} u1 ON u.parent_id = u1.id AND u1.is_deleted = 0
  //   LEFT JOIN ${tableUsersCustomers} uc2 ON u1.id = uc2.user_id
  //   LEFT JOIN ${tableCustomers} c ON uc2.customer_id = c.id AND c.is_deleted = 0`;

  //   const select = `JSON_ARRAYAGG(JSON_OBJECT('device_id', d.id,'imei', d.imei,'expired_on':dv.expired_on,'activation_date',dv.activation_date,
  //     'warranty_expired_on':dv.warranty_expired_on,'display_name':v.display_name,'vehicle_name':v.name,'model_type':m.model_type_id,
  //     'device_status_name':ds.title,'model_name':m.name,'is_use_gps':dv.is_use_gps)) AS devices,
  //     v.vehicle_type_id,vt.name as vehicle_type_name,vt.vehicle_icon_id,vt.max_speed,COALESCE(MAX(c0.company),MAX(c0.name)) as customer_name,
  //     COALESCE(MAX(c.company), MAX(c.name)) as agency_name,MAX(c.phone) as agency_phone,vi.name as vehicle_icon_name,
  //     MAX(c0.id) as customer_id,MAX(c.id) as agency_id`;

  //   let where = `AND ud.is_moved = 0 AND d.is_deleted = 0 AND c0.is_deleted = 0 AND u.is_deleted = 0`;
  //   const condition = [];
  //   if (device_id) {
  //     where = `d.id = ? ${where}`;
  //     condition.push(device_id);
  //   } else if (vehicle_id) {
  //     where = `v.id = ? ${where}`;
  //     condition.push(vehicle_id);
  //   } else {
  //     where = `1 = ? ${where}`;
  //     condition.push(1);
  //   }

  //   const data = await this.select(
  //     conn,
  //     joinTable,
  //     select,
  //     `${where} GROUP BY v.id`,
  //     condition,
  //     `d.id`
  //   );
  //   if (data.length) {
  //     const listPromise = data.reduce((result, item) => {
  //       if (devices?.length === 1) {
  //         const { is_use_gps: isUseGps, imei } = devices[0];
  //         if (isUseGps == 1) {
  //           result.push(
  //             hsetRedis(REDIS_KEY_LIST_DEVICE, imei, JSON.stringify(item))
  //           );
  //         }
  //       } else if (devices?.length > 1) {
  //         const {
  //           model_type: modelType1,
  //           is_use_gps: isUseGps1,
  //           imei: imei1,
  //         } = devices[0];
  //         const {
  //           model_type: modelType2,
  //           is_use_gps: isUseGps2,
  //           imei: imei2,
  //         } = devices[1];
  //         if (modelType1 == 1) {
  //           result.push(
  //             hsetRedis(REDIS_KEY_LIST_DEVICE, imei, JSON.stringify(item))
  //           );
  //         } else if (modelType2 == 1) {
  //           return hsetRedis(
  //             REDIS_KEY_LIST_DEVICE,
  //             imei2,
  //             JSON.stringify(item)
  //           );
  //         }
  //       }
  //       return result;
  //     }, []);

  //     await Promise.all(listPromise);
  //   }
  //   return data;
  // }

  //getallrow
  async getallrows(conn, query, customerId) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;

    const {
      type, //1 : vehicle, 2:thiết bị chưa kích hoạt dành cho đơn hàng
      is_deleted,
      keyword,
      customer_id,
      model_id,
      start_warranty_expired_on,
      end_warranty_expired_on,
      start_expired_on,
      end_expired_on,
      start_activation_date,
      end_activation_date,
      actived,
    } = query;

    const isDeleted = is_deleted || 0;
    let where = `d.is_deleted = ? AND c.id = ? AND ud.is_main = ?`;
    const customer = customer_id || customerId;
    let conditions = [isDeleted, customer, 1];

    if (keyword) {
      where += ` AND (d.dev_id LIKE ? OR d.imei LIKE ? OR o.code LIKE ? OR c.name LIKE ?`;
      conditions.push(
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`
      );
      if (type == 1 || !type) {
        where += ` OR v.name LIKE ?)`;
        conditions.push(`%${keyword}%`);
      } else {
        where += `)`;
      }
    }

    if (model_id) {
      where += ` AND d.model_id = ?`;
      conditions.push(model_id);
    }

    if (start_warranty_expired_on && end_warranty_expired_on) {
      where += ` AND dv.warranty_expired_on BETWEEN ? AND ?`;
      conditions.push(start_warranty_expired_on, end_warranty_expired_on);
    }

    if (start_activation_date && end_activation_date) {
      where += ` AND dv.activation_date BETWEEN ? AND ?`;
      conditions.push(start_activation_date, end_activation_date);
    }

    if (start_expired_on && end_expired_on) {
      where += ` AND dv.expired_on BETWEEN ? AND ?`;
      conditions.push(start_expired_on, end_expired_on);
    }
    if (type == 2 || actived == 0) {
      where += ` AND dv.activation_date IS NULL AND ud.is_moved = ? AND d.device_status_id <> 2`;
      conditions.push(0);
    }

    let joinTable = `${tableDevice} d INNER JOIN ${tableUsersDevices} ud ON d.id = ud.device_id
    INNER JOIN ${tableUsers} u ON ud.user_id = u.id 
    INNER JOIN ${tableUsersCustomers} uc ON u.id = uc.user_id 
    INNER JOIN ${tableCustomers} c ON uc.customer_id = c.id 
    INNER JOIN ${tableModel} m ON d.model_id = m.id 
    INNER JOIN ${tableDeviceStatus} ds ON d.device_status_id = ds.id 
    LEFT JOIN ${tableFirmware} fw ON m.id = fw.model_id
    LEFT JOIN ${tableServerCamera} ca ON d.sv_cam_id = ca.id
    `;

    let select = `d.id,d.dev_id,d.imei,d.serial,m.name as model_name, 
     dv.expired_on,dv.warranty_expired_on,dv.activation_date,fw.version_hardware,
     fw.version_software,COALESCE(fw.updated_at,fw.created_at) as time_update_version,ca.host`;

    if (type == 1) {
      joinTable += ` INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id 
        INNER JOIN ${tableVehicle} v ON dv.vehicle_id = v.id
        INNER JOIN ${tableServicePackage} sp ON dv.service_package_id = sp.id 
        INNER JOIN ${tableVehicleType} vt ON v.vehicle_type_id = vt.id
        LEFT JOIN ${tableOrdersDevice} od ON ud.device_id = od.device_id
        LEFT JOIN ${tableOrders} o ON od.orders_id = o.id
        LEFT JOIN ${tableCustomers} c1 ON o.reciver = c1.id AND o.creator_customer_id = ?`;

      conditions = [customer, ...conditions];

      select += ` ,o.code orders_code,v.name as vehicle_name, v.is_checked,dv.is_transmission_gps,dv.is_transmission_image,
        vt.name as vehicle_type_name,dv.quantity_channel,sp.name as service_package_name,MAX(COALESCE(c1.company,c1.name)) as customer_name,c1.id as customer_id,v.id as vehicle_id`;
    } else if (type == 2) {
      joinTable += ` LEFT JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id 
        LEFT JOIN ${tableVehicle} v ON dv.vehicle_id = v.id`;
    } else {
      joinTable += ` LEFT JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id 
      LEFT JOIN ${tableVehicle} v ON dv.vehicle_id = v.id
      LEFT JOIN ${tableOrdersDevice} od ON ud.device_id = od.device_id
      LEFT JOIN ${tableOrders} o ON od.orders_id = o.id
      LEFT JOIN ${tableCustomers} c1 ON  o.reciver = c1.id AND o.creator_customer_id = ?`;
      select += ` ,o.code orders_code,d.created_at,d.updated_at,
        ds.title as device_status_name,MAX(COALESCE(c1.company,c1.name)) as customer_name,c1.id as customer_id,v.id as vehicle_id,v.name as vehicle_name`;
      conditions = [customer, ...conditions];
    }

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        `${where} GROUP BY d.id`,
        conditions,
        `d.id`,
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "DISTINCT d.id", `${where}`, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  //getbyid
  async getById(conn, params, query, customerId) {
    // console.log("customerId", customerId);
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    let where = `${tableDevice}.is_deleted = ? AND ${tableDevice}.id = ? AND c.id = ?`;
    const conditions = [isDeleted, id, customerId];

    const joinTable = `${tableDevice} INNER JOIN ${tableModel} ON ${tableDevice}.model_id = ${tableModel}.id 
    INNER JOIN ${tableUsersDevices} ON ${tableDevice}.id = ${tableUsersDevices}.device_id 
    INNER JOIN ${tableUsersCustomers} ON ${tableUsersDevices}.user_id = ${tableUsersCustomers}.user_id 
    INNER JOIN ${tableCustomers} c ON ${tableUsersCustomers}.customer_id = c.id 
    LEFT JOIN ${tableFirmware} ON ${tableModel}.id = ${tableFirmware}.model_id`;

    const selectData = `${tableDevice}.id,${tableDevice}.dev_id,${tableDevice}.imei,${tableDevice}.model_id,${tableDevice}.sv_cam_id,
      ${tableDevice}.serial,${tableFirmware}.version_hardware,${tableFirmware}.version_software,
      ${tableDevice}.device_status_id,${tableDevice}.note`;

    const res_ = await this.select(
      conn,
      joinTable,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  async reference(conn, params, parentId) {
    const { id } = params;

    const joinTable = `${tableUsersDevices} INNER JOIN ${tableUsersCustomers} ON ${tableUsersDevices}.user_id = ${tableUsersCustomers}.user_id 
      INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id 
      INNER JOIN ${tableLevel} ON ${tableCustomers}.level_id = ${tableLevel}.id`;

    const data = await this.select(
      conn,
      joinTable,
      `${tableUsersDevices}.user_id,COALESCE(${tableCustomers}.company,${tableCustomers}.name) as customer_name,${tableLevel}.name as level_name`,
      `${tableUsersDevices}.device_id = ? AND ${tableUsersDevices}.is_deleted = ? GROUP BY ${tableUsersDevices}.id`,
      [id, 0],
      `${tableUsersDevices}.id`,
      "ASC",
      0,
      10000
    );

    if (parentId === null) return data;
    if (data.length) {
      const index = data.findIndex((item) => item.user_id === parentId);
      if (index !== -1) return data.splice(index, data.length);
      return [];
    }
    return [];
  }

  //check
  async checkOutside(conn, params) {
    const { imei } = params;

    const isCheck = await this.validateCheckOutside(conn, imei);
    if (!isCheck.result) {
      throw isCheck.errors;
    }

    const { data } = isCheck;

    return data;
  }

  //checked
  async checkInside(conn, params, userId, parentId) {
    const { imei } = params;

    const isCheck = await this.validateCheckInside(
      conn,
      imei,
      userId,
      parentId
    );
    if (!isCheck.result) {
      throw isCheck.errors;
    }

    const { data } = isCheck;

    return data;
  }

  //activation
  async activationOutside(conn, connPromise, body) {
    const {
      device_id,
      name,
      parent_id,
      username,
      password,
      vehicle,
      weight,
      type,
      warning_speed,
      quantity_channel,
      service_package_id,
      is_transmission_gps,
      is_transmission_image,
      note,
      activation_date,
      imei,
      model_type_id,
      is_use_gps,
    } = body;

    const infoPackage = await this.select(
      conn,
      tableServicePackage,
      "times",
      "id = ?",
      service_package_id
    );
    if (infoPackage?.length <= 0)
      throw {
        msg: ERROR,
        errors: [
          {
            value: service_package_id,
            msg: `Gói dịch vụ ${NOT_EXITS}`,
            param: "service_package_id",
          },
        ],
      };

    await connPromise.beginTransaction();
    const createdAt = Date.now();
    const code = makeCode();
    const res_ = await this.insert(conn, tableCustomers, {
      code,
      name,
      level_id: 6,
      publish: 1,
      is_deleted: 0,
      created_at: createdAt,
    });

    const dataInsertUser = {
      parent_id,
      username,
      password,
      role_id: 3,
      customer_id: res_,
      is_actived: 1,
    };

    const user = await usersModel.register(
      conn,
      connPromise,
      dataInsertUser,
      -1,
      false
    );

    const userId = user[0].id;

    const { times } = infoPackage[0];
    const date = new Date(activation_date || createdAt);
    const date_ = new Date(activation_date || createdAt);
    date.setFullYear(date.getFullYear() + 1);
    date_.setMonth(date_.getMonth() + Number(times));

    const vehicle_ = new VehicleSchema({
      display_name: vehicle,
      name: vehicle,
      vehicle_type_id: type,
      weight,
      warning_speed: warning_speed || null,
      note,
      is_checked: 0,
      is_deleted: 0,
      created_at: createdAt,
    });
    delete vehicle_.updated_at;
    const vehicleId = await this.insert(conn, tableVehicle, vehicle_);

    const deviceVehicle = new DeviceVehicleSchema({
      device_id,
      vehicle_id: vehicleId,
      service_package_id,
      expired_on: date_.getTime(),
      activation_date: activation_date || createdAt,
      warranty_expired_on: date.getTime(),
      quantity_channel,
      quantity_channel_lock: 0,
      type: model_type_id,
      is_use_gps,
      is_deleted: 0,
      is_transmission_gps:
        !is_transmission_gps || is_transmission_gps == 0 ? 0 : 1,
      is_transmission_image:
        !is_transmission_image || is_transmission_image == 0 ? 0 : 1,
      warning_speed: warning_speed || null,
      created_at: createdAt,
    });

    delete deviceVehicle.updated_at;

    await this.insert(conn, tableDeviceVehicle, deviceVehicle);

    await this.update(
      conn,
      tableDevice,
      { device_status_id: 3 },
      "id",
      device_id
    );

    await this.update(
      conn,
      tableUsersDevices,
      { is_moved: 1 },
      "device_id",
      device_id
    );

    const usersDevicesInsert = [[userId, device_id, 1, 0, 0, createdAt]];
    await this.insertDuplicate(
      conn,
      tableUsersDevices,
      "user_id,device_id,is_main,is_deleted,is_moved,created_at",
      usersDevicesInsert,
      `is_deleted=VALUES(is_deleted),is_moved=VALUES(is_moved)`
    );

    const tableGps = getTableName(initialNameOfTableGps, device_id);
    const tableSpeed = getTableName(initialNameOfTableSpeed, device_id);
    const tableReportOneDay = getTableName(
      initialNameOfTableReportOneDay,
      device_id
    );
    const tableContinuous = getTableName(initialNameOfTableRunning, device_id);
    const tableReportRegion = getTableName(
      initialNameOfTableReportRegion,
      device_id
    );

    const listTable = await Promise.all([
      this.checkTableExit(conn, tableGps),
      this.checkTableExit(conn, tableSpeed),
      this.checkTableExit(conn, tableReportOneDay),
      this.checkTableExit(conn, tableContinuous),
      this.checkTableExit(conn, tableReportRegion),
    ]);

    console.log("listTable", listTable);

    const listTableCreate = listTable.map((item, i) => {
      if (item && item.includes(initialNameOfTableGps))
        return this.createTableDeviceGps(conn, item);
      if (item && item.includes(initialNameOfTableSpeed))
        return this.createTableDeviceSpeed(conn, item);
      if (item && item.includes(initialNameOfTableReportOneDay))
        return this.createTableReportOneDay(conn, item);
      if (item && item.includes(initialNameOfTableRunning))
        return this.createTableReportContinuous(conn, item);
      if (item && item.includes(initialNameOfTableReportRegion))
        return this.createTableReportRegion(conn, item);
    });

    if (listTableCreate?.length > 0) {
      await Promise.all(listTableCreate);
    }

    const inforDevice = await this.getInfoDevice(conn, imei);
    console.log("inforDevice", inforDevice);

    if (!inforDevice?.length) throw { msg: ERROR };

    await vehicleModel.removeListDeviceOfUsersRedis(conn, device_id);

    // user_id, device_id, ip, os, gps, des, action, createdAt

    await deviceLoggingModel.postOrDelete(conn, {
      user_id: userId,
      device_id,
      ip: null,
      os: null,
      gps: null,
      des: null,
      action: "Kích hoạt",
      createdAt,
    });

    if (model_type_id == 2) {
      const { sv_cam_id } = inforDevice[0];
      await this.activationCms(
        conn,
        sv_cam_id,
        vehicle,
        imei,
        quantity_channel
      );
    }

    await connPromise.commit();

    await Promise.all([delRedis(`${REDIS_KEY_DEVICE_SPAM}/${imei}`)]);

    return [];
  }

  async activationInside(conn, connPromise, body, userId) {
    const {
      vehicle_id,
      device_id,
      vehicle,
      weight,
      type,
      warning_speed,
      quantity_channel,
      service_package_id,
      is_transmission_gps,
      is_transmission_image,
      note,
      activation_date,
      imei,
      model_type_id,
      is_use_gps,
      // imei_link,
      // expired_on,
      // warranty_expired_on,
    } = body;
    console.log({ imei });

    const infoPackage = await this.select(
      conn,
      tableServicePackage,
      "times",
      "id = ?",
      service_package_id
    );
    if (!infoPackage?.length)
      throw {
        msg: ERROR,
        errors: [
          {
            value: service_package_id,
            msg: `Gói dịch vụ ${NOT_EXITS}`,
            param: "service_package_id",
          },
        ],
      };
    const createdAt = Date.now();
    const { times } = infoPackage[0];
    const date = new Date(activation_date || createdAt);
    const date_ = new Date(activation_date || createdAt);
    date.setFullYear(date.getFullYear() + 1);
    date_.setMonth(date_.getMonth() + Number(times));
    await connPromise.beginTransaction();

    let vehicleId = vehicle_id;

    if (!vehicleId) {
      const vehicle_ = new VehicleSchema({
        display_name: vehicle,
        name: vehicle,
        vehicle_type_id: type,
        weight,
        warning_speed: warning_speed || null,
        note,
        is_checked: 0,
        is_deleted: 0,
        created_at: createdAt,
      });
      delete vehicle_.updated_at;

      vehicleId = await this.insert(conn, tableVehicle, vehicle_);
    }

    const deviceVehicle = new DeviceVehicleSchema({
      device_id,
      vehicle_id: vehicleId,
      service_package_id,
      expired_on: date_.getTime(),
      // expired_on,
      activation_date: activation_date || createdAt,
      warranty_expired_on: date.getTime(),
      // warranty_expired_on,
      quantity_channel,
      quantity_channel_lock: 0,
      type: model_type_id,
      is_use_gps,
      is_deleted: 0,
      is_transmission_gps:
        !is_transmission_gps || is_transmission_gps == 0 ? 0 : 1,
      is_transmission_image:
        !is_transmission_image || is_transmission_image == 0 ? 0 : 1,
      warning_speed: warning_speed || null,
      created_at: createdAt,
    });

    delete deviceVehicle.updated_at;
    await this.insert(conn, tableDeviceVehicle, deviceVehicle);
    await this.update(
      conn,
      tableDevice,
      { device_status_id: 3 },
      "id",
      device_id
    );
    await this.update(
      conn,
      tableUsersDevices,
      { is_moved: 1 },
      "device_id",
      device_id
    );

    const usersDevicesInsert = [[userId, device_id, 1, 0, 0, createdAt]];
    // const usersDevicesInsert = [[userId, device_id, 1, 0, 0, activation_date]];
    await this.insertDuplicate(
      conn,
      tableUsersDevices,
      "user_id,device_id,is_main,is_deleted,is_moved,created_at",
      usersDevicesInsert,
      `is_deleted=VALUES(is_deleted),is_moved=VALUES(is_moved)`
    );

    const tableGps = getTableName(initialNameOfTableGps, device_id);
    const tableSpeed = getTableName(initialNameOfTableSpeed, device_id);
    const tableReportOneDay = getTableName(
      initialNameOfTableReportOneDay,
      device_id
    );
    const tableContinuous = getTableName(initialNameOfTableRunning, device_id);
    const tableReportRegion = getTableName(
      initialNameOfTableReportRegion,
      device_id
    );
    const listTable = await Promise.all([
      this.checkTableExit(conn, tableGps),
      this.checkTableExit(conn, tableSpeed),
      this.checkTableExit(conn, tableReportOneDay),
      this.checkTableExit(conn, tableContinuous),
      this.checkTableExit(conn, tableReportRegion),
    ]);

    const listTableCreate = listTable.map((item, i) => {
      if (item && item.includes(initialNameOfTableGps))
        return this.createTableDeviceGps(conn, item);
      if (item && item.includes(initialNameOfTableSpeed))
        return this.createTableDeviceSpeed(conn, item);
      if (item && item.includes(initialNameOfTableReportOneDay))
        return this.createTableReportOneDay(conn, item);
      if (item && item.includes(initialNameOfTableRunning))
        return this.createTableReportContinuous(conn, item);
      if (item && item.includes(initialNameOfTableReportRegion))
        return this.createTableReportRegion(conn, item);
    });
    if (listTableCreate?.length > 0) {
      await Promise.all(listTableCreate);
    }

    const inforDevice = await this.getInfoDevice(conn, imei);

    console.log("inforDevice", inforDevice);

    if (!inforDevice?.length) throw { msg: ERROR };
    await vehicleModel.removeListDeviceOfUsersRedis(conn, device_id);

    await deviceLoggingModel.postOrDelete(conn, {
      user_id: userId,
      device_id,
      ip: null,
      os: null,
      gps: null,
      des: null,
      action: "Kích hoạt",
      createdAt,
    });

    if (model_type_id == 2) {
      const { sv_cam_id, vehicle_name } = inforDevice[0];
      await this.activationCms(
        conn,
        sv_cam_id,
        vehicle_name,
        imei,
        quantity_channel
      );
    }

    await connPromise.commit();
    await Promise.all([delRedis(`${REDIS_KEY_DEVICE_SPAM}/${imei}`)]);
    return [];
  }

  //Register
  async register(conn, connPromise, body, userId, infoUser) {
    const { dev_id, imei, model_id, serial, sv_cam_id, note } = body;
    const createdAt = Date.now();

    await connPromise.beginTransaction();

    const device = new DeviceSchema({
      dev_id,
      imei,
      model_id,
      serial: serial || null,
      sv_cam_id: sv_cam_id || null,
      note: note || null,
      device_status_id: 1,
      is_deleted: 0,
      created_at: createdAt,
    });
    // console.log("body", body);
    // console.log("sv_cam_id", sv_cam_id);

    // delete device.package_service_id;
    // delete device.expired_on;
    // delete device.activation_date;
    // delete device.warranty_expired_on;
    // delete device.vehicle_type_id;
    delete device.updated_at;
    const res_ = await this.insertDuplicate(
      conn,
      tableDevice,
      ` dev_id,
          imei,
          model_id,
          serial,
          sv_cam_id,
          note,
          device_status_id,
          is_deleted,
          created_at`,

      [
        [
          dev_id,
          imei,
          model_id,
          serial || null,
          sv_cam_id || null,
          note || null,
          1,
          0,
          Date.now(),
        ],
      ],

      "is_deleted=VALUES(is_deleted)"
    );

    await this.insertDuplicate(
      conn,
      tableUsersDevices,
      "user_id,device_id,is_deleted,is_main,is_moved,created_at",
      [[userId, res_, 0, 1, 0, createdAt]],
      "is_deleted=VALUES(is_deleted)"
    );

    const dataSaveLog = {
      ...infoUser,
      device_id: res_,
      action: "Thêm",
      createdAt,
    };

    await deviceLoggingModel.postOrDelete(conn, dataSaveLog);

    await connPromise.commit();

    device.id = res_;
    delete device.is_deleted;
    return device;
  }

  //update
  async updateById(conn, connPromise, body, params, infoUser) {
    const {
      dev_id,
      imei,
      model_id,
      serial,
      device_status_id,
      sv_cam_id,
      note,
    } = body;
    const { id } = params;

    const device = new DeviceSchema({
      dev_id,
      imei,
      model_id,
      serial: serial || null,
      sv_cam_id: sv_cam_id || null,
      note: note || null,
      device_status_id,
      updated_at: Date.now(),
    });
    // console.log(id)
    // delete device.package_service_id;
    // delete device.expired_on;
    // delete device.activation_date;
    // delete device.warranty_expired_on;
    // delete device.vehicle_type_id;
    delete device.is_deleted;
    delete device.created_at;
    await connPromise.beginTransaction();
    const [dataOld, dataModel, dataStatus] = await Promise.all([
      this.select(
        conn,
        tableDevice,
        "dev_id,imei,model_id,serial,note,device_status_id",
        "id = ?",
        id
      ),
      this.select(conn, tableModel, "id,name", "1 = ?", 1),
      this.select(conn, tableDeviceStatus, "id,title", "1 = ?", 1),
    ]);
    await this.update(conn, tableDevice, device, "id", id);
    await this.getInfoDevice(conn, null, id);
    await deviceLoggingModel.update(conn, {
      dataModel,
      dataStatus,
      dataOld: dataOld[0],
      dataNew: { ...device },
      ...infoUser,
      device_id: id,
    });
    await connPromise.commit();
    device.id = id;
    return device;
  }

  //delete
  async deleteById(conn, connPromise, params, infoUser) {
    const { id } = params;
    await connPromise.beginTransaction();

    await this.update(conn, tableDevice, { is_deleted: 1 }, "id", id);
    await this.update(
      conn,
      tableUsersDevices,
      { is_deleted: 1 },
      "device_id",
      id
    );
    const dataSaveLog = {
      ...infoUser,
      device_id: id,
      action: "Xoá",
      createdAt: Date.now(),
    };

    await deviceLoggingModel.postOrDelete(conn, dataSaveLog);
    await connPromise.commit();
    await this.getInfoDevice(conn, null, id);
    return [];
  }
}

module.exports = new DeviceModel();
