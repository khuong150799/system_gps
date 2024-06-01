const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const OrdersModel = require("../models/orders.model");
const {
  ERROR,
  ALREADY_EXITS,
  NOT_EXITS,
  DIFFERENT_RECIVER_ORDERS,
  NOT_EMPTY,
  STRUCTURE_ORDERS_FAIL,
  NOT_ACTIVE_ACCOUNT,
  DELETED_ACCOUNT,
  IS_ACTIVED,
  NOT_ACTIVE_CUSTOMER,
  DELETED_CUSTOMER,
  NOT_PERMISSION,
  MERGE_ORDER_FAIL,
} = require("../constants");
const { BusinessLogicError } = require("../core/error.response");
const { makeCode } = require("../ultils/makeCode");
const tableName = "tbl_orders";
const tableOrdersDevice = "tbl_orders_device";
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

  async validate(
    conn,
    code,
    listDevice = [],
    reciver = null,
    customerId,
    id = null
  ) {
    const errors = [];

    let where = `code = ? AND ${tableName}.is_deleted = ?`;
    const conditions = [code, 0];

    const joinTableUsersDevice = `${tableDevice} INNER JOIN ${tableUsersDevice} ON ${tableDevice}.id = ${tableUsersDevice}.device_id 
      INNER JOIN ${tableUsersCustomers} ON ${tableUsersDevice}.user_id = ${tableUsersCustomers}.user_id`;
    const selectDevice = `${tableDevice}.id,${tableDevice}.imei,${tableDevice}.activation_date`;
    let whereDevice = `${tableDevice}.id IN (?) AND ${tableDevice}.is_deleted = ? AND ${tableUsersCustomers}.customer_id = ?`;
    const conditionsDevice = [listDevice, 0, customerId];

    if (id) {
      where += ` AND ${tableName}.id <> ?`;
      conditions.push(id);

      const ordersInfo = await this.select(
        conn,
        tableName,
        "creator_customer_id",
        "id = ? AND is_deleted = ?",
        [id, 0]
      );
      if (ordersInfo?.length <= 0) {
        return { result: false, errors: { msg: `Đơn hàng ${NOT_EXITS}` } };
      } else if (
        ordersInfo?.length &&
        ordersInfo[0].creator_customer_id.toString() !== customerId.toString()
      ) {
        return { result: false, errors: { msg: NOT_PERMISSION } };
      }
    } else {
      if (listDevice.length <= 0) {
        errors.push({ value: listDevice, msg: NOT_EMPTY, param: "devices_id" });
      }

      if (errors.length)
        return { result: false, errors: { msg: ERROR, errors } };

      whereDevice += ` AND ${tableUsersDevice}.is_moved = ?`;
      conditionsDevice.push(0);
    }

    const [dataCheckCode, dataDevice] = await Promise.all([
      this.select(conn, tableName, `id`, where, conditions),

      this.select(
        conn,
        joinTableUsersDevice,
        selectDevice,
        whereDevice,
        conditionsDevice,
        `${tableDevice}.id`
      ),
    ]);

    let dataInfo = [];
    if (reciver) {
      const joinTableUsersCustomers = `${tableUsersCustomers} INNER JOIN ${tableUsers} ON ${tableUsersCustomers}.user_id = ${tableUsers}.id`;
      console.log({ reciver });
      const info = await this.select(
        conn,
        joinTableUsersCustomers,
        `${tableUsers}.id,${tableUsers}.parent_id,${tableUsers}.is_actived,${tableUsers}.is_deleted`,
        `${tableUsersCustomers}.customer_id = ? AND ${tableUsers}.is_main = ?`,
        [reciver, 1],
        `${tableUsersCustomers}.id`
      );
      console.log({ info });
      if (info?.length <= 0) {
        errors.push({
          value: reciver,
          msg: `Khách hàng ${NOT_EXITS}`,
          param: "reciver",
        });
      } else if (info[0].is_actived === 0) {
        errors.push({
          value: reciver,
          msg: NOT_ACTIVE_CUSTOMER,
          param: "reciver",
        });
      } else if (info[0].is_deleted === 1) {
        errors.push({
          value: reciver,
          msg: DELETED_CUSTOMER,
          param: "reciver",
        });
      } else {
        const dataReciverParent = await this.select(
          conn,
          joinTableUsersCustomers,
          `${tableUsersCustomers}.customer_id as id`,
          `${tableUsers}.id = ?`,
          info[0].parent_id,
          `${tableUsersCustomers}.id`
        );

        if (
          !dataReciverParent[0]?.id ||
          dataReciverParent[0]?.id != customerId
        ) {
          errors.push({
            value: reciver,
            msg: STRUCTURE_ORDERS_FAIL,
            param: "reciver",
          });
        } else {
          dataInfo = info;
        }
      }
    }

    if (dataDevice.length <= 0) {
      errors.push({
        value: listDevice,
        msg: `Tất cả thiết bị ${NOT_EXITS}`,
        param: "devices_id",
      });
    } else {
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
    if (errors.length) return { result: false, errors: { msg: ERROR, errors } };

    return { result: true, data: { dataInfo } };
  }

  async validateMerge(conn, listOrders = [], reciver) {
    const errors = [];

    if (listOrders.length <= 1) {
      errors.push({
        value: listOrders,
        msg: MERGE_ORDER_FAIL,
        param: "orders_code",
      });
    }

    if (errors.length) return { result: false, errors: { msg: ERROR, errors } };

    const joinTable = `${tableUsersCustomers} INNER JOIN ${tableUsers} ON ${tableUsersCustomers}.user_id = ${tableUsers}.id`;
    const dataInfo = await this.select(
      conn,
      joinTable,
      `${tableUsers}.id,${tableUsers}.is_actived,${tableUsers}.is_deleted`,
      `${tableUsersCustomers}.customer_id = ? AND ${tableUsers}.is_main = ?`,
      [reciver, 1],
      `${tableUsersCustomers}.id`
    );

    if (dataInfo?.length <= 0) {
      errors.push({
        value: reciver,
        msg: `Khách hàng ${NOT_EXITS}`,
        param: "reciver",
      });
    } else if (dataInfo[0].is_actived === 0) {
      errors.push({
        value: reciver,
        msg: NOT_ACTIVE_CUSTOMER,
        param: "reciver",
      });
    } else if (dataInfo[0].is_deleted === 1) {
      errors.push({
        value: reciver,
        msg: DELETED_CUSTOMER,
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
    const select = `${tableUsers}.parent_id,${tableUsers}.id`;
    const where = `${tableCustomers}.id = ? AND ${tableUsers}.is_main = ?`;

    const arrayPromise = listCustomer.reduce((result, item, i) => {
      if (i > 0) {
        result = [
          ...result,
          this.select(
            conn,
            joinTable,
            select,
            where,
            [item, 1],
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
    return { result: true, data: dataInfo };
  }

  async validateDeleteDevice(conn, deviceId, id, customerId) {
    const errors = [];

    const joinTableUsersDeviceWithUsersCustomers = `
      ${tableUsersDevice} INNER JOIN ${tableUsersCustomers} ON ${tableUsersDevice}.user_id = ${tableUsersCustomers}.user_id`;

    const joinTableOdersUsersWithUsersCustomersWithUsers = `
      ${tableName} INNER JOIN ${tableUsersCustomers} ON ${tableName}.creator_customer_id = ${tableUsersCustomers}.customer_id 
      INNER JOIN ${tableUsers} ON ${tableUsersCustomers}.user_id = ${tableUsers}.id`;
    const [dataOwnerDevice, dataOwnerOrders] = await Promise.all([
      this.select(
        conn,
        joinTableUsersDeviceWithUsersCustomers,
        `${tableUsersDevice}.user_id ,${tableUsersCustomers}.customer_id`,
        `${tableUsersDevice}.is_moved = ? AND ${tableUsersDevice}.device_id = ?`,
        [0, deviceId, id],
        `${tableUsersDevice}.id`
      ),
      this.select(
        conn,
        joinTableOdersUsersWithUsersCustomersWithUsers,
        `${tableUsersCustomers}.user_id ,${tableName}.creator_customer_id as customer_id,${tableName}.quantity`,
        `${tableUsers}.is_main = ? AND ${tableName}.id = ?`,
        [1, id],
        `${tableUsers}.id`
      ),
    ]);

    if (dataOwnerDevice?.length <= 0) {
      errors.push({ msg: `Thiết bị ${NOT_EXITS}` });
    } else if (Number(customerId) !== Number(dataOwnerOrders[0].customer_id)) {
      errors.push({ msg: NOT_PERMISSION });
    }

    if (errors.length) return { result: false, errors: { msg: ERROR, errors } };

    return { result: true, data: { dataOwnerDevice, dataOwnerOrders } };
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

      const joinTable = `${tableName} INNER JOIN ${tableOrdersDevice} ON ${tableName}.id = ${tableOrdersDevice}.orders_id 
        INNER JOIN ${tableDevice} ON ${tableOrdersDevice}.device_id = ${tableDevice}.id`;

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
    try {
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

        const isCheck = await this.validate(
          conn,
          code,
          listDevice,
          reciver,
          customerId
        );
        if (!isCheck.result) {
          conn.release();
          throw isCheck.errors;
        }

        await connPromise.beginTransaction();

        const res_ = await this.insertDuplicate(
          conn,
          tableName,
          `code,
          creator_user_id,
          creator_customer_id,
          reciver,
          quantity,
          orders_status_id,
          note,
          is_deleted,
          created_at`,
          [
            [
              code,
              userId,
              customerId,
              reciver,
              listDevice?.length,
              1,
              note || null,
              0,
              Date.now(),
            ],
          ],
          `code=VALUES(code),creator_user_id=VALUES(creator_user_id),creator_customer_id=VALUES(creator_customer_id),reciver=VALUES(reciver),quantity=VALUES(quantity),
          orders_status_id=VALUES(orders_status_id),note=VALUES(note),is_deleted=VALUES(is_deleted),created_at=VALUES(created_at)`
        );

        const { dataInfo } = isCheck.data;
        const { id: userIdReciver } = dataInfo[0];

        const dataInsert = listDevice.reduce(
          (result, item) => {
            result.ordersDevices = [
              ...result.ordersDevices,
              [res_, item, 0, Date.now()],
            ];

            result.usersDevicesInsert = [
              ...result.usersDevicesInsert,
              [userIdReciver, item, 1, 0, 0, Date.now()],
            ];

            const dateeUpdate = {
              conditionField: ["is_moved", "device_id"],
              conditionValue: [0, item],
              updateValue: 1,
            };
            result.usersDevicesUpdate = [
              ...result.usersDevicesUpdate,
              dateeUpdate,
            ];

            return result;
          },
          { ordersDevices: [], usersDevicesInsert: [], usersDevicesUpdate: [] }
        );

        const { ordersDevices, usersDevicesInsert, usersDevicesUpdate } =
          dataInsert;

        await this.insertDuplicate(
          conn,
          tableOrdersDevice,
          "orders_id,device_id,is_deleted,created_at",
          ordersDevices,
          "is_deleted=VALUES(is_deleted)"
        );

        const dataUpdate = [
          {
            field: "is_moved",
            conditions: usersDevicesUpdate,
          },
        ];
        await this.updatMultiRowsWithMultiConditions(
          conn,
          tableUsersDevice,
          dataUpdate,
          "",
          "ID",
          "AND"
        );

        await this.insertDuplicate(
          conn,
          tableUsersDevice,
          "user_id,device_id,is_main,is_deleted,is_moved,created_at",
          usersDevicesInsert,
          `is_deleted=VALUES(is_deleted),is_moved=VALUES(is_moved)`
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
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
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

      const { quantity, listOrdersId, ordersIdKeep } = dataOrdersDb.reduce(
        (result, item) => {
          result.quantity += item.quantity;

          if (item.code.toString() === code.toString()) {
            result.ordersIdKeep = item.id;
          } else {
            result.listOrdersId = [...result.listOrdersId, item.id];
          }
          return result;
        },
        { quantity: 0, listOrdersId: [], ordersIdKeep: null }
      );

      if (quantity === 0 || listOrdersId.length === 0 || !ordersIdKeep)
        throw { msg: ERROR };

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
        updated_at: null,
      });

      await this.update(
        conn,
        tableName,
        {
          is_deleted: 1,
          note: `Đơn hàng được merge vào đơn hàng mới có mã ${code}`,
        },
        "id",
        listOrdersId
      );

      await this.update(conn, tableName, orders, "id", ordersIdKeep);
      await this.update(
        conn,
        tableOrdersDevice,
        { orders_id: ordersIdKeep },
        "orders_id",
        listOrdersId
      );

      await connPromise.commit();

      conn.release();
      orders.id = ordersIdKeep;
      delete orders.is_deleted;
      return orders;
    } catch (error) {
      await connPromise.rollback();
      const { msg, errors } = error;
      console.log("error", error);
      throw new BusinessLogicError(msg, errors);
    } finally {
      conn.release();
    }
  }

  //Register tree
  async registerTree(body, userId, customerId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { code, devices_id, recivers, note } = body;

        const listDevice = JSON.parse(devices_id);
        const listReciver = JSON.parse(recivers);
        const createdAt = Date.now();

        const isCheck = await this.validate(
          conn,
          code,
          listDevice,
          null,
          customerId
        );
        if (!isCheck.result) {
          conn.release();
          throw isCheck.errors;
        }

        const isCheckRecivers = await this.validateRecivers(conn, listReciver);
        if (!isCheckRecivers.result) {
          conn.release();
          throw isCheckRecivers.errors;
        }

        const { data: dataInfo } = isCheckRecivers;

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

        const res_ = await this.insertDuplicate(
          conn,
          tableName,
          "code,creator_user_id,creator_customer_id,reciver,quantity,orders_status_id,note,is_deleted,created_at",
          dataInsertOrders,
          `code=VALUES(code),creator_user_id=VALUES(creator_user_id),creator_customer_id=VALUES(creator_customer_id),
          reciver=VALUES(reciver),quantity=VALUES(quantity),orders_status_id=VALUES(orders_status_id),note=VALUES(note),
          is_deleted=VALUES(is_deleted),updated_at=VALUES(created_at)`
        );
        const dataInsertOrdersDevice = listReciver.reduce((result, item, i) => {
          if (i !== listReciver.length - 1) {
            const orders_id = res_ + i;
            result = [
              ...result,
              ...listDevice.map((item1) => [orders_id, item1, 0, Date.now()]),
            ];
          }
          return result;
        }, []);
        // console.log("dataInsertOrdersDevice", dataInsertOrdersDevice);
        await this.insertDuplicate(
          conn,
          tableOrdersDevice,
          "orders_id,device_id,is_deleted,created_at",
          dataInsertOrdersDevice,
          `orders_id=VALUES(orders_id),device_id=VALUES(device_id),is_deleted=VALUES(is_deleted),updated_at=VALUES(created_at)`
        );

        const usersDevicesUpdate = listDevice.map((item) => ({
          conditionField: ["is_moved", "device_id"],
          conditionValue: [0, item],
          updateValue: 1,
        }));
        const dataUpdate = [
          {
            field: "is_moved",
            conditions: usersDevicesUpdate,
          },
        ];
        await this.updatMultiRowsWithMultiConditions(
          conn,
          tableUsersDevice,
          dataUpdate,
          "",
          "ID",
          "AND"
        );

        const usersDevicesInsert = dataInfo.reduce((result, item, i) => {
          result = [
            ...result,
            ...listDevice.map((item1) => [
              item[0].id,
              item1,
              1,
              0,
              i === dataInfo.length - 1 ? 0 : 1,
              Date.now(),
            ]),
          ];
          return result;
        }, []);

        await this.insertDuplicate(
          conn,
          tableUsersDevice,
          "user_id,device_id,is_main,is_deleted,is_moved,created_at",
          usersDevicesInsert,
          `is_deleted=VALUES(is_deleted),is_moved=VALUES(is_moved)`
        );

        await connPromise.commit();

        conn.release();

        return [];
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

  //update
  async updateById(body, params, customerId) {
    const { conn, connPromise } = await db.getConnection();
    try {
      const { code, devices_id, reciver, note } = body;

      if (devices_id === "") return [];

      const listDevice = JSON.parse(devices_id);
      const { id } = params;

      const isCheck = await this.validate(
        conn,
        code,
        listDevice,
        reciver,
        customerId,
        id
      );
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
      const dataUpdateOrders = `code = "${code}", reciver = ${reciver}, quantity = quantity + ${
        listDevice?.length
      }, note = "${note || null}", updated_at = ${Date.now()}`;
      await this.update(conn, tableName, dataUpdateOrders, "id", id);

      const dataInsert = listDevice?.map((item) => [id, item, 0, Date.now()]);
      await this.insertDuplicate(
        conn,
        tableOrdersDevice,
        "orders_id,device_id,is_deleted,created_at",
        dataInsert,
        `orders_id=VALUES(orders_id),device_id=VALUES(device_id),is_deleted=VALUES(is_deleted),updated_at=VALUES(created_at)`
      );

      const { dataInfo } = isCheck.data;

      const { usersDevicesUpdate, usersDevicesInsert } = listDevice.reduce(
        (result, item) => {
          result.usersDevicesUpdate = [
            ...result.usersDevicesUpdate,
            {
              conditionField: ["is_moved", "device_id"],
              conditionValue: [0, item],
              updateValue: 1,
            },
          ];

          result.usersDevicesInsert = [
            ...result.usersDevicesInsert,
            [dataInfo[0].id, item, 1, 0, 0, Date.now()],
          ];
          return result;
        },
        { usersDevicesUpdate: [], usersDevicesInsert: [] }
      );

      if (usersDevicesUpdate?.length <= 0 || usersDevicesInsert.length <= 0)
        throw { msg: ERROR };

      const dataUpdate = [
        {
          field: "is_moved",
          conditions: usersDevicesUpdate,
        },
      ];
      await this.updatMultiRowsWithMultiConditions(
        conn,
        tableUsersDevice,
        dataUpdate,
        "",
        "ID",
        "AND"
      );

      await this.insertDuplicate(
        conn,
        tableUsersDevice,
        "user_id,device_id,is_main,is_deleted,is_moved,created_at",
        usersDevicesInsert,
        `is_deleted=VALUES(is_deleted),is_moved=VALUES(is_moved)`
      );

      await connPromise.commit();

      conn.release();
      orders.id = id;
      return orders;
    } catch (error) {
      console.log(error);
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

  //delete
  async deleteDevice(body, params, customerId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        const { device_id } = body;

        const isCheck = await this.validateDeleteDevice(
          conn,
          device_id,
          id,
          customerId
        );
        if (!isCheck.result) {
          conn.release();
          throw isCheck.errors;
        }

        const { dataOwnerDevice, dataOwnerOrders } = isCheck.data;

        const joinTableUserWithUsersCustomersWithUsersDevice = `
          ${tableUsers} INNER JOIN ${tableUsersCustomers} On ${tableUsers}.id = ${tableUsersCustomers}.user_id 
          INNER JOIN ${tableUsersDevice} On ${tableUsers}.id = ${tableUsersDevice}.user_id
          LEFT JOIN ${tableName} On ${tableUsersCustomers}.customer_id = ${tableName}.creator_customer_id
          `;

        const dataUserAndCustomerDelete = [];
        const dequy = async (data) => {
          dataUserAndCustomerDelete.push(data[0]);
          const id = data[0].user_id;

          const dataRes = await connPromise.query(
            `SELECT ${tableUsers}.id as user_id,${tableUsersCustomers}.customer_id,${tableName}.quantity FROM ${joinTableUserWithUsersCustomersWithUsersDevice} WHERE ${tableUsers}.parent_id = ? AND ${tableUsers}.is_deleted = ? AND ${tableUsersDevice}.device_id = ? `,
            [id, 0, device_id]
          );

          if (
            dataRes[0].length > 0 &&
            dataRes[0][0].id !== dataOwnerDevice[0].user_id
          ) {
            await dequy(dataRes[0]);
          }
        };
        await dequy(dataOwnerOrders);

        const formatData = dataUserAndCustomerDelete.reduce(
          (result, item) => {
            result.listUserId = [...result.listUserId, item.user_id];
            result.listCustomerId = [
              ...result.listCustomerId,
              item.customer_id,
            ];
            if (item.quantity > 0) {
              const dateeUpdate = {
                conditionField: [
                  `${tableName}.creator_customer_id`,
                  `${tableOrdersDevice}.device_id`,
                ],
                conditionValue: [item.customer_id, device_id],
                updateValue: item.quantity - 1,
              };
              result.dataOrdersUpdateMulti = [
                ...result.dataOrdersUpdateMulti,
                dateeUpdate,
              ];
            }
            return result;
          },
          { listUserId: [], listCustomerId: [], dataOrdersUpdateMulti: [] }
        );

        const { listUserId, listCustomerId, dataOrdersUpdateMulti } =
          formatData;
        await connPromise.beginTransaction();

        await this.update(
          conn,
          tableUsersDevice,
          { is_deleted: 1 },
          `${tableUsersDevice}.user_id IN (?) AND ${tableUsersDevice}.device_id`,
          [listUserId, device_id]
        );

        const joinTableOrdersWithOrdersDevice = `${tableName} INNER JOIN ${tableOrdersDevice} ON ${tableName}.id = ${tableOrdersDevice}.orders_id`;
        await this.update(
          conn,
          joinTableOrdersWithOrdersDevice,
          `${tableOrdersDevice}.is_deleted = 1`,
          `${tableName}.creator_customer_id IN (?) AND ${tableOrdersDevice}.device_id`,
          [listCustomerId, device_id]
        );
        if (dataOrdersUpdateMulti?.length) {
          await this.updatMultiRowsWithMultiConditions(
            conn,
            joinTableOrdersWithOrdersDevice,
            [
              {
                field: "quantity",
                conditions: dataOrdersUpdateMulti,
              },
            ]
          );
        }
        await connPromise.commit();
        conn.release();
        return dataUserAndCustomerDelete;
      } catch (error) {
        console.log(error);
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
}

module.exports = new OrdersService();
