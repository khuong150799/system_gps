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
  ERROR,
  ERROR_STRUCTURE_MOVE_AGENCY,
} = require("../constants/msg.constant");

const bcrypt = require("bcrypt");
const {
  makeAccessToken,
  makeRefreshToken,
  checkToken,
} = require("../helper/auth.helper");
const { set: setRedis, expire: expireRedis } = require("./redis.model_");

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
} = require("../constants/tableName.constant");
const validateModel = require("./validate.model");
const vehicleModel = require("./vehicle.model");
const deviceLoggingModel = require("./deviceLogging.model");
const writeLogModel = require("./writeLog.model");
const { users } = require("../constants/module.constant");
const { hSet } = require("./redis.model");
const { REDIS_KEY_TOKEN } = require("../constants/redis.constant");

class UsersModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;

    const { keyword, level_id, role_id } = query;
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

  async getListWithUser(conn, query, userId) {
    const { is_deleted, user_id } = query;

    const isDeleted = is_deleted || 0;

    const where = `parent_id = ? AND ${tableUsers}.is_deleted = ?`;
    const chosseUser = user_id || userId;

    const conditions = [chosseUser, isDeleted];
    const whereDequy = `AND ${tableUsers}.is_deleted = ${isDeleted}`;

    let joinTable = `${tableUsers} INNER JOIN ${tableUsersCustomers} ON ${tableUsers}.id = ${tableUsersCustomers}.user_id 
      INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id`;

    let select = `${tableUsers}.id,${tableUsers}.username,${tableUsers}.is_main,${tableUsers}.parent_id,${tableUsers}.is_team,${tableCustomers}.name as customer_name,${tableCustomers}.id as customer_id`;

    const res_ = await this.getAllRowsMenu(
      conn,
      joinTable,
      select,
      where,
      conditions,
      `${tableUsers}.id`,
      "ASC",
      select,
      whereDequy,
      `${tableUsers}.id`,
      "ASC"
    );
    return res_;
  }

  //getDeviceAdd
  async getDeviceAdd(conn, query, userId) {
    const { user_id, is_deleted } = query;
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
      "d.id"
    );
    return res_;
  }

  async getInfo(conn, userId) {
    const where = `${tableUsers}.is_deleted = ? AND ${tableUsers}.id = ?`;
    const conditions = [0, userId];
    const joinTable = `${tableUsers} INNER JOIN ${tableUsersRole} ON ${tableUsers}.id = ${tableUsersRole}.user_id 
      INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id  
      INNER JOIN ${tableUsersCustomers} ON ${tableUsers}.id = ${tableUsersCustomers}.user_id 
      INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id 
      INNER JOIN ${tableLevel} ON ${tableCustomers}.level_id = ${tableLevel}.id`;

    const selectData = `${tableUsers}.id,${tableUsers}.username,${tableUsers}.parent_id,${tableUsers}.is_actived,
      ${tableUsersRole}.role_id,${tableRole}.name as role_name,${tableCustomers}.level_id,${tableLevel}.name as level_name,${tableCustomers}.name as customer_name,${tableCustomers}.email,${tableCustomers}.phone,
      ${tableCustomers}.company,${tableCustomers}.address,${tableCustomers}.tax_code,${tableCustomers}.website,${tableCustomers}.id as customer_id`;

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
      created_at: createdAt,
    });
    delete user.expired_on;
    delete user.updated_at;
    if (isCommit) {
      await connPromise.beginTransaction();
    }
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
      created_at: createdAt,
    });
    delete user.expired_on;
    delete user.updated_at;

    await connPromise.beginTransaction();
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
    const { dataAssign, dataLogs } = listDevice.reduce(
      (result, item) => {
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
        return result;
      },
      { dataAssign: [], dataLogs: [] }
    );

    await connPromise.beginTransaction();
    await this.insertDuplicate(
      conn,
      tableUsersDevices,
      "user_id,device_id,is_main,is_deleted,is_moved,created_at",
      dataAssign,
      `is_deleted=VALUES(is_deleted),is_moved=VALUES(is_moved)`
    );
    await vehicleModel.removeListDeviceOfUsersRedis(conn, "", listDevice);
    await deviceLoggingModel.postMulti(conn, dataLogs);
    await connPromise.commit();
    return [];
  }

  async move(conn, connPromise, body) {
    const { reciver, user_is_moved } = body;

    const joinTableUsers = `${tableUsers} u1 INNER JOIN ${tableUsers} u2 ON u1.parent_id = u2.id`;
    const whereTableUsers = "u1.id = ?";
    const conditionTableUsers = [user_is_moved];
    const selectTableUsers = "u2.parent_id,u2.id";

    const [listDevices, infoUserMove, infoReciver] = await Promise.all([
      this.select(
        conn,
        tableUsersDevices,
        "device_id",
        "user_id = ?",
        user_is_moved,
        "id",
        "ASC",
        0,
        1000000000
      ),
      this.select(
        conn,
        joinTableUsers,
        selectTableUsers,
        whereTableUsers,
        conditionTableUsers,
        "u2.id"
      ),
      this.select(conn, tableUsers, "parent_id", "id = ?", reciver),
    ]);

    await connPromise.beginTransaction();
    await this.update(
      conn,
      tableUsers,
      { parent_id: reciver },
      "id",
      user_is_moved
    );

    if (listDevices.length) {
      if (infoUserMove[0]?.parent_id == infoReciver[0]?.parent_id)
        throw { msg: ERROR, errors: [{ msg: ERROR_STRUCTURE_MOVE_AGENCY }] };
      if (infoUserMove[0]?.parent_id == infoReciver[0]?.parent_id) {
        await this.update(
          conn,
          tableUsersDevices,
          { is_deleted: 1 },
          "",
          [infoUserMove[0]?.id, listDevices],
          "ID",
          false,
          `user_id = ? device_id IN (?)`
        );

        await vehicleModel.removeListDeviceOfUsersRedis(conn, "", [
          infoUserMove[0].id,
          reciver,
        ]);
      }

      const dataInsert = listDevices.map((item) => [
        reciver,
        item.device_id,
        1,
        0,
        1,
        Date.now(),
      ]);

      await this.insertDuplicate(
        conn,
        tableUsersDevices,
        "user_id,device_id,is_main,is_deleted,is_moved,created_at",
        dataInsert,
        "is_main=VALUES(is_main),is_deleted=VALUES(is_deleted),is_moved=VALUES(is_moved)"
      );
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
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableUsers, { is_deleted: Date.now() }, "id", id);
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
    return [{ new_password: PASSWORD_DEFAULT }];
  }

  //change pass
  async changePass(conn, connPromise, body, userId, hashPass, infoUser) {
    const { new_password } = body;
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
      des: `Thay đổi mật khẩu`,
      createdAt: Date.now(),
    };
    await writeLogModel.post(conn, dataSaveLog);
    await connPromise.commit();
    return [];
  }

  //login
  async login(conn, id, parentId, role, level, customer_id) {
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
      },
      keyRefreshToken
    );
    // console.log(98765432);

    // await keyTokenModel.register(conn, {
    //   user_id: id,
    //   client_id: clientId,
    //   publish_key_token: keyToken,
    //   publish_key_refresh_token: keyRefreshToken,
    // });

    // console.log(1234567);

    await hSet(
      REDIS_KEY_TOKEN,
      clientId,
      JSON.stringify({
        user_id: id,
        publish_key_token: keyToken,
        publish_key_refresh_token: keyRefreshToken,
      })
    );

    // await setRedis(
    //   clientId,
    //   JSON.stringify({
    //     user_id: id,
    //     publish_key_token: keyToken,
    //     publish_key_refresh_token: keyRefreshToken,
    //   })
    // );
    return [
      {
        token,
        refreshToken,
        parentId,
        userId: id,
        role,
        level,
        customerId: customer_id,
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
    const { userId, role, clientId, level, customerId } = data;

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
        clientId,
        role,
        level,
        customerId,
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

    await hSet(
      REDIS_KEY_TOKEN,
      clientId,
      JSON.stringify({
        user_id: id,
        publish_key_token: keyToken,
        publish_key_refresh_token: keyRefreshToken,
      })
    );

    return [{ token }];
  }

  //logout
  async logout(conn, clientId) {
    // await keyTokenModel.deleteById(conn, {
    //   client_id: clientId,
    // });

    await expireRedis(clientId, -1);

    return [];
  }

  async updateActive(conn, body, params) {
    const { id } = params;
    const { is_actived } = body;
    await this.update(conn, tableUsers, { is_actived }, "id", id);
    return [];
  }
}

module.exports = new UsersModel();
