const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const OrdersModel = require("../models/orders.model");
const {
  ERROR,
  ALREADY_EXITS,
  ALREADY_EXITS_ORDERS,
  NOT_EXITS,
} = require("../constants");
const tableName = "tbl_orders";
const tabbleOrdersDevice = "tbl_orders_device";
const tableDevice = "tbl_device";
const tableUsers = "tbl_users";
const tableRole = "tbl_role";
const tableCustomers = "tbl_customers";
const tableUsersCustomers = "tbl_users_customers";
const tableUsersRole = "tbl_users_role";

class OrdersService extends DatabaseService {
  constructor() {
    super();
  }

  async validate(conn, code, listDevice = [], id = null) {
    const errors = [];

    let where = `code = ? AND ${tableName}.is_deleted = ?`;
    const conditions = [code, 0];

    const joinTable = `${tableName} INNER JOIN ${tabbleOrdersDevice} ON ${tableName}.id = ${tabbleOrdersDevice}.orders_id INNER JOIN ${tableDevice} ON ${tabbleOrdersDevice}.device_id = ${tableDevice}.id`;
    let whereDeviceInOrders = `${tabbleOrdersDevice}.device_id IN (?) AND ${tableName}.is_deleted = ?`;
    const conditionsDeviceInOrders = [listDevice.join(","), 0];

    const whereDevice = `${tableDevice}.id IN (?) AND ${tableDevice}.is_deleted = ?`;
    const conditionsDevice = [listDevice.join(","), 0];

    if (id) {
      where += ` AND ${tableName}.id <> ?`;
      conditions.push(id);

      whereDeviceInOrders += ` AND ${tableName}.id <> ?`;
      conditionsDeviceInOrders.push(id);
    }

    const [dataCheckCode, dataCheckDeviceInOrders, dataDevice] =
      await Promise.all([
        this.select(conn, tableName, `id`, where, conditions),
        this.select(
          conn,
          joinTable,
          `${tableDevice}.imei`,
          whereDeviceInOrders,
          conditionsDeviceInOrders,
          `${tableName}.id`
        ),
        this.select(
          conn,
          tableDevice,
          `${tableDevice}.id,${tableDevice}.imei`,
          whereDevice,
          conditionsDevice,
          `${tableDevice}.id`
        ),
      ]);

    if (
      dataCheckCode.length <= 0 &&
      dataCheckDeviceInOrders.length <= 0 &&
      dataDevice.length > 0 &&
      dataDevice.length === listDevice.length
    )
      return { result: true };

    if (dataDevice.length <= 0) {
      errors.push({
        value: listDevice,
        msg: `Tất cả thiết bị ${NOT_EXITS}`,
        param: "device_id",
      });
    }

    if (dataDevice.length && dataDevice.length !== listDevice.length) {
      const deviceNotExit = [];
      listDevice.forEach((item) => {
        let isExit = false;
        dataDevice.forEach((item1) => {
          if (Number(item) === Number(item1.id)) {
            isExit = true;
          }
        });
        if (!isExit) {
          deviceNotExit.push(item);
        }
      });

      if (deviceNotExit.length) {
        errors.push({
          value: listDevice,
          msg: `Thiết bị có id ${deviceNotExit.join("")} ${NOT_EXITS}`,
          param: "device_id",
        });
      }
    }

    if (dataCheckCode.length) {
      errors.push({
        value: name,
        msg: `Tên ${ALREADY_EXITS}`,
        param: "name",
      });
    }

    if (dataCheckDeviceInOrders.length) {
      const listDeviceExit = dataCheckDeviceInOrders.map((item) => item.imei);
      errors.push({
        value: listDevice,
        msg: `IMEI ${listDeviceExit.join(",")} ${ALREADY_EXITS_ORDERS}`,
        param: "device_id",
      });
    }

    return { result: false, errors: { msg: ERROR, errors } };
  }

  // async validateMerge(conn, listOrders = []) {
  //   const errors = [];

  //   const where = `id IN (?)`;
  //   const conditions = [listOrders.join(",")];

  //   const dataOrdersExits = await this.select(
  //     conn,
  //     tableName,
  //     "id,reciver",
  //     where,
  //     conditions
  //   );

  //   if (dataOrdersExits.length <= 0) {
  //     errors.push({
  //       value: listOrders,
  //       msg: `Tất cả đơn hàng ${NOT_EXITS}`,
  //       param: "orders_id",
  //     });
  //   }

  //   if (
  //     dataOrdersExits.length &&
  //     listOrders.length !== dataOrdersExits.length
  //   ) {
  //     const ordersNotExit = [];
  //     let isSameReciver = true
  //     listOrders.forEach((item) => {
  //       let isExit = false;
  //       dataOrdersExits.forEach((item1) => {
  //         if (Number(item) === Number(item1.id)) {
  //           isExit = true;
  //         }
  //       });
  //       if (!isExit) {
  //         ordersNotExit.push(item);
  //       }
  //     });

  //     if (ordersNotExit.length) {
  //       errors.push({
  //         value: listOrders,
  //         msg: `Đơn hàng có id ${ordersNotExit.join("")} ${NOT_EXITS}`,
  //         param: "orders_id",
  //       });
  //     }
  //   }
  // }

  //getallrow
  async getallrows(query) {
    try {
      const offset = query.offset || 0;
      const limit = query.limit || 10;

      const { is_deleted, keyword, orders_status_id, customer_id } = query;
      const isDeleted = is_deleted || 0;
      let where = `${tableName}.is_deleted = ?`;
      const conditions = [isDeleted];

      if (keyword) {
        where += ` AND (code LIKE ? OR ${tableCustomers}.name LIKE ? OR c.anme LIKE ? OR c.company LIKE ? OR ${tableUsers}.username LIKE ?)`;
        conditions.push(
          `%${keyword}%`,
          `%${keyword}%`,
          `%${keyword}%`,
          `%${keyword}%`,
          `%${keyword}%`
        );
      }

      if (orders_status_id) {
        where += ` AND ${tableName}.orders_status_id = ?`;
        conditions.push(orders_status_id);
      }

      if (customer_id) {
        where += ` AND ${tableName}.reciver = ?`;
        conditions.push(customer_id);
      }

      // const joinTable = `${tableName} INNER JOIN ${tableCustomers} ON ${tableName}.reciver = ${tableCustomers}.id
      // INNER JOIN ${tableUsersCustomers} ON ${tableName}.creator = ${tableUsersCustomers}.user_id
      // INNER JOIN ${tableCustomers} c ON ${tableUsersCustomers}.customer_id = c.id
      // INNER JOIN ${tableUsers} ON ${tableName}.creator = ${tableUsers}.id
      // INNER JOIN ${tableUsersRole} ON ${tableName}.creator = ${tableUsersRole}.user_id
      // INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id`;

      const joinTable = `${tableName} INNER JOIN ${tableCustomers} ON ${tableName}.reciver = ${tableCustomers}.id 
      INNER JOIN ${tableCustomers} c ON ${tableName}.creator_customer_id = c.id 
      INNER JOIN ${tableUsers} ON ${tableName}.creator_user_id = ${tableUsers}.id`;

      const select = `${tableName}.code,${tableName}.quantity,COALESCE(${tableCustomers}.company, ${tableCustomers}.name) as reciver,COALESCE(c.company, c.name) as creator_customer,${tableUsers}.username as ceator_user,${tableName}.orders_status_id,${tableName}.created_at,${tableName}.updated_at`;
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
      const where = `${tableName}.is_deleted = ? AND ${tableName}.id = ?`;
      const conditions = [isDeleted, id];

      const joinTable = `${tableName} INNER JOIN ${tabbleOrdersDevice} ON ${tableName}.id = ${tabbleOrdersDevice}.orders_id 
        INNER JOIN ${tableDevice} ON ${tabbleOrdersDevice}.device_id = ${tableDevice}.id
        INNER JOIN ${tableUsersCustomers} ON ${tableName}.creator = ${tableUsersCustomers}.user_id 
        INNER JOIN ${tableCustomers} c ON ${tableUsersCustomers}.customer_id = c.id 
        INNER JOIN ${tableUsers} ON ${tableName}.creator = ${tableUsers}.id
        INNER JOIN ${tableUsersRole} ON ${tableName}.creator = ${tableUsersRole}.user_id 
        INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id`;

      const selectData = `${tableName}.id,${tableName}.code,${tableName}.reciver,${tableName}.note,${tableName}.orders_status_id,
        JSON_ARRAYAGG(JSON_OBJECT('id', ${tableDevice}.id,'imei', ${tableDevice}.imei)) AS devices,
        CONCAT(${tableUsers}.username,"(",${tableRole}.name,") ",COALESCE(c.company, c.name)) as ceator_name,${tableUsers}.id as creator_id`;

      const { conn } = await db.getConnection();
      const res_ = await this.select(
        conn,
        joinTable,
        selectData,
        `${where} GROUP BY ${tableName}.id,${tableName}.code`,
        conditions,
        `${tableName}.id`
      );
      conn.release();
      return res_;
    } catch (error) {
      throw error;
    }
  }

  //Register
  async register(body, userId, customerId) {
    const { conn, connPromise } = await db.getConnection();
    try {
      const { code, device_id, reciver, note } = body;

      const listDevice = JSON.parse(device_id);
      const orders = new OrdersModel({
        code,
        creator_user_id: userId,
        creator_customer_id: customerId,
        reciver,
        quantity: listDevice?.length,
        orders_status_id: 1,
        note: note || null,
        is_deleted: 0,
        created_at: Date.now(),
      });
      delete orders.updated_at;

      const isCheck = await this.validate(conn, code, listDevice);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      await connPromise.beginTransaction();

      const res_ = await this.insert(conn, tableName, orders);

      const dataInsertDevice = listDevice.map((item) => [res_, item]);
      await this.insertMulti(
        conn,
        tabbleOrdersDevice,
        "orders_id,device_id",
        dataInsertDevice
      );

      await connPromise.commit();

      conn.release();
      orders.id = res_;
      delete orders.is_deleted;
      return orders;
    } catch (error) {
      await connPromise.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  //merge
  // async merge(body) {
  //   const { conn, connPromise } = await db.getConnection();
  //   try {
  //     const { code, orders_id, reciver, note } = body;

  //     // const listDevice = JSON.parse(device_id);
  //     const orders = new OrdersModel({
  //       code,
  //       creator: userId,
  //       reciver,
  //       quantity: listDevice?.length,
  //       orders_status_id: 1,
  //       note: note || null,
  //       is_deleted: 0,
  //       created_at: Date.now(),
  //     });
  //     delete orders.updated_at;

  //     const isCheck = await this.validate(conn, code, listDevice);
  //     if (!isCheck.result) {
  //       conn.release();
  //       throw isCheck.errors;
  //     }

  //     await connPromise.beginTransaction();

  //     const res_ = await this.insert(conn, tableName, orders);

  //     const dataInsertDevice = listDevice.map((item) => [res_, item]);
  //     await this.insertMulti(
  //       conn,
  //       tabbleOrdersDevice,
  //       "orders_id,device_id",
  //       dataInsertDevice
  //     );

  //     await connPromise.commit();

  //     conn.release();
  //     orders.id = res_;
  //     delete orders.is_deleted;
  //     return orders;
  //   } catch (error) {
  //     await connPromise.rollback();
  //     throw error;
  //   } finally {
  //     conn.release();
  //   }
  // }

  //update
  async updateById(body, params) {
    const { conn, connPromise } = await db.getConnection();
    try {
      const { code, device_id, reciver, note } = body;

      const listDevice = JSON.parse(device_id);
      const { id } = params;

      const isCheck = await this.validate(conn, code, listDevice, id);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const orders = new OrdersModel({
        code,
        reciver,
        quantity: listDevice?.length,
        note: note || null,
        updated_at: Date.now(),
      });
      // console.log(id)
      delete orders.creator_customer_id;
      delete orders.creator_user_id;
      delete orders.created_at;
      delete orders.orders_status_id;
      delete orders.is_deleted;

      await connPromise.beginTransaction();

      await this.update(conn, tableName, orders, "id", id);

      await this.delete(
        conn,
        tabbleOrdersDevice,
        `orders_id = ? AND device NOT IN (?)`,
        [id, listDevice.join(",")],
        "ID",
        false
      );

      const dataInsert = listDevice?.map((item) => [id, item]);
      await this.insertIgnore(
        conn,
        tabbleOrdersDevice,
        "orders_id,device_id",
        dataInsert
      );

      await connPromise.commit();

      conn.release();
      orders.id = id;
      return orders;
    } catch (error) {
      await connPromise.rollback();
      throw error;
    } finally {
      conn.release();
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

module.exports = new OrdersService();
