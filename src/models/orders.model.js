const DatabaseModel = require("./database.model");
const OrdersSchema = require("./schema/orders.schema");
const { ERROR } = require("../constants/msg.constant");
const { makeCode } = require("../ultils/makeCode");
const {
  tableOrders,
  tableOrdersDevice,
  tableDevice,
  tableUsers,
  tableCustomers,
  tableUsersCustomers,
  tableUsersDevices,
} = require("../constants/tableName.constant");

class OrdersModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query, customerId) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;

    const { is_deleted, keyword, orders_status_id, reciver } = query;
    const isDeleted = is_deleted || 0;
    let where = `o.is_deleted = ? AND o.creator_customer_id = ?`;
    const conditions = [isDeleted, customerId];

    if (keyword) {
      where += ` AND (o.code LIKE ? OR c.name LIKE ? OR c.company LIKE ? OR u.username LIKE ?)`;
      conditions.push(
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`
      );
    }

    if (orders_status_id) {
      where += ` AND o.orders_status_id = ?`;
      conditions.push(orders_status_id);
    }

    if (reciver) {
      where += ` AND o.reciver = ?`;
      conditions.push(reciver);
    }

    // const joinTable = `${tableOrders} INNER JOIN ${tableCustomers} ON ${tableOrders}.reciver = ${tableCustomers}.id
    // INNER JOIN ${tableUsersCustomers} ON ${tableOrders}.creator = ${tableUsersCustomers}.user_id
    // INNER JOIN ${tableCustomers} c ON ${tableUsersCustomers}.customer_id = c.id
    // INNER JOIN ${tableUsers} ON ${tableOrders}.creator = ${tableUsers}.id
    // INNER JOIN ${tableUsersRole} ON ${tableOrders}.creator = ${tableUsersRole}.user_id
    // INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id`;

    const joinTable = `${tableOrders} o INNER JOIN ${tableCustomers} c1 ON o.reciver = c1.id 
      INNER JOIN ${tableCustomers} c ON o.creator_customer_id = c.id 
      INNER JOIN ${tableUsers} u ON o.creator_user_id = u.id`;

    const select = `o.id,o.code,o.note,o.quantity,COALESCE(c1.company,
      c1.name) as reciver,COALESCE(c.company, c.name) as creator_customer,u.username as creator_user,
      o.orders_status_id,o.created_at,o.updated_at`;
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        `o.id`,
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
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `${tableOrders}.is_deleted = ? AND ${tableOrdersDevice}.is_deleted = ? AND ${tableOrders}.id = ?`;
    const conditions = [isDeleted, 0, id];

    const joinTable = `${tableOrders} INNER JOIN ${tableOrdersDevice} ON ${tableOrders}.id = ${tableOrdersDevice}.orders_id 
      INNER JOIN ${tableDevice} ON ${tableOrdersDevice}.device_id = ${tableDevice}.id 
      INNER JOIN ${tableCustomers} ON ${tableOrders}.reciver = ${tableCustomers}.id 
      INNER JOIN ${tableCustomers} c ON ${tableOrders}.creator_customer_id = c.id 
      INNER JOIN ${tableUsers} ON ${tableOrders}.creator_user_id = ${tableUsers}.id`;

    const selectData = `${tableOrders}.id,${tableOrders}.code,${tableOrders}.reciver,${tableOrders}.note,${tableOrders}.orders_status_id,
      JSON_ARRAYAGG(JSON_OBJECT('id', ${tableDevice}.id,'imei', ${tableDevice}.imei)) AS devices,
      ${tableCustomers}.name as reciver,c.name as creator_customer,${tableUsers}.username as creator_user,
      ${tableOrders}.created_at,${tableOrders}.updated_at`;

    const res_ = await this.select(
      conn,
      joinTable,
      selectData,
      `${where} GROUP BY ${tableOrders}.id,${tableOrders}.code`,
      conditions,
      `${tableOrders}.id`
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
      tableOrders,
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

        const dataUpdate = {
          conditionField: ["is_moved", "device_id"],
          conditionValue: [0, item],
          updateValue: 1,
        };
        result.usersDevicesUpdate = [...result.usersDevicesUpdate, dataUpdate];

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
      tableUsersDevices,
      dataUpdate,
      "",
      "ID",
      "AND"
    );

    await this.insertDuplicate(
      conn,
      tableUsersDevices,
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
      tableOrders,
      {
        is_deleted: 1,
        note: `Đơn hàng được merge vào đơn hàng mới có mã ${code}`,
      },
      "id",
      listOrdersId
    );

    await this.update(conn, tableOrders, orders, "id", ordersIdKeep);
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
  async registerTree(
    conn,
    connPromise,
    dataInfo,
    body,
    userId,
    isBeginTransaction = true
  ) {
    const { code, devices_id, recivers, note, isEditTructure } = body;

    // console.log(
    //   "code, devices_id, recivers, note",
    //   code,
    //   devices_id,
    //   recivers,
    //   note
    // );

    const listDevice = JSON.parse(devices_id);
    const listReciver = JSON.parse(recivers);
    const createdAt = Date.now();
    if (isBeginTransaction) {
      await connPromise.beginTransaction();
    }
    // console.log("listReciver", listReciver);

    if (isEditTructure) {
      const dataOrderOld = await this.select(
        conn,
        tableOrdersDevice,
        "orders_id",
        "device_id IN (?)",
        listDevice,
        "id",
        "ASC",
        0,
        99
      );

      if (dataOrderOld?.length) {
        const listOrdersId = dataOrderOld.map(({ orders_id }) => orders_id);

        await this.update(
          conn,
          tableOrders,
          `quantity = quantity - 1`,
          "",
          [listOrdersId],
          "orders_id",
          true,
          `id IN (?)`
        );

        await this.update(
          conn,
          tableOrdersDevice,
          { is_deleted: 1 },
          "device_id",
          listDevice[0]
        );

        const joinTable = `${tableUsersDevices} ud INNER JOIN ${tableUsersCustomers} uc ON ud.user_id = uc.user_id`;

        await this.update(
          conn,
          `${joinTable}`,
          `ud.is_deleted = 1`,
          "",
          [listDevice, 1, 0, listReciver[0]],
          "device_id",
          false,
          `ud.device_id IN (?) AND ud.is_main = ? AND ud.is_deleted = ? AND uc.customer_id <> ?`
        );
      }
    }

    const dataInsertOrders = listReciver.reduce((result, item, i) => {
      if (listReciver?.length == 1) {
        const data = [
          code,
          userId,
          item,
          listReciver[i],
          listDevice?.length,
          1,
          note || null,
          0,
          createdAt,
        ];
        result = [data];
      } else if (i !== listReciver.length - 1) {
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

    // console.log("dataInsertOrders", dataInsertOrders);

    const res_ = await this.insertDuplicate(
      conn,
      tableOrders,
      "code,creator_user_id,creator_customer_id,reciver,quantity,orders_status_id,note,is_deleted,created_at",
      dataInsertOrders,
      `code=VALUES(code),creator_user_id=VALUES(creator_user_id),creator_customer_id=VALUES(creator_customer_id),
          reciver=VALUES(reciver),quantity=VALUES(quantity),orders_status_id=VALUES(orders_status_id),note=VALUES(note),
          is_deleted=VALUES(is_deleted),updated_at=VALUES(created_at)`
    );
    // console.log("res_", res_);
    // console.log("listReciver.length", listReciver.length);
    let orders_id = res_;
    const dataInsertOrdersDevice = listReciver.reduce((result, item, i) => {
      if (listReciver.length == 1) {
        result = [
          ...listDevice.map((item1) => [orders_id, item1, 0, Date.now()]),
        ];
      } else if (i !== listReciver.length - 1) {
        result = [
          ...result,
          ...listDevice.map((item1) => [orders_id, item1, 0, Date.now()]),
        ];
        orders_id += 1;
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

    if (isBeginTransaction) {
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
        tableUsersDevices,
        dataUpdate,
        "",
        "ID",
        "AND"
      );
    }

    const usersDevicesInsert = dataInfo.reduce((result, item, i) => {
      result = [
        ...result,
        ...listDevice.map((item1) => [
          !isBeginTransaction ? item.id : item[0].id,
          item1,
          1,
          0,
          !isBeginTransaction ? 1 : i === dataInfo.length - 1 ? 0 : 1,
          Date.now() + i,
        ]),
      ];
      return result;
    }, []);

    await this.insertDuplicate(
      conn,
      tableUsersDevices,
      "user_id,device_id,is_main,is_deleted,is_moved,created_at",
      usersDevicesInsert,
      `is_deleted=VALUES(is_deleted),is_main=VALUES(is_main),is_moved=VALUES(is_moved),created_at=VALUES(created_at)`
    );

    if (isBeginTransaction) {
      await connPromise.commit();
    }

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
    await this.update(conn, tableOrders, dataUpdateOrders, "id", id);

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
      tableUsersDevices,
      dataUpdate,
      "",
      "ID",
      "AND"
    );

    await this.insertDuplicate(
      conn,
      tableUsersDevices,
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
    await this.update(conn, tableOrders, { is_deleted: 1 }, "id", id);
    return [];
  }

  //delete
  async deleteDevice(conn, connPromise, inforOrder, listOrdersId, idUd, body) {
    const { device_id } = body;
    const { user_device_id } = idUd[0];

    await connPromise.beginTransaction();

    await this.update(
      conn,
      tableUsersDevices,
      { is_deleted: 1 },
      "",
      [user_device_id, device_id],
      "device_id",
      true,
      `id > ? AND device_id = ?`
    );

    await this.update(
      conn,
      tableUsersDevices,
      { is_moved: 0 },
      "",
      [user_device_id],
      "device_id",
      true,
      "id = ?"
    );

    if (inforOrder?.length) {
      const { od_id } = inforOrder[0];
      if (listOrdersId?.length) {
        const quantity = 1;
        await this.update(
          conn,
          tableOrders,
          `quantity = quantity - ${quantity}`,
          "",
          [listOrdersId],
          "device_id",
          true,
          `id IN (?)`
        );
      }

      await this.update(
        conn,
        tableOrdersDevice,
        { is_deleted: 1 },
        "",
        [od_id, device_id],
        "device_id",
        true,
        `id >= ? AND device_id = ?`
      );
    }

    await connPromise.commit();
    return [];
  }
}

module.exports = new OrdersModel();
