const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const DeviceModel = require("../models/device.model");
const UsersDevices = require("../models/usersDevices.model");
const { ERROR, ALREADY_EXITS } = require("../constants");
const { BusinessLogicError } = require("../core/error.response");
const tableName = "tbl_device";
const tableModel = "tbl_model";
const tableOrders = "tbl_orders";
const tableOrdersDevice = "tbl_orders_device";
const tableCustomers = "tbl_customers";
const tableModelType = "tbl_model_type";
const tableUsersDevice = "tbl_users_devices";
const tableUsersCustomers = "tbl_users_customers";
const tableFirmware = "tbl_firmware";
const tableLevel = "tbl_level";

class DeviceService extends DatabaseService {
  constructor() {
    super();
  }

  async validate(conn, devId, imei, id = null) {
    let where = `(dev_id = ? OR imei = ?) AND is_deleted = ?`;
    const conditions = [devId, imei, 0];

    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await this.select(
      conn,
      tableName,
      "dev_id,imei",
      where,
      conditions
    );
    if (dataCheck.length <= 0) return { result: true };

    const errors = dataCheck.map((item) => {
      if (item.dev_id) {
        return {
          value: devId,
          msg: `Mã đầu ghi ${ALREADY_EXITS}`,
          param: "dev_id",
        };
      } else if (item.imei) {
        return {
          value: imei,
          msg: `Imei ${ALREADY_EXITS}`,
          param: "imei",
        };
      }
    });

    return {
      result: false,
      errors: {
        msg: ERROR,
        errors,
      },
    };
  }

  //getallrow
  async getallrows(query, customerId) {
    try {
      const offset = query.offset || 0;
      const limit = query.limit || 10;

      const {
        is_deleted,
        keyword,
        model_id,
        start_warranty_expired_on,
        end_warranty_expired_on,
        start_activation_date,
        end_activation_date,
      } = query;

      const isDeleted = is_deleted || 0;
      let where = `${tableName}.is_deleted = ? AND c.id = ?`;
      const conditions = [isDeleted, customerId];

      if (keyword) {
        where += ` AND (${tableName}.dev_id LIKE ? OR ${tableName}.imei LIKE ? OR ${tableOrders}.code LIKE ? OR ${tableCustomers}.name LIKE ?)`;
        conditions.push(
          `%${keyword}%`,
          `%${keyword}%`,
          `%${keyword}%`,
          `%${keyword}%`
        );
      }

      if (model_id) {
        where += ` AND ${tableName}.model_id = ?`;
        conditions.push(model_id);
      }

      if (start_warranty_expired_on && end_warranty_expired_on) {
        where += ` AND ${tableName}.warranty_expired_on BETWEEN ? AND ?`;
        conditions.push(start_warranty_expired_on, end_warranty_expired_on);
      }

      if (start_activation_date && end_activation_date) {
        where += ` AND ${tableName}.activation_date BETWEEN ? AND ?`;
        conditions.push(start_activation_date, end_activation_date);
      }

      const joinTable = `${tableName} INNER JOIN ${tableModel} ON ${tableName}.model_id = ${tableModel}.id 
        INNER JOIN ${tableUsersDevice} ON ${tableName}.id = ${tableUsersDevice}.device_id 
        INNER JOIN ${tableUsersCustomers} ON ${tableUsersDevice}.user_id = ${tableUsersCustomers}.user_id 
        INNER JOIN ${tableCustomers} c ON ${tableUsersCustomers}.customer_id = c.id 
        LEFT JOIN ${tableOrdersDevice} ON ${tableName}.id = ${tableOrdersDevice}.device_id 
        LEFT JOIN ${tableOrders} ON ${tableOrdersDevice}.orders_id = ${tableOrders}.id 
        LEFT JOIN ${tableCustomers} ON ${tableOrders}.reciver = ${tableCustomers}.id 
        LEFT JOIN ${tableFirmware} ON ${tableModel}.id = ${tableFirmware}.model_id`;

      const select = `${tableName}.id,${tableName}.dev_id,${tableName}.imei,${tableModel}.name as model_name,
      ${tableFirmware}.version_hardware,${tableFirmware}.version_software,COALESCE(${tableFirmware}.updated_at,${tableFirmware}.created_at) as time_update_version,${tableOrders}.code,
      ${tableCustomers}.name as customer_name,${tableName}.warranty_expired_on,${tableName}.activation_date,${tableName}.created_at,${tableName}.updated_at`;

      const { conn } = await db.getConnection();
      const [res_, count] = await Promise.all([
        this.select(
          conn,
          joinTable,
          select,
          where,
          conditions,
          `${tableName}.id`,
          "DESC",
          offset,
          limit
        ),
        this.count(conn, joinTable, "*", where, conditions),
      ]);

      const totalPage = Math.ceil(count?.[0]?.total / limit);

      conn.release();
      return { data: res_, totalPage };
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params, query, customerId) {
    // console.log("customerId", customerId);
    try {
      const { id } = params;
      const isDeleted = query.is_deleted || 0;
      const where = `${tableName}.is_deleted = ? AND ${tableName}.id = ? AND c.id = ?`;
      const conditions = [isDeleted, id, customerId];

      const joinTable = `${tableName} INNER JOIN ${tableModel} ON ${tableName}.model_id = ${tableModel}.id 
      INNER JOIN ${tableUsersDevice} ON ${tableName}.id = ${tableUsersDevice}.device_id 
      INNER JOIN ${tableUsersCustomers} ON ${tableUsersDevice}.user_id = ${tableUsersCustomers}.user_id 
      INNER JOIN ${tableCustomers} c ON ${tableUsersCustomers}.customer_id = c.id 
      LEFT JOIN ${tableFirmware} ON ${tableModel}.id = ${tableFirmware}.model_id`;

      const selectData = `${tableName}.id,${tableName}.dev_id,${tableName}.imei,${tableName}.model_id,
        ${tableName}.serial,${tableName}.device_name,${tableFirmware}.version_hardware,${tableFirmware}.version_software,
        ${tableName}.device_status_id,${tableName}.package_service_id,${tableName}.expired_on,${tableName}.vehicle_type_id,${tableName}.note`;

      const { conn } = await db.getConnection();
      const res_ = await this.select(
        conn,
        joinTable,
        selectData,
        where,
        conditions
      );
      conn.release();
      return res_;
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //Register
  async register(body, userId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { dev_id, imei, model_id, serial, note } = body;

        const isCheck = await this.validate(conn, dev_id, imei);
        if (!isCheck.result) {
          conn.release();
          throw isCheck.errors;
        }

        await connPromise.beginTransaction();

        const device = new DeviceModel({
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
          tableName,
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
          tableUsersDevice,
          "user_id,device_id,is_deleted,is_main,is_moved,created_at",
          [[userId, res_, 0, 1, 0, Date.now()]],
          "is_deleted=VALUES(is_deleted)"
        );

        await connPromise.commit();

        conn.release();
        device.id = res_;
        delete device.is_deleted;
        return device;
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  async reference(params, parentId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { id } = params;

        const joinTable = `${tableUsersDevice} INNER JOIN ${tableUsersCustomers} ON ${tableUsersDevice}.user_id = ${tableUsersCustomers}.user_id 
          INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id 
          INNER JOIN ${tableLevel} ON ${tableCustomers}.level_id = ${tableLevel}.id`;

        const data = await this.select(
          conn,
          joinTable,
          `${tableUsersDevice}.user_id,COALESCE(${tableCustomers}.company,${tableCustomers}.name) as customer_name,${tableLevel}.name as level_name`,
          `${tableUsersDevice}.device_id = ? AND ${tableUsersDevice}.is_deleted = ?`,
          [id, 0],
          `${tableUsersDevice}.id`,
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
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //check
  async check(params) {
    const { imei } = params;
  }

  //update
  async updateById(body, params) {
    try {
      const { dev_id, imei, model_id, serial, device_status_id, note } = body;
      const { id } = params;

      const { conn } = await db.getConnection();

      const isCheck = await this.validate(conn, dev_id, imei, id);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const device = new DeviceModel({
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

      await this.update(conn, tableName, device, "id", id);
      conn.release();
      device.id = id;
      return device;
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //delete
  async deleteById(params) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        await connPromise.beginTransaction();

        await this.update(conn, tableName, { is_deleted: 1 }, "id", id);
        await this.update(
          conn,
          tableUsersDevice,
          { is_deleted: 1 },
          "device_id",
          id
        );
        await connPromise.commit();
        conn.release();
        return [];
      } catch (error) {
        connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new DeviceService();
