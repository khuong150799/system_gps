const DatabaseModel = require("./database.model");
const DeviceSchema = require("./schema/device.schema");
const {
  NOT_EXITS,
  IS_ACTIVED,
  DEVICE_CANNOT_ACTIVATE,
  ERROR,
} = require("../constants/msg.contant");
const customersModel = require("./customers.model");
const VehicleSchema = require("./Schema/vehicle.schema");
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
} = require("../constants/tableName.contant");

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
      errors = { msg: `Thiết bi ${NOT_EXITS}` };
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
    console.log({ imei, userId, parentId });
    let errors = {};
    const where = `${tableDevice}.imei = ? AND ${tableDevice}.is_deleted = ? AND ${tableUsersDevices}.is_moved = ?`;
    const conditions = [imei, 0, 0];
    const joinTable = `${tableDevice} INNER JOIN ${tableUsersDevices} ON ${tableDevice}.id = ${tableUsersDevices}.device_id`;
    const select = `${tableDevice}.id,${tableDevice}.device_status_id,${tableUsersDevices}.user_id`;

    const res = await this.select(
      conn,
      joinTable,
      select,
      where,
      conditions,
      `${tableDevice}.id`
    );
    console.log({ res });
    if (
      !res ||
      res?.length <= 0 ||
      (res[0].user_id !== userId && res[0].user_id !== parentId)
    ) {
      errors = { msg: `Thiết bi ${NOT_EXITS}` };
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

  //getallrow
  async getallrows(conn, query, customerId) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;

    const {
      is_deleted,
      keyword,
      customer_id,
      model_id,
      start_warranty_expired_on,
      end_warranty_expired_on,
      start_activation_date,
      end_activation_date,
    } = query;

    const isDeleted = is_deleted || 0;
    let where = `${tableDevice}.is_deleted = ? AND c.id = ?`;
    const customer = customer_id || customerId;
    const conditions = [isDeleted, customer];

    if (keyword) {
      where += ` AND (${tableDevice}.dev_id LIKE ? OR ${tableDevice}.imei LIKE ? OR ${tableOrders}.code LIKE ? OR ${tableCustomers}.name LIKE ?)`;
      conditions.push(
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`
      );
    }

    if (model_id) {
      where += ` AND ${tableDevice}.model_id = ?`;
      conditions.push(model_id);
    }

    if (start_warranty_expired_on && end_warranty_expired_on) {
      where += ` AND ${tableDevice}.warranty_expired_on BETWEEN ? AND ?`;
      conditions.push(start_warranty_expired_on, end_warranty_expired_on);
    }

    if (start_activation_date && end_activation_date) {
      where += ` AND ${tableDevice}.activation_date BETWEEN ? AND ?`;
      conditions.push(start_activation_date, end_activation_date);
    }

    const joinTable = `${tableDevice} INNER JOIN ${tableModel} ON ${tableDevice}.model_id = ${tableModel}.id 
      INNER JOIN ${tableUsersDevices} ON ${tableDevice}.id = ${tableUsersDevices}.device_id 
      INNER JOIN ${tableUsersCustomers} ON ${tableUsersDevices}.user_id = ${tableUsersCustomers}.user_id 
      INNER JOIN ${tableCustomers} c ON ${tableUsersCustomers}.customer_id = c.id 
      INNER JOIN ${tableDeviceStatus} ON ${tableDevice}.device_status_id = ${tableDeviceStatus}.id 
      LEFT JOIN ${tableVehicle} ON ${tableDevice}.id = ${tableVehicle}.id 
      LEFT JOIN ${tableOrdersDevice} ON ${tableDevice}.id = ${tableOrdersDevice}.device_id 
      LEFT JOIN ${tableOrders} ON ${tableOrdersDevice}.orders_id = ${tableOrders}.id 
      LEFT JOIN ${tableCustomers} ON ${tableOrders}.reciver = ${tableCustomers}.id 
      LEFT JOIN ${tableFirmware} ON ${tableModel}.id = ${tableFirmware}.model_id`;

    const select = `${tableDevice}.id,${tableDevice}.dev_id,${tableDevice}.imei,${tableModel}.name as model_name,
    ${tableFirmware}.version_hardware,${tableFirmware}.version_software,COALESCE(${tableFirmware}.updated_at,${tableFirmware}.created_at) as time_update_version,${tableOrders}.code orders_code,
    COALESCE(c.company,c.name) as customer_name,${tableDevice}.created_at,${tableDevice}.updated_at,${tableDeviceStatus}.title as device_status_name,${tableVehicle}.expired_on,${tableVehicle}.warranty_expired_on,${tableVehicle}.activation_date`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        `${tableDevice}.id`,
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage };
  }

  //getbyid
  async getById(conn, params, query, customerId) {
    // console.log("customerId", customerId);
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `${tableDevice}.is_deleted = ? AND ${tableDevice}.id = ? AND c.id = ?`;
    const conditions = [isDeleted, id, customerId];

    const joinTable = `${tableDevice} INNER JOIN ${tableModel} ON ${tableDevice}.model_id = ${tableModel}.id 
    INNER JOIN ${tableUsersDevices} ON ${tableDevice}.id = ${tableUsersDevices}.device_id 
    INNER JOIN ${tableUsersCustomers} ON ${tableUsersDevices}.user_id = ${tableUsersCustomers}.user_id 
    INNER JOIN ${tableCustomers} c ON ${tableUsersCustomers}.customer_id = c.id 
    LEFT JOIN ${tableFirmware} ON ${tableModel}.id = ${tableFirmware}.model_id`;

    const selectData = `${tableDevice}.id,${tableDevice}.dev_id,${tableDevice}.imei,${tableDevice}.model_id,
      ${tableDevice}.serial,${tableDevice}.device_name,${tableFirmware}.version_hardware,${tableFirmware}.version_software,
      ${tableDevice}.device_status_id,${tableDevice}.package_service_id,${tableDevice}.expired_on,${tableDevice}.vehicle_type_id,${tableDevice}.note`;

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
      `${tableUsersDevices}.device_id = ? AND ${tableUsersDevices}.is_deleted = ?`,
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
    const { id: userId } = await customersModel.register(
      conn,
      connPromise,
      {
        name,
        level_id: 6,
        publish: 1,
        parent_id,
        username,
        password,
        role_id: 1,
      },
      false
    );
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
      { device_status_id: 4 },
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
    return [];
  }
}

module.exports = new DeviceModel();
