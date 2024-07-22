const DatabaseModel = require("./database.model");
const DeviceSchema = require("./schema/device.schema");
const {
  NOT_EXITS,
  IS_ACTIVED,
  DEVICE_CANNOT_ACTIVATE,
  ERROR,
  NOT_OWN,
} = require("../constants/msg.contant");
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
} = require("../constants/tableName.contant");
const { hSet: hsetRedis, expire: expireRedis } = require("./redis.model");
const {
  REDIS_KEY_LIST_DEVICE,
  REDIS_KEY_DEVICE_SPAM,
  REDIS_KEY_LIST_IMEI_OF_USERS,
} = require("../constants/redis.contant");
const getTableName = require("../ultils/getTableName");
const {
  initialNameOfTableGps,
  initialNameOfTableSpeed,
  initialNameOfTableReportOneDay,
  initialNameOfTableRunning,
} = require("../constants/setting.constant");
const usersModel = require("./users.model");
const { makeCode } = require("../ultils/makeCode");
const vehicleModel = require("./vehicle.model");

class DeviceModel extends DatabaseModel {
  constructor() {
    super();
  }

  async validateCheckOutside(conn, imei) {
    let errors = {};
    const where = `${tableDevice}.imei = ? AND ${tableDevice}.is_deleted = ? AND ${tableUsersDevices}.is_moved = ?`;
    const conditions = [imei, 0, 0];
    // const joinTable = `${tableDevice} LEFT JOIN ${tableVehicle} ON ${tableDevice}.id = ${tableVehicle}.device_id`;
    const select = `${tableDevice}.id,${tableDevice}.device_status_id,${tableUsersDevices}.user_id`;
    const joinTable = `${tableDevice} INNER JOIN ${tableUsersDevices} ON ${tableDevice}.id = ${tableUsersDevices}.device_id`;

    const res = await this.select(
      conn,
      joinTable,
      select,
      where,
      conditions,
      `${tableDevice}.id`
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

    return { result: true, data: res };
  }

  async validateCheckInside(conn, imei, userId, parentId) {
    // console.log({ imei, userId, parentId });
    let errors = {};
    const where = `${tableDevice}.imei = ? AND ${tableDevice}.is_deleted = ? AND ${tableUsersDevices}.is_moved = ?`;
    const conditions = [imei, 0, 0];
    const joinTable = `${tableDevice} INNER JOIN ${tableUsersDevices} ON ${tableDevice}.id = ${tableUsersDevices}.device_id`;
    const select = `${tableDevice}.id,${tableDevice}.device_status_id,${tableUsersDevices}.user_id`;

    const [res, infoUser] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        `${tableDevice}.id`
      ),
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

    return { result: true, data: res };
  }

  async getWithImei(conn, imei, device_id) {
    const joinTable = `${tableDevice} d INNER JOIN ${tableVehicle} v ON d.id = v.device_id
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

    const select = `d.id as device_id,d.imei,v.expired_on,v.activation_date,v.warranty_expired_on,
      v.name as vehicle_name,vt.name as vehicle_type_name,vt.vehicle_icon_id,vt.max_speed,
      m.name as model_name,ds.title as device_status_name,COALESCE(c0.company,
      c0.name) as customer_name,COALESCE(c.company, c.name) as agency_name,c.phone as agency_phone,vi.name as vehicle_icon_name,
      c0.id as customer_id,c.id as agency_id`;

    const data = await this.select(
      conn,
      joinTable,
      select,
      imei ? `d.imei = ?` : device_id ? "d.id = ?" : "1 = ?",
      imei || device_id || 1,
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
      warehouse,
      warehouse_not_actived,
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
      if (type == 1) {
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
      where += ` AND v.warranty_expired_on BETWEEN ? AND ?`;
      conditions.push(start_warranty_expired_on, end_warranty_expired_on);
    }

    if (start_activation_date && end_activation_date) {
      where += ` AND v.activation_date BETWEEN ? AND ?`;
      conditions.push(start_activation_date, end_activation_date);
    }

    if (start_expired_on && end_expired_on) {
      where += ` AND v.expired_on BETWEEN ? AND ?`;
      conditions.push(start_expired_on, end_expired_on);
    }
    if (type == 2 || actived == 0) {
      where += ` AND v.activation_date IS NULL AND ud.is_moved = ? AND d.device_status_id <> 2`;
      conditions.push(0);
    }

    let joinTable = `${tableDevice} d INNER JOIN ${tableUsersDevices} ud ON d.id = ud.device_id
    INNER JOIN ${tableUsers} u ON ud.user_id = u.id 
    INNER JOIN ${tableUsersCustomers} uc ON u.id = uc.user_id 
    INNER JOIN ${tableCustomers} c ON uc.customer_id = c.id 
    INNER JOIN ${tableModel} m ON d.model_id = m.id 
    INNER JOIN ${tableDeviceStatus} ds ON d.device_status_id = ds.id 
    LEFT JOIN ${tableFirmware} fw ON m.id = fw.model_id`;

    let select = `d.id,d.dev_id,d.imei,d.serial,m.name as model_name, 
     v.expired_on,v.warranty_expired_on,v.activation_date,fw.version_hardware,
     fw.version_software,COALESCE(fw.updated_at,fw.created_at) as time_update_version`;

    if (type == 1) {
      joinTable += ` INNER JOIN ${tableVehicle} v ON d.id = v.device_id 
        INNER JOIN ${tableServicePackage} sp ON v.service_package_id = sp.id 
        INNER JOIN ${tableVehicleType} vt ON v.vehicle_type_id = vt.id
        LEFT JOIN ${tableOrdersDevice} od ON ud.device_id = od.device_id
        LEFT JOIN ${tableOrders} o ON od.orders_id = o.id
        LEFT JOIN ${tableCustomers} c1 ON o.reciver = c1.id AND o.creator_customer_id = ?`;
      conditions = [customer, ...conditions];

      select += ` ,o.code orders_code,v.name as vehicle_name, v.is_checked,v.is_transmission_gps,v.is_transmission_image,
        vt.name as vehicle_type_name,v.quantity_channel,sp.name as service_package_name,MAX(COALESCE(c1.company,c1.name)) as customer_name,c1.id as customer_id`;
    } else if (type == 2) {
      joinTable += ` LEFT JOIN ${tableVehicle} v ON d.id = v.device_id`;
    } else {
      joinTable += ` LEFT JOIN ${tableVehicle} v ON d.id = v.device_id
      LEFT JOIN ${tableOrdersDevice} od ON ud.device_id = od.device_id
      LEFT JOIN ${tableOrders} o ON od.orders_id = o.id
      LEFT JOIN ${tableCustomers} c1 ON  o.reciver = c1.id AND o.creator_customer_id = ?`;
      select += ` ,o.code orders_code,d.created_at,d.updated_at,
        ds.title as device_status_name,MAX(COALESCE(c1.company,c1.name)) as customer_name,c1.id as customer_id`;
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
      this.count(conn, joinTable, "*", where, conditions),
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

    const selectData = `${tableDevice}.id,${tableDevice}.dev_id,${tableDevice}.imei,${tableDevice}.model_id,
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
    const code = makeCode();
    const res_ = await this.insert(conn, tableCustomers, {
      code,
      name,
      level_id: 6,
      publish: 1,
      is_deleted: 0,
      created_at: Date.now(),
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
    const date = new Date(activation_date || Date.now());
    const date_ = new Date(activation_date || Date.now());
    date.setFullYear(date.getFullYear() + 1);
    date_.setMonth(date_.getMonth() + Number(times));

    const vehicle_ = new VehicleSchema({
      device_id,
      name: vehicle,
      service_package_id,
      expired_on: date_.getTime(),
      activation_date: activation_date || Date.now(),
      warranty_expired_on: date.getTime(),
      vehicle_type_id: type,
      quantity_channel,
      weight,
      note,
      is_checked: 0,
      is_deleted: 0,
      is_transmission_gps:
        !is_transmission_gps || is_transmission_gps == 0 ? 0 : 1,
      is_transmission_image:
        !is_transmission_image || is_transmission_image == 0 ? 0 : 1,
      warning_speed: warning_speed || null,
      created_at: Date.now(),
    });
    delete vehicle_.updated_at;
    await this.insert(conn, tableVehicle, vehicle_);

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

    const usersDevicesInsert = [[userId, device_id, 1, 0, 0, Date.now()]];
    await this.insertDuplicate(
      conn,
      tableUsersDevices,
      "user_id,device_id,is_main,is_deleted,is_moved,created_at",
      usersDevicesInsert,
      `is_deleted=VALUES(is_deleted),is_moved=VALUES(is_moved)`
    );

    await connPromise.commit();

    if (imei) {
      await Promise.all([
        this.getWithImei(conn, imei),
        expireRedis(`${REDIS_KEY_DEVICE_SPAM}/${imei}`, -1),
        vehicleModel.removeListDeviceOfUsersRedis(conn, device_id),
      ]);
    }

    return [];
  }

  async activationInside(conn, connPromise, body, userId) {
    const {
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

    const { times } = infoPackage[0];
    const date = new Date(activation_date || Date.now());
    const date_ = new Date(activation_date || Date.now());
    date.setFullYear(date.getFullYear() + 1);
    date_.setMonth(date_.getMonth() + Number(times));

    const vehicle_ = new VehicleSchema({
      device_id,
      name: vehicle,
      service_package_id,
      expired_on: date_.getTime(),
      activation_date: activation_date || Date.now(),
      warranty_expired_on: date.getTime(),
      vehicle_type_id: type,
      quantity_channel,
      weight,
      note,
      is_checked: 0,
      is_deleted: 0,
      is_transmission_gps:
        !is_transmission_gps || is_transmission_gps == 0 ? 0 : 1,
      is_transmission_image:
        !is_transmission_image || is_transmission_image == 0 ? 0 : 1,
      warning_speed: warning_speed || null,
      created_at: Date.now(),
    });
    delete vehicle_.updated_at;

    await connPromise.beginTransaction();
    await this.insert(conn, tableVehicle, vehicle_);
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

    const usersDevicesInsert = [[userId, device_id, 1, 0, 0, Date.now()]];
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

    const listTable = await Promise.all([
      this.checkTableExit(conn, tableGps),
      this.checkTableExit(conn, tableSpeed),
      this.checkTableExit(conn, tableReportOneDay),
      this.checkTableExit(conn, tableContinuous),
    ]);

    const listTableCreate = listTable.map((item, i) => {
      if (item?.length <= 0 && i === 0)
        return this.createTableDeviceGps(conn, tableGps);
      if (item?.length <= 0 && i === 1)
        return this.createTableDeviceSpeed(conn, tableSpeed);
      if (item?.length <= 0 && i === 2)
        return this.createTableReportOneDay(conn, tableReportOneDay);
      if (item?.length <= 0 && i === 3)
        return this.createTableReportContinuous(conn, tableContinuous);
    });

    if (listTableCreate?.length > 0) {
      await Promise.all(listTableCreate);
    }
    await connPromise.commit();

    if (imei) {
      await Promise.all([
        this.getWithImei(conn, imei),
        expireRedis(`${REDIS_KEY_DEVICE_SPAM}/${imei}`, -1),
        vehicleModel.removeListDeviceOfUsersRedis(conn, device_id),
      ]);
    }

    return [];
  }

  //Register
  async register(conn, connPromise, body, userId) {
    const { dev_id, imei, model_id, serial, note } = body;

    await connPromise.beginTransaction();

    const device = new DeviceSchema({
      dev_id,
      imei,
      model_id,
      serial: serial || null,
      note: note || null,
      device_status_id: 1,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete device.device_name;
    delete device.package_service_id;
    delete device.expired_on;
    delete device.activation_date;
    delete device.warranty_expired_on;
    delete device.vehicle_type_id;
    delete device.updated_at;
    const res_ = await this.insertDuplicate(
      conn,
      tableDevice,
      ` dev_id,
          imei,
          model_id,
          serial,
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
      [[userId, res_, 0, 1, 0, Date.now()]],
      "is_deleted=VALUES(is_deleted)"
    );

    await connPromise.commit();

    device.id = res_;
    delete device.is_deleted;
    return device;
  }

  //update
  async updateById(conn, body, params) {
    const { dev_id, imei, model_id, serial, device_status_id, note } = body;
    const { id } = params;

    const device = new DeviceSchema({
      dev_id,
      imei,
      model_id,
      serial: serial || null,
      note: note || null,
      device_status_id,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete device.device_name;
    delete device.package_service_id;
    delete device.expired_on;
    delete device.activation_date;
    delete device.warranty_expired_on;
    delete device.vehicle_type_id;
    delete device.is_deleted;
    delete device.created_at;

    await this.update(conn, tableDevice, device, "id", id);
    await this.getWithImei(conn, null, id);
    device.id = id;
    return device;
  }

  //delete
  async deleteById(conn, connPromise, params) {
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
    await connPromise.commit();
    await this.getWithImei(conn, null, id);
    return [];
  }

  //delete
  async deleteById(conn, connPromise, params) {
    const { id } = params;
    await connPromise.beginTransaction();

    await this.update(conn, tableUsersDevices, { is_deleted: 1 }, "id", id);
    await this.update(
      conn,
      tableUsersDevices,
      { is_deleted: 1 },
      "device_id",
      id
    );
    await connPromise.commit();
    await this.getWithImei(conn, null, id);
    return [];
  }
}

module.exports = new DeviceModel();
