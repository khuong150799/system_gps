const db = require("../dbs/init.mysql");
const {
  ERROR,
  ALREADY_EXITS,
  NOT_EXITS,
  DIFFERENT_RECIVER_ORDERS,
  NOT_EMPTY,
  STRUCTURE_ORDERS_FAIL,
  IS_ACTIVED,
  NOT_ACTIVE_CUSTOMER,
  DELETED_CUSTOMER,
  NOT_PERMISSION,
  MERGE_ORDER_FAIL,
} = require("../constants");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const ordersModel = require("../models/orders.model");
const tableName = "tbl_orders";
const tableDevice = "tbl_device";
const tableUsers = "tbl_users";
const tableCustomers = "tbl_customers";
const tableUsersCustomers = "tbl_users_customers";
const tableUsersDevice = "tbl_users_devices";

const databaseModel = new DatabaseModel();

class OrdersService {
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

      const ordersInfo = await databaseModel.select(
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
      databaseModel.select(conn, tableName, `id`, where, conditions),

      databaseModel.select(
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
      // console.log({ reciver });
      const info = await databaseModel.select(
        conn,
        joinTableUsersCustomers,
        `${tableUsers}.id,${tableUsers}.parent_id,${tableUsers}.is_actived,${tableUsers}.is_deleted`,
        `${tableUsersCustomers}.customer_id = ? AND ${tableUsers}.is_main = ?`,
        [reciver, 1],
        `${tableUsersCustomers}.id`
      );
      // console.log({ info });
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
        const dataReciverParent = await databaseModel.select(
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
    const dataInfo = await databaseModel.select(
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

    const dataOrdersExits = await databaseModel.select(
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
          databaseModel.select(
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
      databaseModel.select(
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
      databaseModel.select(
        conn,
        joinTableUsersDeviceWithUsersCustomers,
        `${tableUsersDevice}.user_id ,${tableUsersCustomers}.customer_id`,
        `${tableUsersDevice}.is_moved = ? AND ${tableUsersDevice}.device_id = ?`,
        [0, deviceId, id],
        `${tableUsersDevice}.id`
      ),
      databaseModel.select(
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
      const { conn } = await db.getConnection();
      try {
        const data = await ordersModel.getallrows(conn, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await ordersModel.getById(conn, params, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //Register
  async register(body, userId, customerId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { code, devices_id, reciver } = body;

        const listDevice = JSON.parse(devices_id);

        const isCheck = await this.validate(
          conn,
          code,
          listDevice,
          reciver,
          customerId
        );
        if (!isCheck.result) {
          throw isCheck.errors;
        }
        const { dataInfo } = isCheck.data;
        const { id: userIdReciver } = dataInfo[0];

        const data = await ordersModel.register(
          conn,
          connPromise,
          userIdReciver,
          body,
          userId,
          customerId
        );

        return data;
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
      const { orders_code, reciver } = body;

      const listOrdersCode = JSON.parse(orders_code);

      const isCheck = await this.validateMerge(conn, listOrdersCode, reciver);
      if (!isCheck.result) {
        throw isCheck.errors;
      }

      const dataOrdersDb = isCheck.data;

      const data = await ordersModel.merge(
        conn,
        connPromise,
        dataOrdersDb,
        body,
        userId,
        customerId
      );

      return data;
    } catch (error) {
      await connPromise.rollback();
      const { msg, errors } = error;
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
        const { code, devices_id, recivers } = body;

        const listDevice = JSON.parse(devices_id);
        const listReciver = JSON.parse(recivers);

        const isCheck = await this.validate(
          conn,
          code,
          listDevice,
          null,
          customerId
        );
        if (!isCheck.result) {
          throw isCheck.errors;
        }

        const isCheckRecivers = await this.validateRecivers(conn, listReciver);
        if (!isCheckRecivers.result) {
          throw isCheckRecivers.errors;
        }

        const { data: dataInfo } = isCheckRecivers;

        await ordersModel.registerTree(
          conn,
          connPromise,
          dataInfo,
          body,
          userId
        );

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
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { code, devices_id, reciver } = body;

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
          throw isCheck.errors;
        }

        const { dataInfo } = isCheck.data;

        const data = await ordersModel.updateById(
          conn,
          connPromise,
          dataInfo,
          body,
          params
        );

        return data;
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

  //delete
  async deleteById(params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await ordersModel.deleteById(conn, params);
        return [];
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
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
          throw isCheck.errors;
        }

        const { dataOwnerDevice, dataOwnerOrders } = isCheck.data;

        const data = await ordersModel.deleteDevice(
          conn,
          connPromise,
          dataOwnerDevice,
          dataOwnerOrders,
          body
        );

        return data;
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
}

module.exports = new OrdersService();
