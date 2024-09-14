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
  DEVICE_IS_ACTIVED,
  NOT_OWN,
} = require("../constants/msg.constant");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const ordersModel = require("../models/orders.model");
const validateModel = require("../models/validate.model");
const {
  tableOrders,
  tableDevice,
  tableUsers,
  tableUsersCustomers,
  tableUsersDevices,
  tableDeviceVehicle,
  tableUserDevice,
  tableOrdersDevice,
} = require("../constants/tableName.constant");

const databaseModel = new DatabaseModel();

class OrdersService {
  async validate(
    conn,
    code,
    listDevice = [],
    reciver = null,
    customerId,
    id = null,
    level,
    role
  ) {
    const errors = [];

    let where = `code = ? AND ${tableOrders}.is_deleted = ?`;
    const conditions = [code, 0];

    const jointableUsersDevices = `${tableDevice} d INNER JOIN ${tableUsersDevices} ud ON d.id = ud.device_id 
      INNER JOIN ${tableUsersCustomers} uc ON ud.user_id = uc.user_id 
      LEFT JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id AND dv.is_deleted = 0`;

    const selectDevice = `d.id,d.imei,dv.activation_date`;
    let whereDevice = `d.id IN (?) AND d.is_deleted = ? AND uc.customer_id = ?`;
    const conditionsDevice = [listDevice, 0, customerId];

    if (id) {
      where += ` AND ${tableOrders}.id <> ?`;
      conditions.push(id);

      const ordersInfo = await databaseModel.select(
        conn,
        tableOrders,
        "creator_customer_id",
        "id = ? AND is_deleted = ?",
        [id, 0],
        "id",
        "ASC",
        0,
        99999
      );
      if (ordersInfo?.length <= 0) {
        throw { msg: `Đơn hàng ${NOT_EXITS}` };
      } else if (
        ordersInfo?.length &&
        ordersInfo[0].creator_customer_id.toString() !== customerId.toString()
      ) {
        throw { msg: NOT_PERMISSION };
      }
    } else {
      if (listDevice.length <= 0) {
        errors.push({ value: listDevice, msg: NOT_EMPTY, param: "devices_id" });
      }

      if (errors.length) throw { msg: ERROR, errors };

      whereDevice += ` AND ud.is_moved = ?`;
      conditionsDevice.push(0);
    }

    const [dataCheckCode, dataDevice] = await Promise.all([
      databaseModel.select(conn, tableOrders, `id`, where, conditions),

      databaseModel.select(
        conn,
        jointableUsersDevices,
        selectDevice,
        whereDevice,
        conditionsDevice,
        `d.id`,
        "ASC",
        0,
        99999
      ),
    ]);

    let dataInfo = [];
    if (reciver) {
      const joinTableUsersCustomers = `${tableUsersCustomers} uc INNER JOIN ${tableUsers} u ON uc.user_id = u.id`;
      // console.log({ reciver });
      const info = await databaseModel.select(
        conn,
        joinTableUsersCustomers,
        `u.id,u.parent_id,u.is_actived,u.is_deleted`,
        `uc.customer_id = ? AND u.is_main = ?`,
        [reciver, 1],
        `uc.id`,
        "ASC",
        0,
        99999
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
          `uc.customer_id as id`,
          `u.id = ?`,
          info[0].parent_id,
          `uc.id`,
          "ASC",
          0,
          99999
        );
        // console.log("dataReciverParent", dataReciverParent, customerId);
        if (
          (!dataReciverParent[0]?.id ||
            dataReciverParent[0]?.id != customerId) &&
          level < 30 &&
          role < 40
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
    if (errors.length) throw { msg: ERROR, errors };

    return dataInfo;
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

    if (errors.length) throw { msg: ERROR, errors };
    const joinTable = `${tableUsersCustomers} uc INNER JOIN ${tableUsers} u ON uc.user_id = u.id`;
    const dataInfo = await databaseModel.select(
      conn,
      joinTable,
      `u.id,u.is_actived,u.is_deleted`,
      `uc.customer_id = ? AND u.is_main = ?`,
      [reciver, 1],
      `uc.id`,
      "ASC",
      0,
      99999
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

    if (errors.length) throw { msg: ERROR, errors };

    const where = `code IN (?) AND is_deleted = 0`;
    const conditions = [listOrders];

    const dataOrdersExits = await databaseModel.select(
      conn,
      tableOrders,
      "id,code,reciver,quantity",
      where,
      conditions,
      "id",
      "ASC",
      0,
      99999
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
      throw { msg: ERROR, errors };
    }

    return dataOrdersExits;
  }

  async validateDeleteDevice(conn, deviceId, id, customerId) {
    const errors = [];

    const jointableUsersDevicesWithUsersCustomers = `
      ${tableUsersDevices} ud INNER JOIN ${tableUsersCustomers} uc ON ud.user_id = uc.user_id 
      LEFT JOIN ${tableDeviceVehicle} dv ON ud.device_id = dv.device_id`;

    const joinTableOdersUsersWithUsersCustomersWithUsers = `
      ${tableOrders} o INNER JOIN ${tableUsersCustomers} uc ON o.creator_customer_id = uc.customer_id 
      INNER JOIN ${tableUsers} u ON uc.user_id = u.id`;
    const [dataOwnerDevice, dataOwnerOrders] = await Promise.all([
      databaseModel.select(
        conn,
        jointableUsersDevicesWithUsersCustomers,
        `ud.user_id ,uc.customer_id,dv.activation_date`,
        `ud.is_moved = ? AND ud.device_id = ?`,
        [0, deviceId],
        `ud.id`,
        "ASC",
        0,
        99999
      ),
      databaseModel.select(
        conn,
        joinTableOdersUsersWithUsersCustomersWithUsers,
        `uc.user_id ,o.creator_customer_id as customer_id,o.quantity`,
        `u.is_main = ? AND o.id = ?`,
        [1, id],
        `u.id`,
        "ASC",
        0,
        99999
      ),
    ]);

    if (dataOwnerDevice?.length <= 0) {
      errors.push({ msg: `Thiết bị ${NOT_EXITS}` });
    } else if (Number(customerId) !== Number(dataOwnerOrders[0].customer_id)) {
      errors.push({ msg: NOT_PERMISSION });
    } else if (dataOwnerDevice[0].activation_date) {
      errors.push({ msg: `${DEVICE_IS_ACTIVED} không thể thu hồi` });
    }

    if (errors.length) throw { msg: ERROR, errors };

    return { dataOwnerDevice, dataOwnerOrders };
  }

  //getallrow
  async getallrows(query, customerId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await ordersModel.getallrows(conn, query, customerId);
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
  async register(body, userId, customerId, level, role) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { code, devices_id, reciver } = body;

        const listDevice = JSON.parse(devices_id);

        const [dataInfo] = await this.validate(
          conn,
          code,
          listDevice,
          reciver,
          customerId,
          null,
          level,
          role
        );

        const { id: userIdReciver } = dataInfo;

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
      console.log("error", error);
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

      const dataOrdersDb = await this.validateMerge(
        conn,
        listOrdersCode,
        reciver
      );

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
    console.log({ body, userId, customerId });

    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { code, devices_id, recivers } = body;

        const listDevice = JSON.parse(devices_id);
        const listReciver = JSON.parse(recivers);

        await this.validate(conn, code, listDevice, null, customerId);

        const dataInfo = await validateModel.CheckCustomerTree(
          conn,
          listReciver
        );

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
      console.log(error);

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

        const dataInfo = await this.validate(
          conn,
          code,
          listDevice,
          reciver,
          customerId,
          id
        );

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
  async deleteDevice(body, params, customerId, userId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        console.log("body", body);

        const { id } = params;
        const { device_id } = body;

        const { dataOwnerDevice, dataOwnerOrders } =
          await this.validateDeleteDevice(conn, device_id, id, customerId);

        console.log(
          "dataOwnerDevice, dataOwnerOrders",
          dataOwnerDevice,
          dataOwnerOrders
        );

        const seletInfoVehicle = `ud.id as user_device_id`;

        const idUd = await databaseModel.select(
          conn,
          `${tableUserDevice} ud`,
          seletInfoVehicle,
          "ud.user_id = ? AND ud.device_id = ? AND ud.is_main = ?",
          [userId, device_id, 1],
          "ud.id"
        );

        if (!idUd?.length) throw { msg: `Phương tiện ${NOT_OWN}` };

        const joinTableCustomerOrders = `${tableOrders} o INNER JOIN ${tableOrdersDevice} od ON o.id = od.orders_id`;

        const selectInfoOrders = `o.id as orders_id, od.id as od_id`;

        const whereOrders = `o.creator_customer_id = ? AND od.device_id = ?`;

        const inforOrder = await databaseModel.select(
          conn,
          joinTableCustomerOrders,
          selectInfoOrders,
          whereOrders,
          [customerId, device_id],
          "o.id"
        );

        console.log("inforOrder", inforOrder);
        let listOrdersId = [];
        if (inforOrder?.length) {
          const { od_id } = inforOrder[0];
          const joinTableOrder = `${tableOrders} o INNER JOIN ${tableOrdersDevice} od ON o.id = od.orders_id`;
          const select = "o.id";
          const where = "od.id >= ? AND device_id = ?";
          const allOrders = await databaseModel.select(
            conn,
            joinTableOrder,
            select,
            where,
            [od_id, device_id],
            "od.id",
            "ASC"
          );

          listOrdersId = allOrders?.map((item) => item.id);

          console.log("listOrdersId", listOrdersId);
        }

        const data = await ordersModel.deleteDevice(
          conn,
          connPromise,
          inforOrder,
          listOrdersId,
          idUd,
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
      console.log(error);

      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }
}

module.exports = new OrdersService();
