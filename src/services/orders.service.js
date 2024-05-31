const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const OrdersModel = require("../models/orders.model");
const {
  ERROR,
  ALREADY_EXITS,
  ALREADY_EXITS_ORDERS,
  NOT_EXITS,
  DIFFERENT_RECIVER_ORDERS,
  NOT_EMPTY,
  STRUCTURE_ORDERS_FAIL,
  NOT_ACTIVE_ACCOUNT,
  DELETED_ACCOUNT,
  IS_ACTIVED,
} = require("../constants");
const { BusinessLogicError } = require("../core/error.response");
const { makeCode } = require("../ultils/makeCode");
const tableName = "tbl_orders";
const tabbleOrdersDevice = "tbl_orders_device";
const tableDevice = "tbl_device";
const tableUsers = "tbl_users";
const tableRole = "tbl_role";
const tableCustomers = "tbl_customers";
const tableUsersCustomers = "tbl_users_customers";
const tableUsersRole = "tbl_users_role";
const tableUsersDevice = "tbl_users_devices";

class OrdersService extends DatabaseService {
  constructor() {
    super();
  }

  async validate(conn, code, listDevice = [], reciver = null, id = null) {
    const errors = [];

    if (listDevice.length <= 0) {
      errors.push({ value: listDevice, msg: NOT_EMPTY, param: "devices_id" });
    }

    if (errors.length) return { result: false, errors: { msg: ERROR, errors } };

    let where = `code = ? AND ${tableName}.is_deleted = ?`;
    const conditions = [code, 0];

    // const joinTable = `${tableName} INNER JOIN ${tabbleOrdersDevice} ON ${tableName}.id = ${tabbleOrdersDevice}.orders_id INNER JOIN ${tableDevice} ON ${tabbleOrdersDevice}.device_id = ${tableDevice}.id`;
    // let whereDeviceInOrders = `${tabbleOrdersDevice}.device_id IN (?) AND ${tableName}.is_deleted = ?`;
    // const conditionsDeviceInOrders = [listDevice, 0];

    const selectDevice = `${tableDevice}.id,${tableDevice}.imei,${tableDevice}.activation_date`;
    const whereDevice = `${tableDevice}.id IN (?) AND ${tableDevice}.is_deleted = ?`;
    const conditionsDevice = [listDevice, 0];

    if (id) {
      where += ` AND ${tableName}.id <> ?`;
      conditions.push(id);

      // whereDeviceInOrders += ` AND ${tableName}.id <> ?`;
      // conditionsDeviceInOrders.push(id);
    }

    const [
      dataCheckCode,
      dataUserOfDevice,
      //  dataCheckDeviceInOrders,
      dataDevice,
    ] = await Promise.all([
      this.select(conn, tableName, `id`, where, conditions),
      this.select(
        conn,
        tableUsersDevice,
        "id",
        "device_id IN (?) AND is_main = ?",
        [listDevice, 1]
      ),
      // this.select(
      //   conn,
      //   joinTable,
      //   `${tableDevice}.imei`,
      //   `${whereDeviceInOrders} GROUP BY ${tableName}.id`,
      //   conditionsDeviceInOrders,
      //   `${tableName}.id`
      // ),
      this.select(
        conn,
        tableDevice,
        selectDevice,
        whereDevice,
        conditionsDevice,
        `${tableDevice}.id`
      ),
    ]);
    let dataInfo = [];
    if (reciver) {
      const joinTable = `${tableUsersCustomers} INNER JOIN ${tableUsers} ON ${tableUsersCustomers}.user_id = ${tableUsers}.id`;
      dataInfo = await this.select(
        conn,
        joinTable,
        `${tableUsers}.id,${tableUsers}.is_actived,${tableUsers}.is_deleted`,
        `${tableUsersCustomers}.customer_id = ?`,
        [reciver],
        `${tableUsersCustomers}.id`
      );

      if (dataInfo.length <= 0) {
        errors.push({
          value: reciver,
          msg: `Tài khoản ${NOT_EXITS}`,
          param: "reciver",
        });
      } else if (dataInfo[0].is_actived === 0) {
        errors.push({
          value: reciver,
          msg: NOT_ACTIVE_ACCOUNT,
          param: "reciver",
        });
      } else if (dataInfo[0].is_deleted === 1) {
        errors.push({
          value: reciver,
          msg: DELETED_ACCOUNT,
          param: "reciver",
        });
      }
    }

    if (errors.length) return { result: false, errors: { msg: ERROR, errors } };

    if (
      dataCheckCode.length <= 0 &&
      // dataCheckDeviceInOrders.length <= 0 &&
      dataDevice.length > 0 &&
      dataDevice.length === listDevice.length
    )
      return { result: true, data: { dataInfo, dataUserOfDevice } };

    if (dataDevice.length <= 0) {
      errors.push({
        value: listDevice,
        msg: `Tất cả thiết bị ${NOT_EXITS}`,
        param: "devices_id",
      });
    } else if (dataDevice.length && dataDevice.length !== listDevice.length) {
      const deviceNotExit = [];
      const deviceActived = [];
      listDevice.forEach((item, i) => {
        let isExit = false;
        dataDevice.forEach((item1) => {
          if (Number(item) === Number(item1.id)) {
            isExit = true;
          }
          if (i === 0 && item1.activation_date) {
            deviceActived.push(item1.imei);
          }
        });
        if (!isExit) {
          deviceNotExit.push(item);
        }
      });

      if (deviceNotExit.length) {
        errors.push({
          value: listDevice,
          msg: `Thiết bị có id ${deviceNotExit.join(",")} ${NOT_EXITS}`,
          param: "devices_id",
        });
      } else if (deviceActived.length) {
        errors.push({
          value: listDevice,
          msg: `Thiết bị ${deviceActived.join(",")} ${IS_ACTIVED}`,
          param: "devices_id",
        });
      }
    }

    if (dataCheckCode.length) {
      errors.push({
        value: code,
        msg: `Mã đơn hàng ${ALREADY_EXITS}`,
        param: "code",
      });
    }

    // if (dataCheckDeviceInOrders.length) {
    //   const listDeviceExit = dataCheckDeviceInOrders.map((item) => item.imei);
    //   errors.push({
    //     value: listDevice,
    //     msg: `IMEI ${listDeviceExit.join(",")} ${ALREADY_EXITS_ORDERS}`,
    //     param: "devices_id",
    //   });
    // }

    return { result: false, errors: { msg: ERROR, errors } };
  }

  async validateMerge(conn, listOrders = [], reciver) {
    const errors = [];

    if (listOrders.length <= 0) {
      errors.push({ value: listOrders, msg: NOT_EMPTY, param: "orders_code" });
    }

    if (errors.length) return { result: false, errors: { msg: ERROR, errors } };

    const joinTable = `${tableUsersCustomers} INNER JOIN ${tableUsers} ON ${tableUsersCustomers}.user_id = ${tableUsers}.id`;
    const dataInfo = await this.select(
      conn,
      joinTable,
      `${tableUsers}.id,${tableUsers}.is_actived,${tableUsers}.is_deleted`,
      `${tableUsersCustomers}.customer_id = ?`,
      [reciver],
      `${tableUsersCustomers}.id`
    );

    if (dataInfo?.length <= 0) {
      errors.push({
        value: reciver,
        msg: `Tài khoản ${NOT_EXITS}`,
        param: "reciver",
      });
    } else if (dataInfo[0].is_actived === 0) {
      errors.push({
        value: reciver,
        msg: NOT_ACTIVE_ACCOUNT,
        param: "reciver",
      });
    } else if (dataInfo[0].is_deleted === 1) {
      errors.push({
        value: reciver,
        msg: DELETED_ACCOUNT,
        param: "reciver",
      });
    }

    if (errors.length) return { result: false, errors: { msg: ERROR, errors } };

    const where = `code IN (?) AND is_deleted = 0`;
    const conditions = [listOrders];

    const dataOrdersExits = await this.select(
      conn,
      tableName,
      "id,code,reciver,quantity",
      where,
      conditions
    );

    if (dataOrdersExits.length <= 0) {
      errors.push({
        value: listOrders,
        msg: `Tất cả đơn hàng ${NOT_EXITS}`,
        param: "orders_code",
      });
    }

    const ordersNotExit = [];
    let isSameReciver = true;
    listOrders.forEach((item) => {
      let isExit = false;
      dataOrdersExits.forEach((item1) => {
        if (!isExit && item.toString() === item1.code.toString()) {
          isExit = true;
        }
        if (isSameReciver && Number(reciver) !== Number(item1.reciver)) {
          isSameReciver = false;
        }
      });
      if (!isExit) {
        ordersNotExit.push(item);
      }
    });
    if (ordersNotExit.length) {
      errors.push({
        value: listOrders,
        msg: `Đơn hàng có mã ${ordersNotExit.join(",")} ${NOT_EXITS}`,
        param: "orders_code",
      });
    }

    if (!isSameReciver) {
      errors.push({
        value: listOrders,
        msg: DIFFERENT_RECIVER_ORDERS,
        param: "orders_code",
      });
    }
    if (errors.length) {
      return { result: false, errors: { msg: ERROR, errors } };
    }

    return { result: true, data: dataOrdersExits };
  }

  async validateRecivers(conn, listCustomer) {
    const errors = [];

    if (listCustomer.length <= 0) {
      errors.push({ value: listCustomer, msg: NOT_EMPTY, param: "recivers" });
    }

    if (errors.length) return { result: false, errors: { msg: ERROR, errors } };

    const joinTable = `${tableCustomers} INNER JOIN ${tableUsersCustomers} ON ${tableCustomers}.id = ${tableUsersCustomers}.customer_id INNER JOIN ${tableUsers} ON ${tableUsersCustomers}.user_id = ${tableUsers}.id`;
    const select = `${tableUsers}.parent_id`;
    const where = `${tableCustomers}.id = ?`;

    const arrayPromise = listCustomer.reduce((result, item, i) => {
      if (i > 0) {
        result = [
          ...result,
          this.select(
            conn,
            joinTable,
            select,
            where,
            item,
            `${tableCustomers}.id`
          ),
        ];
      }

      return result;
    }, []);

    const dataInfo = await Promise.all(arrayPromise);
    const arrayPromiseParent = dataInfo.map((item) =>
      this.select(
        conn,
        joinTable,
        `${tableCustomers}.id`,
        `${tableUsers}.id = ?`,
        item[0].parent_id,
        `${tableCustomers}.id`
      )
    );

    const dataInfoParent = await Promise.all(arrayPromiseParent);
    const checkStructureRecivers = dataInfoParent.some(
      (item, i) => Number(item[0].id) !== Number(listCustomer[i])
    );
    if (checkStructureRecivers) {
      errors.push({
        value: listCustomer,
        msg: STRUCTURE_ORDERS_FAIL,
        param: "recivers",
      });
    }

    if (errors.length) {
      return {
        result: false,
        errors: {
          msg: ERROR,
          errors,
        },
      };
    }
    return { result: true };
  }

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

      const select = `${tableName}.id,${tableName}.code,${tableName}.quantity,COALESCE(${tableCustomers}.company, ${tableCustomers}.name) as reciver,COALESCE(c.company, c.name) as creator_customer,${tableUsers}.username as ceator_user,${tableName}.orders_status_id,${tableName}.created_at,${tableName}.updated_at`;
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
  async getById(params, query) {
    try {
      const { id } = params;
      const isDeleted = query.is_deleted || 0;
      const where = `${tableName}.is_deleted = ? AND ${tableName}.id = ?`;
      const conditions = [isDeleted, id];

      const joinTable = `${tableName} INNER JOIN ${tabbleOrdersDevice} ON ${tableName}.id = ${tabbleOrdersDevice}.orders_id 
        INNER JOIN ${tableDevice} ON ${tabbleOrdersDevice}.device_id = ${tableDevice}.id`;

      const selectData = `${tableName}.id,${tableName}.code,${tableName}.reciver,${tableName}.note,${tableName}.orders_status_id,
        JSON_ARRAYAGG(JSON_OBJECT('id', ${tableDevice}.id,'imei', ${tableDevice}.imei)) AS devices`;

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
      throw new BusinessLogicError(error.msg);
    }
  }

  //Register
  async register(body, userId, customerId) {
    const { conn, connPromise } = await db.getConnection();
    try {
      const { code, devices_id, reciver, note } = body;

      const listDevice = JSON.parse(devices_id);
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

      const isCheck = await this.validate(conn, code, listDevice, reciver);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      await connPromise.beginTransaction();

      const res_ = await this.insert(conn, tableName, orders);

      const { dataInfo, dataUserOfDevice } = isCheck.data;
      const { id: userIdReciver } = dataInfo[0];

      let dataUserOfDeviceId = [];
      if (dataUserOfDevice.length) {
        dataUserOfDeviceId = dataUserOfDevice.map((item) => item.id);
      }

      const dataInsert = listDevice.reduce(
        (result, item) => {
          result.ordersDevices = [...result.ordersDevices, [res_, item]];
          if (dataUserOfDeviceId.includes(item)) {
            const dataUpdate = {
              conditionField: "device_id",
              conditionValue: item,
              updateValue: userId,
            };
            result.usersDevicesUpdate = [
              ...result.usersDevicesUpdate,
              dataUpdate,
            ];
          } else {
            result.usersDevicesInsert = [
              ...result.usersDevicesInsert,
              [userIdReciver, item, Date.now()],
            ];
          }
          return result;
        },
        { ordersDevices: [], usersDevicesInsert: [], usersDevicesUpdate: [] }
      );

      const conditionUpdateQuantityProduct = Object.keys(calc.warehouse).map(
        (item, i) => {
          const calcWarehouse =
            Number(calc.warehouse[item]) - Number(parseQuanity[item]);

          return {
            conditionField: "id",
            conditionValue: item,
            updateValue: calcWarehouse,
          };
        }
      );
      const dataUpdateQuantityProduct = [
        {
          field: "warehouse",
          conditions: conditionUpdateQuantityProduct,
        },
      ];

      const { ordersDevices, usersDevices } = dataInsert;
      await this.insertMulti(
        conn,
        tabbleOrdersDevice,
        "orders_id,device_id",
        ordersDevices
      );

      await connPromise.commit();

      conn.release();
      orders.id = res_;
      delete orders.is_deleted;
      return orders;
    } catch (error) {
      await connPromise.rollback();
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    } finally {
      conn.release();
    }
  }

  //merge
  async merge(body, userId, customerId) {
    const { conn, connPromise } = await db.getConnection();
    try {
      const { code, orders_code, reciver, note } = body;

      const listOrdersCode = JSON.parse(orders_code);

      const isCheck = await this.validateMerge(conn, listOrdersCode, reciver);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const dataOrdersDb = isCheck.data;

      const { quantity, listOrdersId } = dataOrdersDb.reduce(
        (result, item) => {
          result.quantity += item.quantity;
          result.listOrdersId = [...result.listOrdersId, item.id];
          return result;
        },
        { quantity: 0, listOrdersId: [] }
      );

      if (quantity === 0 || listOrdersId.length === 0) throw { msg: ERROR };

      await connPromise.beginTransaction();

      const orders = new OrdersModel({
        code,
        creator_user_id: userId,
        creator_customer_id: customerId,
        reciver,
        quantity,
        orders_status_id: 1,
        note: note || null,
        is_deleted: 0,
        created_at: Date.now(),
      });
      delete orders.updated_at;

      await this.update(
        conn,
        tableName,
        {
          is_deleted: 1,
          note: `Đơn hàng được merge vào đơn hàng mới có mã ${code}`,
        },
        "code",
        listOrdersCode
      );

      const res_ = await this.insert(conn, tableName, orders);
      await this.update(
        conn,
        tabbleOrdersDevice,
        { orders_id: res_ },
        "orders_id",
        listOrdersId
      );

      await connPromise.commit();

      conn.release();
      orders.id = res_;
      delete orders.is_deleted;
      return orders;
    } catch (error) {
      await connPromise.rollback();
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    } finally {
      conn.release();
    }
  }

  //Register tree
  async registerTree(body, userId) {
    const { conn, connPromise } = await db.getConnection();
    try {
      const { code, devices_id, recivers, note } = body;

      const listDevice = JSON.parse(devices_id);
      const listReciver = JSON.parse(recivers);
      const createdAt = Date.now();

      const isCheck = await this.validate(conn, code, listDevice);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const isCheckRecivers = await this.validateRecivers(conn, listReciver);
      if (!isCheckRecivers.result) {
        conn.release();
        throw isCheckRecivers.errors;
      }

      await connPromise.beginTransaction();

      const dataInsertOrders = listReciver.reduce((result, item, i) => {
        if (i !== listReciver.length - 1) {
          const data = [
            i === 0 ? code : makeCode(),
            userId,
            item,
            listReciver[i + 1],
            listDevice?.length,
            1,
            note || null,
            0,
            createdAt,
          ];
          result = [...result, data];
        }

        return result;
      }, []);

      const res_ = await this.insertMulti(
        conn,
        tableName,
        "code,creator_user_id,creator_customer_id,reciver,quantity,orders_status_id,note,is_deleted,created_at",
        dataInsertOrders
      );
      const dataInsertDevice = listReciver.reduce((result, item, i) => {
        if (i !== listReciver.length - 1) {
          const orders_id = res_ + i;
          result = [
            ...result,
            ...listDevice.map((item1) => [orders_id, item1]),
          ];
        }
        return result;
      }, []);
      console.log("dataInsertDevice", dataInsertDevice);
      await this.insertMulti(
        conn,
        tabbleOrdersDevice,
        "orders_id,device_id",
        dataInsertDevice
      );

      await connPromise.commit();

      conn.release();

      return [];
    } catch (error) {
      await connPromise.rollback();
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    } finally {
      conn.release();
    }
  }

  //update
  async updateById(body, params) {
    const { conn, connPromise } = await db.getConnection();
    try {
      const { code, devices_id, reciver, note } = body;

      const listDevice = JSON.parse(devices_id);
      const { id } = params;

      const isCheck = await this.validate(conn, code, listDevice, reciver, id);
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
        `orders_id = ? AND device_id NOT IN (?)`,
        [id, listDevice],
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
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
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
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new OrdersService();
