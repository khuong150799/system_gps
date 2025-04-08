const DatabaseModel = require("./database.model");
const DeviceSchema = require("./schema/device.schema");
const {
  NOT_EXITS,
  IS_ACTIVED,
  DEVICE_CANNOT_ACTIVATE,
  ERROR,
  NOT_OWN,
  NOT_UPDATE_REALTIME,
} = require("../constants/msg.constant");
const VehicleSchema = require("./schema/vehicle.schema");
const {
  tableDevice,
  tableOrders,
  tableCustomers,
  tableUsersDevices,
  tableUsersCustomers,
  tableOrdersDevice,
  tableModel,
  tableLevel,
  tableVehicle,
  tableServicePackage,
  tableDeviceStatus,
  tableUsers,
  tableVehicleType,
  tableVehicleIcon,
  tableDeviceVehicle,
  tableServerCamera,
  tableGpsLinkAntiTheft,
  tableDeviceInfo,
  tableDeviceGpsSample,
  tableDeviceSpeedSample,
  tableSim,
  tableSimType,
} = require("../constants/tableName.constant");
const { hSet: hsetRedis } = require("./redis.model");
const {
  REDIS_KEY_ANTI_THEFT_LINK_GPS,
  REDIS_KEY_GPS_LINK_ANTI_THEFT,
} = require("../constants/redis.constant");
const handleGenerateTableName = require("../utils/generateTableName.util");
const {
  initialNameOfTableGps,
  initialNameOfTableSpeed,
} = require("../constants/setting.constant");

const vehicleModel = require("./vehicle.model");
const deviceLoggingModel = require("./deviceLogging.model");
const DeviceVehicleSchema = require("./schema/deviceVehicle.schema");
const cameraApi = require("../api/camera.api");
const { date } = require("../utils/time.util");
const customersModel = require("./customers.model");
const {
  ADD_ACTION,
  DEL_ACTION,
  ACTIVE_ACTION,
} = require("../constants/action.constant");

class DeviceModel extends DatabaseModel {
  constructor() {
    super();
  }
  activationCms = async (conn, svCamId, vehicle, imei, quantity_channel) => {
    const dataServerCam = await this.select(
      conn,
      tableServerCamera,
      "host,port",
      "id = ?",
      svCamId
    );

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
    const { result: resAddDevice } = await cameraApi.addDeviceCMS({
      ...dataAddDeviceCms,
      url: `${host}:${port}`,
    });
    // console.log("resAddDevice", imei, resAddDevice);

    if (resAddDevice != 0)
      throw {
        msg: ERROR,
      };

    resCms = await cameraApi.addVehicleCMS({
      ...dataAddVehicleCms,
      url: `${host}:${port}`,
    });

    // console.log("resCms", imei, resCms);

    const { result: resultCms } = resCms;
    if (resultCms != 0)
      throw {
        msg: ERROR,
      };
  };

  async validateCheckOutside(conn, imei) {
    let errors = {};
    const where = `(d.imei = ? OR d.dev_id = ?) AND d.is_deleted = ? AND ud.is_moved = ?`;
    const conditions = [imei, imei, 0, 0];
    const select = `d.id,d.imei,d.device_status_id,d.activation_date,d.warranty_expired_on,d.expired_on,d.remaining_time,d.duration,ud.user_id,m.model_type_id as type`;
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
    } else if (res[0].device_status_id == 3) {
      errors = { msg: `Thiết bị ${IS_ACTIVED}` };
    } else if (res[0].device_status_id == 2) {
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
    const where = `(d.imei = ? OR d.dev_id = ?) AND d.is_deleted = ? AND ud.is_moved = ?`;
    const conditions = [imei, imei, 0, 0];
    const joinTable = `${tableDevice} d INNER JOIN ${tableUsersDevices} ud ON d.id = ud.device_id 
      INNER JOIN ${tableModel} m ON d.model_id = m.id`;
    const select = `d.id,d.imei,d.device_status_id,d.activation_date,d.warranty_expired_on,d.expired_on,d.remaining_time,d.duration,ud.user_id,m.model_type_id as type`;

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
    let where = `d.is_deleted = ? AND ud.is_deleted = ? AND c.id = ? AND ud.is_main = ?`;
    const customer = customer_id || customerId;
    let conditions = [isDeleted, 0, customer, 1];

    if (keyword) {
      where += ` AND (d.dev_id LIKE ? OR d.imei LIKE ? OR c.name LIKE ?`;
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
      where += ` AND d.warranty_expired_on BETWEEN ? AND ?`;
      conditions.push(start_warranty_expired_on, end_warranty_expired_on);
    }

    if (start_activation_date && end_activation_date && type == 1) {
      where += ` AND dv.activation_date BETWEEN ? AND ?`;
      conditions.push(start_activation_date, end_activation_date);
    }

    if (start_expired_on && end_expired_on && type == 1) {
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
    LEFT JOIN ${tableDeviceInfo} di ON d.imei = di.imei
    LEFT JOIN ${tableServerCamera} ca ON d.sv_cam_id = ca.id
    `;

    let select = `d.id,d.dev_id,d.imei,m.name as model_name,di.sid as serial,di.hver as version_hardware,
     di.sver as version_software,di.updated_at as time_update_version,ca.host`;

    if (type == 1) {
      joinTable += ` INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id
        INNER JOIN ${tableVehicle} v ON dv.vehicle_id = v.id
        INNER JOIN ${tableServicePackage} sp ON dv.service_package_id = sp.id
        INNER JOIN ${tableVehicleType} vt ON v.vehicle_type_id = vt.id
        LEFT JOIN (
        SELECT od.device_id, o.code as orders_code,o.reciver
        FROM ${tableOrdersDevice} od
        INNER JOIN ${tableOrders} o ON od.orders_id = o.id
        WHERE od.is_deleted = ? AND o.creator_customer_id = ? AND o.is_deleted = ?
        ) latest_order ON ud.device_id = latest_order.device_id
        LEFT JOIN ${tableCustomers} c1 ON latest_order.orders_code IS NOT NULL AND latest_order.reciver = c1.id`;
      where += ` AND dv.is_deleted = ? AND v.is_deleted = ?`;

      conditions = [0, customer, 0, ...conditions, 0, 0];

      select += ` ,dv.expired_on,dv.activation_date,dv.warranty_expired_on,latest_order.orders_code,v.name as vehicle_name, v.is_checked,dv.is_transmission_gps,dv.is_transmission_image,
        vt.name as vehicle_type_name,dv.is_lock,dv.quantity_channel,sp.name as service_package_name,MAX(COALESCE(c1.company,c1.name)) as customer_name,c1.id as customer_id,v.id as vehicle_id`;
    } else if (type == 2) {
      joinTable += ` LEFT JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id AND dv.is_deleted = ?
        LEFT JOIN ${tableVehicle} v ON dv.vehicle_id = v.id`;

      conditions = [0, ...conditions];
    } else {
      joinTable += ` LEFT JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id AND dv.is_deleted = ?
      LEFT JOIN ${tableVehicle} v ON dv.vehicle_id = v.id AND v.is_deleted = ?
      LEFT JOIN (
      SELECT od.device_id, o.code as orders_code,o.reciver
      FROM ${tableOrdersDevice} od
      INNER JOIN ${tableOrders} o ON od.orders_id = o.id
      WHERE od.is_deleted = ? AND o.creator_customer_id = ? AND o.is_deleted = ?
      ) latest_order ON ud.device_id = latest_order.device_id
      LEFT JOIN ${tableCustomers} c1 ON latest_order.orders_code IS NOT NULL AND latest_order.reciver = c1.id`;
      select += ` ,d.expired_on,d.activation_date,d.warranty_expired_on,latest_order.orders_code,d.created_at,d.updated_at,
        ds.title as device_status_name,MAX(COALESCE(c1.company,c1.name)) as customer_name,c1.id as customer_id,v.id as vehicle_id,v.name as vehicle_name`;
      conditions = [0, 0, 0, customer, 0, ...conditions];
    }

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        `${where} GROUP BY d.id`,
        conditions,
        type == 1 ? "dv.activation_date" : `d.id`,
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "DISTINCT d.id", `${where}`, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  async getById(conn, params, userId) {
    const { id, imei } = params || {};

    const joinTable = `${tableDevice} d LEFT JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id AND dv.is_deleted = 0
    LEFT JOIN ${tableVehicle} v ON dv.vehicle_id = v.id AND v.is_deleted = 0
    LEFT JOIN ${tableVehicleType} vt ON v.vehicle_type_id = vt.id
    LEFT JOIN ${tableVehicleIcon} vi ON vt.vehicle_icon_id = vi.id
    LEFT JOIN ${tableDeviceInfo} di ON d.imei = di.imei
    LEFT JOIN ${tableSim} s ON di.sid = s.seri_display
    LEFT JOIN ${tableSimType} st ON s.type_id = st.id
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
      d.id as device_id,d.dev_id,d.serial,d.imei,dv.expired_on,dv.activation_date,dv.warranty_expired_on,dv.is_use_gps,dv.sleep_time,dv.quantity_channel,dv.chn_capture,dv.quantity_channel_lock,dv.is_lock,dv.is_transmission_gps,dv.is_transmission_image,
      v.display_name,v.name as vehicle_name,v.id as vehicle_id,v.vehicle_type_id,v.chassis_number,v.business_type_id,vt.name as vehicle_type_name,dv.service_package_id,vt.vehicle_icon_id,vt.max_speed,v.weight,v.warning_speed,m.id as model_id,
      m.name as model_name,m.model_type_id,ds.id as device_status_id,ds.title as device_status_name,COALESCE(c0.company,
      c0.name) as customer_name,COALESCE(c.company, c.name) as agency_name,c.phone as agency_phone,vi.name as vehicle_icon_name,
      c0.id as customer_id,c.id as agency_id,d.sv_cam_id,s.seri_display,s.phone as device_phone,st.name as sim_type_name`;

    let where = `AND ud.user_id = ? AND d.is_deleted = 0 AND c0.is_deleted = 0 AND u.is_deleted = 0 AND ud.is_deleted = 0`;
    const conditions = [];
    if (id) {
      where = `d.id = ? ${where}`;
      conditions.push(id, userId);
    } else if (imei) {
      where = `d.imei = ? ${where}`;
      conditions.push(imei, userId);
    }

    const data = await this.select(
      conn,
      joinTable,
      select,
      where,
      conditions,
      `d.id`
    );

    return data;
  }

  async reference(conn, params, parentId) {
    const { id } = params;

    const joinTable = `${tableDevice} d INNER JOIN ${tableUsersDevices} ud ON d.id = ud.device_id 
      INNER JOIN ${tableUsersCustomers} uc ON ud.user_id = uc.user_id 
      INNER JOIN ${tableUsers} u ON uc.user_id = u.id 
      INNER JOIN ${tableCustomers} c ON uc.customer_id = c.id 
      INNER JOIN ${tableLevel} l ON c.level_id = l.id`;

    const data = await this.select(
      conn,
      joinTable,
      `u.id as user_id,c.id as customer_id,COALESCE(c.company,c.name) as customer_name,l.name as level_name`,
      `d.id = ? AND ud.is_deleted = ? AND ud.is_main = ?`,
      [id, 0, 1],
      `u.left`,
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

  async handleCheckPackage(conn, service_package_id, ischeckAntiTheft = true) {
    const infoPackage = await this.select(
      conn,
      tableServicePackage,
      "times",
      "id = ?",
      service_package_id
    );
    if (infoPackage?.length <= 0) {
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
    } else if (service_package_id == 29 && ischeckAntiTheft)
      throw {
        msg: ERROR,
        errors: [
          {
            msg: "Thiết bị cống trộm chỉ có thể thêm vào phương tiện",
            value: imei,
            param: "imei",
          },
        ],
      };

    return infoPackage;
  }

  async handleCreateTable(conn, device_id) {
    try {
      const tableGps = handleGenerateTableName(
        initialNameOfTableGps,
        device_id
      );
      const tableSpeed = handleGenerateTableName(
        initialNameOfTableSpeed,
        device_id
      );

      await Promise.all([
        this.createTableLike(conn, tableGps, tableDeviceGpsSample),
        this.createTableLike(conn, tableSpeed, tableDeviceSpeedSample),
      ]);
    } catch (error) {
      console.log("create table device gps fail", error);
    }
  }

  async handleCreateVehicle(
    conn,
    body,
    infoPackage,
    createdAt,
    vehicle_id = null
  ) {
    const {
      device_id,
      vehicle,
      weight,
      chassis_number,
      type,
      warning_speed,
      quantity_channel,
      service_package_id,
      note,
      imei,
      expired_on,
      model_type_id,
      is_use_gps,
      business_type_id,
    } = body;

    let vehicleId = vehicle_id;

    const { times } = infoPackage[0];
    const date = new Date(createdAt);
    const date_ = new Date(createdAt);
    date.setFullYear(date.getFullYear() + 1);
    date_.setMonth(date_.getMonth() + Number(times));

    if (!vehicleId) {
      const vehicle_ = new VehicleSchema({
        display_name: vehicle,
        name: vehicle,
        vehicle_type_id: type,
        weight,
        chassis_number: chassis_number || null,
        business_type_id: business_type_id || null,
        warning_speed: warning_speed || null,
        note,
        is_checked: 0,
        is_deleted: 0,
        created_at: createdAt,
      });
      delete vehicle_.updated_at;
      vehicleId = await this.insert(conn, tableVehicle, vehicle_);
    }

    if (service_package_id == 29 && vehicleId) {
      await this.handleGpsLinkAntiTheft(conn, vehicleId, imei);
    }

    const expiredOn =
      expired_on && Number(expired_on) > createdAt
        ? expired_on
        : expired_on || date_.getTime();

    const deviceVehicle = new DeviceVehicleSchema({
      device_id,
      vehicle_id: vehicleId,
      service_package_id,
      expired_on: expiredOn,
      activation_date: createdAt,
      warranty_expired_on: date.getTime(),
      quantity_channel,
      quantity_channel_lock: 0,
      type: model_type_id,
      is_use_gps,
      is_deleted: 0,
      is_transmission_gps: 0,
      is_transmission_image: 0,
      chn_capture: null,
      warning_speed: warning_speed || null,
      created_at: createdAt,
    });

    delete deviceVehicle.updated_at;

    await this.insert(conn, tableDeviceVehicle, deviceVehicle);

    const dataUpdateDevice = {
      device_status_id: 3,
      warranty_expired_on: date.getTime(),
      activation_date: createdAt,
      expired_on: expiredOn,
    };

    if (expired_on) {
      delete dataUpdateDevice.activation_date;
      delete dataUpdateDevice.warranty_expired_on;
    }

    await this.update(conn, tableDevice, dataUpdateDevice, "id", device_id);
    return { vehicleId };
  }

  //activation
  // async activationOutside(conn, connPromise, body) {
  async activationOutside(conn, body) {
    const {
      device_id,
      vehicle,
      quantity_channel,
      service_package_id,
      imei,
      model_type_id,
      name,
      parent_id,
      username,
      password,
      phoneNumber,
      // business_type_id,
    } = body;

    const infoPackage = await this.handleCheckPackage(conn, service_package_id);

    // await connPromise.beginTransaction();
    const createdAt = Date.now();

    const user = await customersModel.register(
      conn,
      // connPromise,
      null,
      {
        level_id: 6,
        name,
        company: null,
        email: null,
        phone: phoneNumber,
        address: null,
        tax_code: null,
        website: null,
        parent_id,
        username,
        password,
        role_id: 3,
        publish: 1,
        // business_type_id,
      },
      false
    );

    const userId = user.id;

    const { vehicleId } = await this.handleCreateVehicle(
      conn,
      body,
      infoPackage,
      createdAt,
      false
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

    const inforDevice = await vehicleModel.getInfoDevice(conn, imei);
    // console.log("inforDevice", inforDevice);

    if (!inforDevice?.length) throw { msg: ERROR };

    await vehicleModel.removeListDeviceOfUsersRedis(conn, device_id);

    await deviceLoggingModel.postOrDelete(conn, {
      user_id: userId,
      device_id,
      vehicle_id: vehicleId,
      ip: null,
      os: null,
      gps: null,
      des: null,
      action: ACTIVE_ACTION,
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

    await this.handleCreateTable(conn, device_id);

    // await connPromise.commit();

    return [];
  }

  async handleGpsLinkAntiTheft(conn, vehicleId, imei) {
    const joinTable = `${tableDeviceVehicle} dv INNER JOIN ${tableDevice} d ON dv.device_id = d.id`;

    const select = "dv.device_id,d.imei";
    const where =
      "dv.vehicle_id = ? AND dv.is_deleted = ? AND d.is_deleted = ?";
    const condition = [vehicleId, 0, 0];
    const listDeviceOfVehicle = await this.select(
      conn,
      joinTable,
      select,
      where,
      condition,
      "dv.id",
      "ASC"
    );
    if (!listDeviceOfVehicle?.length)
      throw {
        msg: ERROR,
        errors: [{ msg: "Không liên kết được với thiết bị GPS" }],
      };

    const dataAntiTheftLinkGps = [];

    const listPromiseGpsLinkAntiTheft = [];

    for (let i = 0; i < listDeviceOfVehicle.length; i++) {
      const imeiOfVehicle = listDeviceOfVehicle[i];
      dataAntiTheftLinkGps.push(imeiOfVehicle.imei);
      listPromiseGpsLinkAntiTheft.push(
        hsetRedis(REDIS_KEY_GPS_LINK_ANTI_THEFT, imeiOfVehicle.imei, imei)
      );
    }

    const dataInsert = {
      imei_anti_theft: imei,
      imei_link: JSON.stringify(dataAntiTheftLinkGps),
      is_deleted: 0,
      created_at: Date.now(),
    };

    await this.insert(conn, tableGpsLinkAntiTheft, dataInsert);

    const listDataSetRedis = await Promise.all(listPromiseGpsLinkAntiTheft);

    let isRollback = false;

    for (let i = 0; i < listDataSetRedis.length; i++) {
      const { result } = listDataSetRedis[i];

      if (!result) {
        isRollback = true;
      }
    }

    if (isRollback)
      throw {
        msg: ERROR,
        errors: [{ msg: "Không liên kết được với thiết bị GPS" }],
      };

    const { result } = await hsetRedis(
      REDIS_KEY_ANTI_THEFT_LINK_GPS,
      imei,
      JSON.stringify(dataAntiTheftLinkGps)
    );

    if (!result)
      throw {
        msg: ERROR,
        errors: [{ msg: "Không liên kết được với thiết bị GPS" }],
      };
  }

  async activationInside(conn, connPromise, body, userId) {
    const {
      vehicle_id,
      device_id,
      quantity_channel,
      service_package_id,
      imei,
      model_type_id,
    } = body;

    // console.log({ imei });

    const infoPackage = await this.handleCheckPackage(
      conn,
      service_package_id,
      !vehicle_id
    );

    const createdAt = Date.now();

    await connPromise.beginTransaction();

    const { vehicleId } = await this.handleCreateVehicle(
      conn,
      body,
      infoPackage,
      createdAt,
      vehicle_id
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

    const inforDevice = await vehicleModel.getInfoDevice(conn, imei);

    // console.log("inforDevice", inforDevice);
    // console.log("inforDevice?.length", inforDevice?.length);

    if (!inforDevice?.length)
      throw {
        msg: ERROR,
        errors: [{ msg: NOT_UPDATE_REALTIME }],
      };
    await vehicleModel.removeListDeviceOfUsersRedis(conn, device_id);

    await deviceLoggingModel.postOrDelete(conn, {
      user_id: userId,
      device_id,
      vehicle_id: vehicleId,
      ip: null,
      os: null,
      gps: null,
      des: null,
      action: ACTIVE_ACTION,
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

    await this.handleCreateTable(conn, device_id);

    await connPromise.commit();
    return [];
  }

  async serviceReservation(conn, connPromise, body, params, data, infoUser) {
    const { msg_notify, duration } = body;
    const { id } = params;

    const { remainingTime, isUpdateRemainingTime } = data;

    await connPromise.beginTransaction();
    const dataUpdate = isUpdateRemainingTime
      ? { remaining_time: remainingTime, duration, updated_at: Date.now() }
      : { duration, updated_at: Date.now() };

    await this.update(conn, tableDevice, dataUpdate, "id", id);
    await deviceLoggingModel.postOrDelete(conn, {
      ...infoUser,
      device_id: id,

      des: `Bảo lưu đến ${date(duration)}`,
      action: "Bảo lưu",
      createdAt: Date.now(),
    });

    // await hdelOneKey(REDIS_KEY_LIST_DEVICE, imei.toString());
    await connPromise.commit();
    return [];
  }

  //Register
  async register(
    conn,
    connPromise,
    body,
    listImei,
    listDevId,
    userId,
    isMain,
    parentId,
    infoUser
  ) {
    const { model_id, serial, sv_cam_id, note } = body;

    const listSerial = JSON.parse(serial);
    const createdAt = Date.now();

    await connPromise.beginTransaction();

    const dataInsertDevice = [];
    const dataInsertDeviceInfo = [];

    for (let i = 0; i < listImei.length; i++) {
      const imei = listImei[i];
      const dev_id = listDevId[i];

      dataInsertDevice.push([
        dev_id,
        imei,
        model_id,
        listSerial[i],
        sv_cam_id || null,
        note || null,
        1,
        0,
        Date.now(),
      ]);

      dataInsertDeviceInfo.push([imei, listSerial[i], Date.now()]);
    }

    const res_ = await this.insertMulti(
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
      dataInsertDevice
    );

    const dataInsertUserDevice = [];

    const dataInsertLogs = [];

    const { user_id, ip, os, gps } = infoUser;

    for (let i = 0; i < listImei.length; i++) {
      dataInsertUserDevice.push([
        isMain == 0 ? parentId : userId,
        res_ + i,
        0,
        1,
        0,
        createdAt + i,
      ]);

      dataInsertLogs.push([
        user_id,
        ip,
        os,
        gps,
        res_ + i,
        ADD_ACTION,
        "[]",
        0,
        createdAt + i,
      ]);
    }

    await this.insertMulti(
      conn,
      tableUsersDevices,
      "user_id,device_id,is_deleted,is_main,is_moved,created_at",
      dataInsertUserDevice,
      "is_deleted=VALUES(is_deleted),created_at=VALUES(created_at)"
    );

    await this.insertIgnore(
      conn,
      tableDeviceInfo,
      "imei,sid,updated_at",
      dataInsertDeviceInfo
    );

    await deviceLoggingModel.postMulti(conn, dataInsertLogs);

    await connPromise.commit();

    return [];
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

    delete device.activation_date;
    delete device.warranty_expired_on;
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

    if (sv_cam_id) {
      await this.insertDuplicate(
        conn,
        tableDeviceInfo,
        "imei,sid,updated_at",
        [[imei, serial, Date.now()]],
        "imei=VALUES(imei),sid=VALUES(sid),updated_at=VALUES(updated_at)"
      );
    }

    await vehicleModel.getInfoDevice(conn, imei);
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
      action: DEL_ACTION,
      createdAt: Date.now(),
    };

    await deviceLoggingModel.postOrDelete(conn, dataSaveLog);
    await connPromise.commit();
    await vehicleModel.getInfoDevice(conn, null, id);
    return [];
  }
}

module.exports = new DeviceModel();
