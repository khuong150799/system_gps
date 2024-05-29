const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const DeviceModel = require("../models/device.model");
const { ERROR, ALREADY_EXITS } = require("../constants");
const tableName = "tbl_device";
const tableModel = "tbl_model";
const tableOrders = "tbl_orders";
const tableOrdersDevice = "tbl_orders_device";
const tableCustomers = "tbl_customers";
const tableModelType = "tbl_model_type";

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
  async getallrows(query) {
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
      let where = `${tableName}.is_deleted = ?`;
      const conditions = [isDeleted];

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
        LEFT JOIN ${tableOrdersDevice} ON ${tableName}.id = ${tableOrdersDevice}.device_id 
        LEFT JOIN ${tableOrders} ON ${tableOrdersDevice}.orders_id = ${tableOrders}.id 
        LEFT JOIN ${tableCustomers} ON ${tableOrders}.reciver = ${tableCustomers}.id`;

      const select = `${tableName}.id,${tableName}.dev_id,${tableName}.imei,${tableModel}.name as model_name,
      ${tableName}.version_hardware,${tableName}.version_software,${tableName}.times_update_version,${tableOrders}.code,
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
      throw error;
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { id } = params;
      const isDeleted = query.is_deleted || 0;
      const where = `is_deleted = ? AND id = ?`;
      const conditions = [isDeleted, id];
      const selectData = `id,dev_id,imei,model_id,serial,device_name,version_hardware,version_software,device_status_id,package_service_id,expired_on,vehicle_type_id,note`;

      const { conn } = await db.getConnection();
      const res_ = await this.select(
        conn,
        tableName,
        selectData,
        where,
        conditions
      );
      conn.release();
      return res_;
    } catch (error) {
      throw error;
    }
  }

  //Register
  async register(body) {
    try {
      const { dev_id, imei, model_id, serial, note } = body;
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
      delete device.version_hardware;
      delete device.version_software;
      delete device.package_service_id;
      delete device.expired_on;
      delete device.activation_date;
      delete device.warranty_expired_on;
      delete device.vehicle_type_id;
      delete device.updated_at;

      const { conn } = await db.getConnection();
      const isCheck = await this.validate(conn, dev_id, imei);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }
      const res_ = await this.insert(conn, tableName, device);
      conn.release();
      device.id = res_;
      delete device.is_deleted;
      return device;
    } catch (error) {
      throw error;
    }
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
      delete device.version_hardware;
      delete device.version_software;
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
      throw error;
    }
  }

  //delete
  async deleteById(params) {
    try {
      const { id } = params;
      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { is_deleted: 1 }, "id", id);
      conn.release();
      return [];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DeviceService();
