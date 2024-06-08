const DatabaseModel = require("./database.model");
const OrdersSchema = require("./schema/orders.schema");
const { ERROR } = require("../constants");
const { makeCode } = require("../ultils/makeCode");
const tableName = "tbl_orders";
const tableOrdersDevice = "tbl_orders_device";
const tableDevice = "tbl_device";
const tableUsers = "tbl_users";
const tableCustomers = "tbl_customers";
const tableUsersCustomers = "tbl_users_customers";
const tableUsersDevice = "tbl_users_devices";

class OrdersModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
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

    return { data: res_, totalPage };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `${tableName}.is_deleted = ? AND ${tableName}.id = ?`;
    const conditions = [isDeleted, id];

    const joinTable = `${tableName} INNER JOIN ${tableOrdersDevice} ON ${tableName}.id = ${tableOrdersDevice}.orders_id 
      INNER JOIN ${tableDevice} ON ${tableOrdersDevice}.device_id = ${tableDevice}.id`;

    const selectData = `${tableName}.id,${tableName}.code,${tableName}.reciver,${tableName}.note,${tableName}.orders_status_id,
      JSON_ARRAYAGG(JSON_OBJECT('id', ${tableDevice}.id,'imei', ${tableDevice}.imei)) AS devices`;

    const res_ = await this.select(
      conn,
      joinTable,
      selectData,
      `${where} GROUP BY ${tableName}.id,${tableName}.code`,
      conditions,
      `${tableName}.id`
    );
    return res_;
  }

  //Register
  async register(conn, connPromise, userIdReciver, body, userId, customerId) {
    const { code, devices_id, reciver, note } = body;

    const listDevice = JSON.parse(devices_id);

    const orders = new OrdersSchema({
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
        result.usersDevicesUpdate = [...result.usersDevicesUpdate, dateeUpdate];

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

    orders.id = res_;
    delete orders.is_deleted;
    return orders;
  }

  //merge
  async merge(conn, connPromise, dataOrders, body, userId, customerId) {
    const { code, reciver, note } = body;

    const { quantity, listOrdersId, ordersIdKeep } = dataOrders.reduce(
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

    const orders = new OrdersSchema({
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

    orders.id = ordersIdKeep;
    delete orders.is_deleted;
    return orders;
  }

  //Register tree
  async registerTree(conn, connPromise, dataInfo, body, userId) {
    const { code, devices_id, recivers, note } = body;

    const listDevice = JSON.parse(devices_id);
    const listReciver = JSON.parse(recivers);
    const createdAt = Date.now();

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

    return [];
  }

  //update
  async updateById(conn, connPromise, dataInfo, body, params) {
    const { code, devices_id, reciver, note } = body;

    const listDevice = JSON.parse(devices_id);
    const { id } = params;

    const orders = new OrdersSchema({
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

    orders.id = id;
    return orders;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableName, { is_deleted: 1 }, "id", id);
    return [];
  }

  //delete
  async deleteDevice(
    conn,
    connPromise,
    dataOwnerDevice,
    dataOwnerOrders,
    body
  ) {
    const { device_id } = body;

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
        dataRes?.[0]?.[0].length > 0 &&
        dataRes[0][0].id !== dataOwnerDevice[0].user_id
      ) {
        await dequy(dataRes[0]);
      }
    };
    await dequy(dataOwnerOrders);

    const formatData = dataUserAndCustomerDelete.reduce(
      (result, item) => {
        result.listUserId = [...result.listUserId, item.user_id];
        result.listCustomerId = [...result.listCustomerId, item.customer_id];
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

    const { listUserId, listCustomerId, dataOrdersUpdateMulti } = formatData;
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
    return dataUserAndCustomerDelete;
  }
}

module.exports = new OrdersModel();
