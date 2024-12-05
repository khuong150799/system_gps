const DatabaseModel = require("./database.model");
const UsersSchema = require("./schema/users.schema");
const UsersRoleSchema = require("./schema/usersRole.schema");
const UsersCustomersSchema = require("./schema/usersCustomers.schema");
const { v4: uuidv4 } = require("uuid");
const md5 = require("md5");
const keyTokenModel = require("./keyToken.model");

const {
  PASSWORD_DEFAULT,

  REFRESH_TOKEN_SECRET_KEY,
} = require("../constants/msg.constant");

const bcrypt = require("bcryptjs");
const {
  makeAccessToken,
  makeRefreshToken,
  checkToken,
} = require("../helper/auth.helper");

const CustomersSchema = require("./schema/customers.schema");
const { makeCode } = require("../ultils/makeCode");
const {
  tableUsersDevices,
  tableUsers,
  tableCustomers,
  tableUsersCustomers,
  tableLevel,
  tableRole,
  tableUsersRole,
  tableDevice,
  tableVehicle,
  tableDeviceVehicle,
  tableOrders,
  tableOrdersDevice,
} = require("../constants/tableName.constant");
const validateModel = require("./validate.model");
const vehicleModel = require("./vehicle.model");
const deviceLoggingModel = require("./deviceLogging.model");
const writeLogModel = require("./writeLog.model");
const { users } = require("../constants/module.constant");
const {
  hSet,
  del: delRedis,
  hGet,
  hScan,
  hdelOneKey,
  hGetAll,
} = require("./redis.model");
const {
  REDIS_KEY_TOKEN,
  REDIS_KEY_LOCK_ACC_WITH_EXTEND,
} = require("../constants/redis.constant");
const ordersModel = require("./orders.model");
const tokenFirebaseModel = require("./tokenFirebase.model");
const { BusinessLogicError } = require("../core/error.response");

class UsersModel extends DatabaseModel {
  constructor() {
    super();
  }

  async delToken(userId) {
    const {
      data: { tuples },
    } = await hScan(REDIS_KEY_TOKEN, 100000, 0, `${userId}/*`);

    // console.log("dataRedis", { cursor, tuples });

    if (tuples?.length) {
      await Promise.all(
        tuples.map(({ field }) => hdelOneKey(REDIS_KEY_TOKEN, field))
      );
    }
  }

  async getInfoParent(conn, parentId, customerId) {
    const joinTable = `${tableUsers} u INNER JOIN ${tableUsersCustomers} uc ON u.id = uc.user_id`;
    let where = "AND u.is_deleted = ? AND u.is_main = 1";
    const conditions = [0];
    if (parentId) {
      where = `u.id = ? ${where}`;
      conditions.unshift(parentId);
    } else {
      where = `uc.customer_id = ? ${where}`;
      conditions.unshift(customerId);
    }

    const dataParent = await this.select(
      conn,
      joinTable,
      "u.right,u.left",
      where,
      conditions,
      "u.id"
    );

    return dataParent;
  }

  async getLockExtend(conn) {
    const { result, data } = await hGetAll(REDIS_KEY_LOCK_ACC_WITH_EXTEND);
    // console.log("result", result);

    if (!result) return { data: [], totalPage: 0, totalRecord: 0 };
    const listUserId = [];
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const { index } = JSON.parse(data[key]);
        if (index >= 3) {
          listUserId.push(key);
        }
      }
    }
    // console.log("listUserId", listUserId);
    if (!listUserId.length) return { data: [], totalPage: 0, totalRecord: 0 };
    const dataRes = await this.select(
      conn,
      tableUsers,
      "id,username",
      "id IN (?)",
      [listUserId],
      "id",
      "ASC",
      0,
      9999
    );

    // console.log("dataRes", dataRes);

    return { data: dataRes, totalPage: 0, totalRecord: 0 };
  }

  async unlockExtend(params) {
    const { id } = params;

    const { result } = await hdelOneKey(
      REDIS_KEY_LOCK_ACC_WITH_EXTEND,
      id.toString()
    );
    if (!result) throw new BusinessLogicError();
    return [];
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;

    const { keyword, level_id, role_id, parent_id, is_main } = query;
    let where = `${tableUsers}.is_deleted = ?`;
    const conditions = [isDeleted];

    if (keyword) {
      where += ` AND (${tableUsers}.name LIKE ? OR ${tableCustomers}.name LIKE ?)`;
      conditions.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (level_id) {
      where += ` AND ${tableCustomers}.level_id = ?`;
      conditions.push(level_id);
    }

    if (role_id) {
      where += ` AND ${tableUsersRole}.role_id = ?`;
      conditions.push(role_id);
    }

    if (parent_id && is_main) {
      where += ` AND (${tableUsers}.parent_id = ? AND ${tableUsers}.is_main = ? OR ${tableUsers}.id = ?)`;
      conditions.push(parent_id, is_main, parent_id);
    }

    const joinTable = `${tableUsers} INNER JOIN ${tableUsersCustomers} ON ${tableUsers}.id = ${tableUsersCustomers}.user_id 
      INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id 
      INNER JOIN ${tableUsersRole} ON ${tableUsers}.id = ${tableUsersRole}.user_id 
      INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id 
      INNER JOIN ${tableLevel} ON ${tableCustomers}.level_id = ${tableLevel}.id `;

    const select = `${tableUsers}.id,${tableUsers}.username,${tableCustomers}.name as customer_name,${tableLevel}.name as level_name,
      ${tableRole}.name as role_name,${tableUsers}.created_at,${tableUsers}.updated_at`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        `${tableUsers}.id`,
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  async getallrowsSiteCustomerService(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;

    let where = `parent_id = ? AND is_deleted = ? AND is_main = ?`;
    const conditions = [1, isDeleted, 0];

    const select = `id,username,depatment_id`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableUsers,
        select,
        where,
        conditions,
        `id`,
        "ASC",
        offset,
        limit
      ),
      this.count(conn, tableUsers, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  //getallrow
  async getallChild(conn, query, customerId) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isTeam = query.is_team || 0;
    const { customer_id, is_deleted, keyword, role_id } = query;
    const isDeleted = is_deleted || 0;

    const chooseCustomer = customer_id || customerId;

    let where = `${tableUsers}.is_deleted = ? AND ${tableUsers}.is_team = ? AND ${tableUsers}.is_main = ? AND ${tableUsersCustomers}.customer_id = ?`;
    const conditions = [isDeleted, isTeam, 0, chooseCustomer];

    if (keyword) {
      where += ` AND (${tableUsers}.username LIKE ?)`;
      conditions.push(`%${keyword}%`);
    }

    if (role_id) {
      where += ` AND ${tableUsersRole}.role_id = ?`;
      conditions.push(role_id);
    }

    const joinTable = `${tableUsers} INNER JOIN ${tableUsersCustomers} ON ${tableUsers}.id = ${tableUsersCustomers}.user_id 
      INNER JOIN ${tableUsersRole} ON ${tableUsers}.id = ${tableUsersRole}.user_id 
      INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id `;

    const select = `${tableUsers}.id,${tableUsers}.username,${tableUsers}.is_actived,${tableRole}.name as role_name,${tableUsers}.created_at,${tableUsers}.updated_at`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        `${tableUsers}.id`,
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  async getTeamsWithUser(conn, query, userId) {
    const { is_deleted, user_id, keyword } = query;
    const offset = query.offset || 0;
    const limit = query.limit || 10;

    const isDeleted = is_deleted || 0;

    let where = `parent_id = ? AND ${tableUsers}.is_deleted = ? AND ${tableUsers}.is_team = ?`;
    const chosseUser = user_id || userId;

    const conditions = [chosseUser, isDeleted, 1];

    if (keyword) {
      where += ` AND ${tableCustomers}.name LIKE ?`;
      conditions.push(`%${keyword}%`);
    }

    const joinTable = `${tableUsers} INNER JOIN ${tableUsersCustomers} ON ${tableUsers}.id = ${tableUsersCustomers}.user_id 
      INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id`;

    const select = `${tableUsers}.id,${tableUsers}.is_actived,${tableCustomers}.name ,${tableCustomers}.id as customer_id,${tableCustomers}.created_at`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        `${tableUsers}.id`,
        "ASC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  async getListWithUser(conn, query, left, right) {
    const { is_deleted } = query;

    const isDeleted = is_deleted || 0;

    const where = `u.left > ? AND u.right < ? AND u.is_deleted = ?`;
    const conditions = [left, right, isDeleted];

    let joinTable = `${tableUsers} u INNER JOIN ${tableUsersCustomers} uc ON u.id = uc.user_id 
      INNER JOIN ${tableCustomers} c ON uc.customer_id = c.id`;

    let select = `u.id,u.username,u.is_main,u.parent_id,u.is_team,c.name as customer_name,c.id as customer_id`;

    const res_ = await this.select(
      conn,
      joinTable,
      select,
      where,
      conditions,
      "u.left",
      "ASC",
      0,
      9999999
    );

    return res_;
  }

  //getDeviceAdd
  async getDeviceAdd(conn, query, userId) {
    const { user_id, is_deleted, offset, limit } = query;

    const chooseUserId = user_id || userId;
    const isDeleted = is_deleted || 0;
    const where = `ud.user_id = ? AND ud.is_deleted = ? AND ud.is_main = 0`;
    const conditions = [chooseUserId, isDeleted];
    const joinTable = `${tableUsersDevices} ud INNER JOIN ${tableDevice} d ON ud.device_id = d.id
      INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id
      INNER JOIN ${tableVehicle} v ON dv.vehicle_id = v.id
      `;
    const selectData = `d.id,d.imei,v.name as vehicle_name`;

    const res_ = await this.select(
      conn,
      joinTable,
      selectData,
      where,
      conditions,
      "d.id",
      "DESC",
      offset || 0,
      limit || 10
    );
    return res_;
  }

  async getInfo(conn, userId, isGetPass = false) {
    const where = `${tableUsers}.is_deleted = ? AND ${tableUsers}.id = ?`;
    const conditions = [0, userId];
    const joinTable = `${tableUsers} INNER JOIN ${tableUsersRole} ON ${tableUsers}.id = ${tableUsersRole}.user_id 
      INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id  
      INNER JOIN ${tableUsersCustomers} ON ${tableUsers}.id = ${tableUsersCustomers}.user_id 
      INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id 
      INNER JOIN ${tableLevel} ON ${tableCustomers}.level_id = ${tableLevel}.id`;

    let selectData = `${tableUsers}.id,${tableUsers}.username,${tableUsers}.parent_id,${tableUsers}.is_actived,
      ${tableUsersRole}.role_id,${tableRole}.name as role_name,${tableCustomers}.level_id,${tableLevel}.name as level_name,${tableCustomers}.name as customer_name,${tableCustomers}.email,${tableCustomers}.phone,
      ${tableCustomers}.company,${tableCustomers}.address,${tableCustomers}.tax_code,${tableCustomers}.website,${tableCustomers}.id as customer_id`;
    if (isGetPass) {
      selectData += ` ,${tableUsers}.text_pass`;
    }
    const res_ = await this.select(
      conn,
      joinTable,
      selectData,
      where,
      conditions,
      `${tableUsers}.id`
    );
    return res_;
  }
  //Register
  // async register(conn, connPromise, body, customerId, isCommit = true) {
  //   const {
  //     parent_id,
  //     username,
  //     password,
  //     role_id,
  //     customer_id,
  //     is_actived,
  //     is_child,
  //   } = body;
  //   const createdAt = Date.now();

  //   const salt = await bcrypt.genSalt(12);
  //   const hashPass = await bcrypt.hash(password, salt);
  //   const user = new UsersSchema({
  //     parent_id: parent_id || null,
  //     username,
  //     password: hashPass,
  //     text_pass: password,
  //     is_actived,
  //     is_deleted: 0,
  //     is_main: is_child ? 0 : 1,
  //     is_team: 0,
  //     created_at: createdAt,
  //   });
  //   delete user.expired_on;
  //   delete user.updated_at;
  //   if (isCommit) {
  //     await connPromise.beginTransaction();
  //   }
  //   const res_ = await this.insert(conn, tableUsers, user);

  //   const usersRole = new UsersRoleSchema({
  //     user_id: res_,
  //     role_id,
  //     created_at: createdAt,
  //   });

  //   delete usersRole.updated_at;
  //   await this.insert(conn, tableUsersRole, usersRole);

  //   const usersCustomers = new UsersCustomersSchema({
  //     user_id: res_,
  //     customer_id,
  //     created_at: createdAt,
  //   });

  //   delete usersCustomers.updated_at;
  //   await this.insert(conn, tableUsersCustomers, usersCustomers);

  //   if (isCommit) {
  //     await connPromise.commit();
  //   }
  //   user.id = res_;
  //   delete user.is_deleted;
  //   delete user.password;
  //   delete user.text_pass;
  //   return [user];
  // }

  // async registerTeam(conn, username, password, connPromise, body) {
  //   const { parent_id, name } = body;
  //   const createdAt = Date.now();

  //   const salt = await bcrypt.genSalt(12);
  //   const hashPass = await bcrypt.hash(password, salt);
  //   const user = new UsersSchema({
  //     parent_id,
  //     username,
  //     password: hashPass,
  //     text_pass: password,
  //     is_actived: 1,
  //     is_deleted: 0,
  //     is_main: 0,
  //     is_team: 1,
  //     created_at: createdAt,
  //   });
  //   delete user.expired_on;
  //   delete user.updated_at;

  //   await connPromise.beginTransaction();
  //   const res_ = await this.insert(conn, tableUsers, user);

  //   const usersRole = new UsersRoleSchema({
  //     user_id: res_,
  //     role_id: 1,
  //     created_at: createdAt,
  //   });

  //   delete usersRole.updated_at;
  //   await this.insert(conn, tableUsersRole, usersRole);

  //   const code = makeCode();
  //   const customer = new CustomersSchema({
  //     level_id: 6,
  //     code,
  //     name,
  //     company: null,
  //     email: null,
  //     phone: null,
  //     address: null,
  //     tax_code: null,
  //     website: null,
  //     publish: 1,
  //     is_deleted: 0,
  //     created_at: Date.now(),
  //   });
  //   delete customer.updated_at;

  //   const customerId = await this.insert(conn, tableCustomers, customer);

  //   const usersCustomers = new UsersCustomersSchema({
  //     user_id: res_,
  //     customer_id: customerId,
  //     created_at: createdAt,
  //   });

  //   delete usersCustomers.updated_at;
  //   await this.insert(conn, tableUsersCustomers, usersCustomers);

  //   await connPromise.commit();
  //   user.id = res_;
  //   delete user.is_deleted;
  //   delete user.password;
  //   delete user.text_pass;
  //   return [user];
  // }

  async register(conn, connPromise, body, customerId, isCommit = true) {
    const {
      parent_id,
      username,
      password,
      role_id,
      customer_id,
      is_actived,
      is_child,
    } = body;
    const createdAt = Date.now();

    if (isCommit) {
      await connPromise.beginTransaction();
    }

    const dataParent = await this.select_(
      conn,
      tableUsers,
      "`right`",
      `id = ? FOR UPDATE`,
      parent_id
    );

    const { right } = dataParent[0];

    await this.update(
      conn,
      tableUsers,
      "`right` = `right` + 2",
      "",
      [right, 0],
      "id",
      false,
      "`right` >= ? AND is_deleted = ?"
    );

    await this.update(
      conn,
      tableUsers,
      "`left` = `left` + 2",
      "",
      [right, 0],
      "id",
      false,
      "`left` > ? AND is_deleted = ?"
    );

    const salt = await bcrypt.genSalt(12);
    const hashPass = await bcrypt.hash(password, salt);
    const user = new UsersSchema({
      parent_id: parent_id || null,
      username,
      password: hashPass,
      text_pass: password,
      is_actived,
      is_deleted: 0,
      is_main: is_child ? 0 : 1,
      is_team: 0,
      left: right,
      right: right + 1,
      created_at: createdAt,
    });
    delete user.expired_on;
    delete user.updated_at;

    const res_ = await this.insert(conn, tableUsers, user);

    const usersRole = new UsersRoleSchema({
      user_id: res_,
      role_id,
      created_at: createdAt,
    });

    delete usersRole.updated_at;
    await this.insert(conn, tableUsersRole, usersRole);

    const usersCustomers = new UsersCustomersSchema({
      user_id: res_,
      customer_id,
      created_at: createdAt,
    });

    delete usersCustomers.updated_at;
    await this.insert(conn, tableUsersCustomers, usersCustomers);

    if (isCommit) {
      await connPromise.commit();
    }
    user.id = res_;
    delete user.is_deleted;
    delete user.password;
    delete user.text_pass;
    return [user];
  }

  //RegisterTeam
  async registerTeam(conn, username, password, connPromise, body) {
    const { parent_id, name } = body;
    const createdAt = Date.now();

    await connPromise.beginTransaction();

    const dataParent = await this.select_(
      conn,
      tableUsers,
      "`right`",
      "id = ? FOR UPDATE",
      parent_id
    );

    const { right } = dataParent[0];

    await this.update(
      conn,
      tableUsers,
      "`right` = `right` + 2",
      "",
      [right, 0],
      "id",
      false,
      "`right` >= ? AND is_deleted = ?"
    );

    await this.update(
      conn,
      tableUsers,
      "`left` = `left` + 2",
      "",
      [right, 0],
      "id",
      false,
      "`left` > ? AND is_deleted = ?"
    );

    const salt = await bcrypt.genSalt(12);
    const hashPass = await bcrypt.hash(password, salt);
    const user = new UsersSchema({
      parent_id,
      username,
      password: hashPass,
      text_pass: password,
      is_actived: 1,
      is_deleted: 0,
      is_main: 0,
      is_team: 1,
      left: right,
      right: right + 1,
      created_at: createdAt,
    });
    delete user.expired_on;
    delete user.updated_at;

    const res_ = await this.insert(conn, tableUsers, user);

    const usersRole = new UsersRoleSchema({
      user_id: res_,
      role_id: 1,
      created_at: createdAt,
    });

    delete usersRole.updated_at;
    await this.insert(conn, tableUsersRole, usersRole);

    const code = makeCode();
    const customer = new CustomersSchema({
      level_id: 6,
      code,
      name,
      company: null,
      email: null,
      phone: null,
      address: null,
      tax_code: null,
      website: null,
      publish: 1,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete customer.updated_at;

    const customerId = await this.insert(conn, tableCustomers, customer);

    const usersCustomers = new UsersCustomersSchema({
      user_id: res_,
      customer_id: customerId,
      created_at: createdAt,
    });

    delete usersCustomers.updated_at;
    await this.insert(conn, tableUsersCustomers, usersCustomers);

    await connPromise.commit();
    user.id = res_;
    delete user.is_deleted;
    delete user.password;
    delete user.text_pass;
    return [user];
  }

  async registerDevices(conn, connPromise, body, params, infoUser) {
    const { id } = params;
    const { devices } = body;
    const { user_id, ip, os, gps } = infoUser;
    const listDevice = JSON.parse(devices, "[]");

    const infoReciver = await this.select(
      conn,
      tableUsers,
      "username",
      "id = ?",
      id
    );

    const listOwnerDevice = await this.select(
      conn,
      tableUsersDevices,
      "device_id",
      "user_id = ? AND device_id IN (?) AND is_main = ? AND is_deleted = ? AND is_moved = ?",
      [id, listDevice, 1, 0, 0],
      "id",
      "ASC",
      0,
      999999
    );
    let listOwnerDeviceId = [];
    if (listOwnerDevice?.length) {
      listOwnerDeviceId = listOwnerDevice.map(({ device_id }) => device_id);
    }

    const { dataAssign, dataLogs } = listDevice.reduce(
      (result, item) => {
        if (!listOwnerDeviceId.includes(item)) {
          result.dataAssign = [
            ...result.dataAssign,
            [id, item, 0, 0, 1, Date.now()],
          ];
          result.dataLogs = [
            ...result.dataLogs,
            [
              user_id,
              ip,
              os,
              gps,
              item,
              "Gán",
              JSON.stringify([`Gán cho tài khoản ${infoReciver[0].username}`]),
              0,
              Date.now(),
            ],
          ];
        }

        return result;
      },
      { dataAssign: [], dataLogs: [] }
    );

    await connPromise.beginTransaction();
    if (dataAssign?.length) {
      await this.insertDuplicate(
        conn,
        tableUsersDevices,
        "user_id,device_id,is_main,is_deleted,is_moved,created_at",
        dataAssign,
        `is_deleted=VALUES(is_deleted),is_moved=VALUES(is_moved),updated_at=VALUES(created_at)`
      );
      await vehicleModel.removeListDeviceOfUsersRedis(conn, "", listDevice);
      await deviceLoggingModel.postMulti(conn, dataLogs);
    }
    await connPromise.commit();
    return [];
  }

  async move(
    conn,
    connPromise,
    userId,
    body,
    dataRemoveOrders,
    dataAddOrders,
    listDevices,
    reciverParentId
  ) {
    const { reciver, user_is_moved } = body;
    // console.log(reciver, user_is_moved);

    await connPromise.beginTransaction();

    const newDataParent = await this.select_(
      conn,
      tableUsers,
      "`right`",
      "id = ? FOR UPDATE",
      reciver
    );

    const { right: newParentRight } = newDataParent[0];

    const oldDataUser = await this.select_(
      conn,
      tableUsers,
      "`right`,`left`",
      "id = ? FOR UPDATE",
      user_is_moved
    );

    const { right: oldRight, left: oldLeft } = oldDataUser[0];

    const width = oldRight - oldLeft + 1;

    await this.update(
      conn,
      tableUsers,
      "`right` = `right` + " + `${width}`,
      "",
      [newParentRight, 0],
      "id",
      false,
      "`right` >= ? AND is_deleted = ?"
    );

    await this.update(
      conn,
      tableUsers,
      "`left` = `left` + " + `${width}`,
      "",
      [newParentRight, 0],
      "id",
      false,
      "`left` > ? AND is_deleted = ?"
    );

    const shiftAmount = newParentRight - oldLeft;

    await this.update(
      conn,
      tableUsers,
      "`left` = `left` + " +
        `${shiftAmount}` +
        ",`right` = `right` + " +
        `${shiftAmount}`,
      "",
      [oldLeft, oldRight, 0],
      "id",
      false,
      "`left` BETWEEN ? AND ? AND is_deleted = ?"
    );

    await this.update(
      conn,
      tableUsers,
      { parent_id: reciver },
      "id",
      user_is_moved
    );

    await this.update(
      conn,
      tableUsers,
      "`right` = `right` - " + `${width}`,
      "",
      [oldRight, 0],
      "id",
      false,
      "`right` > ? AND is_deleted = ?"
    );

    await this.update(
      conn,
      tableUsers,
      "`left` = `left` - " + `${width}`,
      "",
      [oldRight, 0],
      "id",
      false,
      "`left` > ? AND is_deleted = ?"
    );

    if (listDevices.length) {
      const listDeviceId = listDevices.map(({ device_id }) => device_id);

      if (dataAddOrders?.length) {
        const dataInsertUserDevice = [];
        const dateNow = Date.now();
        const listReciver = [];
        for (let i = 0; i < dataAddOrders.length; i++) {
          const { id: user_id, customer_id } = dataAddOrders[i];
          for (let i1 = 0; i1 < listDeviceId.length; i1++) {
            const deviceID = listDeviceId[i1];
            dataInsertUserDevice.push([user_id, deviceID, 0, dateNow]);
          }
          listReciver.push(customer_id);
        }
        await ordersModel.registerTree(
          conn,
          connPromise,
          dataAddOrders,
          {
            code: makeCode(),
            devices_id: JSON.stringify(listDeviceId),
            recivers: JSON.stringify(listReciver),
            note: "Đơn hàng chuyển khách hàng",
          },
          userId,
          false
        );
      }

      if (dataRemoveOrders?.length) {
        const { listUserId, listCustomerId } = dataRemoveOrders.reduce(
          (result, { id, customer_id }) => {
            result.listUserId.push(id);
            result.listCustomerId.push(customer_id);
            return result;
          },
          {
            listUserId: [],
            listCustomerId: [],
          }
        );

        await this.update(
          conn,
          tableUsersDevices,
          { is_deleted: 1 },
          "",
          [listUserId, listDeviceId],
          "device_id",
          false,
          `user_id IN (?) AND device_id IN (?)`
        );

        const joinTableOrder = `${tableOrders} o INNER JOIN ${tableOrdersDevice} od ON o.id = od.orders_id`;

        const whereOrders = `(o.creator_customer_id IN (?) OR o.reciver IN (?)) AND od.device_id IN (?)`;
        // console.log("listDeviceId", listDeviceId);

        await this.update(
          conn,
          joinTableOrder,
          `od.is_deleted = 1`,
          "",
          [listCustomerId, listCustomerId, listDeviceId],
          "device_id",
          false,
          whereOrders
        );
      }
    }

    await connPromise.commit();
    return [];
  }

  //update
  async updateById(conn, connPromise, body, params) {
    const { parent_id, role_id, customer_id, is_actived } = body;
    const { id } = params;
    const updatedAt = Date.now();

    await connPromise.beginTransaction();

    const user = new UsersSchema({
      parent_id: parent_id || null,
      is_actived,
      updated_at: updatedAt,
    });
    delete user.username;
    delete user.password;
    delete user.is_team;
    delete user.text_pass;
    delete user.expired_on;
    delete user.is_deleted;
    delete user.created_at;
    delete user.is_main;
    delete user.left;
    delete user.right;
    await this.update(conn, tableUsers, user, "id", id);

    const usersRole = new UsersRoleSchema({
      role_id,
      updated_at: updatedAt,
    });
    delete usersRole.user_id;
    delete usersRole.created_at;
    await this.update(conn, tableUsersRole, usersRole, "user_id", id);

    const usersCustomers = new UsersCustomersSchema({
      customer_id,
      updated_at: updatedAt,
    });
    delete usersCustomers.user_id;
    delete usersCustomers.created_at;
    await this.update(conn, tableUsersCustomers, usersCustomers, "user_id", id);

    // const customer = await this.select(
    //   conn,
    //   tableCustomers,
    //   "name",
    //   "id = ?",
    //   [customer_id]
    // );

    await connPromise.commit();
    user.id = id;
    user.role_id = role_id;
    user.customer_id = customer_id;
    // user.customer_name = customer[0]?.name;
    delete user.is_deleted;
    return user;
  }

  //delete
  // async deleteById(conn, params) {
  //   const { id } = params;
  //   await this.update(conn, tableUsers, { is_deleted: Date.now() }, "id", id);
  //   return [];
  // }

  async deleteById(conn, connPromise, params) {
    const { id } = params;

    await connPromise.beginTransaction();

    const dataParent = await this.select_(
      conn,
      tableUsers,
      "`right`,`left`",
      `id = ? FOR UPDATE`,
      id
    );

    const { right, left } = dataParent[0];

    const width = right - left + 1;

    await this.update(
      conn,
      tableUsers,
      { is_deleted: Date.now() },
      "",
      [left, right, 0],
      "ID",
      true,
      "`left` BETWEEN ? AND ? AND is_deleted = ?"
    );

    await this.update(
      conn,
      tableUsers,
      "`right` = `right` - " + `${width}`,
      "",
      [right, 0],
      "id",
      false,
      "`right` > ? AND is_deleted = ?"
    );

    await this.update(
      conn,
      tableUsers,
      "`left` = `left` - " + `${width}`,
      "",
      [right, 0],
      "id",
      false,
      "`left` > ? AND is_deleted = ?"
    );

    await this.delToken(id);

    await connPromise.commit();
    return [];
  }

  //delete device
  async deleteDevice(conn, connPromise, params, body, infoUser) {
    const { id: userId } = params;
    const { device_id } = body;

    await connPromise.beginTransaction();
    const infoReciver = await this.select(
      conn,
      tableUsers,
      "username",
      "id = ?",
      userId
    );
    await this.update(
      conn,
      tableUsersDevices,
      { is_deleted: 1 },
      "",
      [userId, device_id, 0],
      "ID",
      true,
      "user_id = ? AND device_id = ? AND is_main = ?"
    );
    await vehicleModel.removeListDeviceOfUsersRedis(conn, device_id);
    const dataSaveLog = {
      ...infoUser,
      device_id,
      action: "Gỡ",
      des: JSON.stringify([
        `Gỡ gán thiết bị khỏi tài ${infoReciver[0].username}`,
      ]),
      createdAt: Date.now(),
    };
    await deviceLoggingModel.postOrDelete(conn, dataSaveLog);
    await connPromise.commit();
    return [];
  }

  //reset pass
  async resetPass(conn, params) {
    const { id } = params;
    const salt = await bcrypt.genSalt(12);
    const hashPass = await bcrypt.hash(PASSWORD_DEFAULT, salt);
    await this.update(
      conn,
      tableUsers,
      { password: hashPass, text_pass: PASSWORD_DEFAULT },
      "id",
      id,
      "Tài khoản"
    );
    await this.delToken(id);

    return [{ new_password: PASSWORD_DEFAULT }];
  }

  //change pass
  async changePass(conn, connPromise, body, userId, hashPass, infoUser) {
    const { new_password, old_password } = body;
    await connPromise.beginTransaction();
    await this.update(
      conn,
      tableUsers,
      { password: hashPass, text_pass: new_password },
      "id",
      userId
    );
    const dataSaveLog = {
      ...infoUser,
      module: users,
      des: `Thay đổi mật khẩu ${old_password} ===> ${new_password}`,
      createdAt: Date.now(),
    };
    await writeLogModel.post(conn, dataSaveLog);

    await this.delToken(userId);

    await connPromise.commit();
    return [];
  }

  //loginCustomer
  async loginCustomer(id, parentId, role, level, customer_id, isMain) {
    const clientId = uuidv4();
    const keyToken = md5(Date.now());
    const keyRefreshToken = md5(Date.now() + 1);

    const token = await makeAccessToken(
      {
        userId: id,
        parentId,
        clientId,
        role,
        level,
        customerId: customer_id,
        isMain,
      },
      keyToken
    );

    await hSet(
      REDIS_KEY_TOKEN,
      `${id}/${clientId}`,
      JSON.stringify({
        publish_key_token: keyToken,
        publish_key_refresh_token: keyRefreshToken,
      })
    );
    // console.log("token", token);

    return [
      {
        token,
        parentId,
        userId: id,
        role,
        level,
        customerId: customer_id,
        isMain,
      },
    ];
  }

  //login
  async login(conn, body, id, parentId, role, level, customer_id, isMain) {
    const clientId = uuidv4();
    const keyToken = md5(Date.now());
    const keyRefreshToken = md5(Date.now() + 1);

    const token = await makeAccessToken(
      {
        userId: id,
        parentId,
        clientId,
        role,
        level,
        customerId: customer_id,
        isMain,
      },
      keyToken
    );

    const refreshToken = await makeRefreshToken(
      {
        userId: id,
        parentId,
        clientId,
        role,
        level,
        customerId: customer_id,
        isMain,
      },
      keyRefreshToken
    );
    // console.log(98765432);

    const deviceToken = body?.device_token;

    if (deviceToken) {
      await tokenFirebaseModel.register(conn, {
        user_id: id,
        client_id: clientId,
        token: body?.device_token,
      });
    }

    // await keyTokenModel.register(conn, {
    //   user_id: id,
    //   client_id: clientId,
    //   publish_key_token: keyToken,
    //   publish_key_refresh_token: keyRefreshToken,
    // });

    // console.log(1234567);

    // await hSet(
    //   REDIS_KEY_TOKEN,
    //   clientId,
    //   JSON.stringify({
    //     user_id: id,
    //     publish_key_token: keyToken,
    //     publish_key_refresh_token: keyRefreshToken,
    //   })
    // );

    await hSet(
      REDIS_KEY_TOKEN,
      `${id}/${clientId}`,
      JSON.stringify({
        publish_key_token: keyToken,
        publish_key_refresh_token: keyRefreshToken,
      })
    );

    return [
      {
        token,
        refreshToken,
        parentId,
        userId: id,
        role,
        level,
        customerId: customer_id,
        isMain,
      },
    ];
  }

  //refreshToken
  async refreshToken(conn, body) {
    const { refresh_token } = body;
    const { data, keyRefreshToken } = await checkToken(
      refresh_token,
      REFRESH_TOKEN_SECRET_KEY,
      false
    );

    const keyToken = md5(Date.now());
    const { userId, parentId, role, clientId, level, customerId, isMain } =
      data;

    const dataInfo = await this.select(
      conn,
      tableUsers,
      "is_actived,is_deleted",
      "id = ?",
      userId
    );
    await validateModel.checkStatusUser(
      dataInfo[0].is_actived,
      dataInfo[0].is_deleted
    );

    const token = await makeAccessToken(
      {
        userId,
        parentId,
        role,
        clientId,
        level,
        customerId,
        isMain,
      },
      keyToken
    );

    // await keyTokenModel.updateById(
    //   {
    //     publish_key_token: keyToken,
    //   },
    //   { client_id: clientId }
    // );

    // await setRedis(
    //   clientId,
    //   JSON.stringify({
    //     user_id: userId,
    //     publish_key_token: keyToken,
    //     publish_key_refresh_token: keyRefreshToken,
    //   })
    // );

    // await hSet(
    //   REDIS_KEY_TOKEN,
    //   clientId,
    //   JSON.stringify({
    //     user_id: userId,
    //     publish_key_token: keyToken,
    //     publish_key_refresh_token: keyRefreshToken,
    //   })
    // );

    await hSet(
      REDIS_KEY_TOKEN,
      `${userId}/${clientId}`,
      JSON.stringify({
        publish_key_token: keyToken,
        publish_key_refresh_token: keyRefreshToken,
      })
    );

    return [{ token }];
  }

  //logout
  async logout(conn, clientId, usersId) {
    // await keyTokenModel.deleteById(conn, {
    //   client_id: clientId,
    // });

    await tokenFirebaseModel.deleteById(conn, {
      client_id: clientId,
      user_id: usersId,
    });

    await hdelOneKey(REDIS_KEY_TOKEN, `${usersId}/${clientId}`);

    return [];
  }

  async updateActive(conn, body, params) {
    const { id } = params;
    const { is_actived } = body;
    await this.update(conn, tableUsers, { is_actived }, "id", id);
    if (is_actived == 0) {
      await this.delToken(id);
    }
    return [];
  }

  async updateUsername(conn, body, userId) {
    const { username } = body;
    await this.update(conn, tableUsers, { username }, "id", userId);

    await this.delToken(userId);

    return [];
  }
}

module.exports = new UsersModel();
