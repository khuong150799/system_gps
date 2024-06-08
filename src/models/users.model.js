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
} = require("../constants");
const tableName = "tbl_users";
const tableCustomers = "tbl_customers";
const tableLevel = "tbl_level";
const tableUsersCustomers = "tbl_users_customers";
const tableRole = "tbl_role";
const tableUsersRole = "tbl_users_role";

const bcrypt = require("bcrypt");
const {
  makeAccessToken,
  makeRefreshToken,
  checkToken,
} = require("../helper/auth.helper");
const { set: setRedis, expire: expireRedis } = require("./redis.model");

const CustomersSchema = require("./schema/customers.schema");
const { makeCode } = require("../ultils/makeCode");
const { tableUsersDevices } = require("../constants/tableName");

class UsersModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    let where = `${tableName}.is_deleted = ?`;
    const conditions = [isDeleted];

    if (query.keyword) {
      where += ` AND (${tableName}.name LIKE ? OR ${tableCustomers}.name LIKE ?)`;
      conditions.push(`%${query.keyword}%`, `%${query.keyword}%`);
    }

    if (query.level_id) {
      where += ` AND ${tableCustomers}.level_id = ?`;
      conditions.push(query.level_id);
    }

    if (query.role_id) {
      where += ` AND ${tableUsersRole}.role_id = ?`;
      conditions.push(query.role_id);
    }

    const joinTable = `${tableName} INNER JOIN ${tableUsersCustomers} ON ${tableName}.id = ${tableUsersCustomers}.user_id INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id INNER JOIN ${tableUsersRole} ON ${tableName}.id = ${tableUsersRole}.user_id INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id INNER JOIN ${tableLevel} ON ${tableCustomers}.level_id = ${tableLevel}.id `;

    const select = `${tableName}.id,${tableName}.username,${tableCustomers}.name as customer_name,${tableLevel}.name as level_name,${tableRole}.name as role_name,${tableName}.created_at,${tableName}.updated_at`;

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
    const joinTable = `${tableName} INNER JOIN ${tableUsersRole} ON ${tableName}.id = ${tableUsersRole}.user_id`;
    const selectData = `${tableName}.id,${tableName}.username,${tableName}.parent_id,${tableName}.is_actived,${tableUsersRole}.role_id`;

    const res_ = await this.select(
      conn,
      joinTable,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  async getInfo(conn, userId) {
    const where = `${tableName}.is_deleted = ? AND ${tableName}.id = ?`;
    const conditions = [0, userId];
    const joinTable = `${tableName} INNER JOIN ${tableUsersRole} ON ${tableName}.id = ${tableUsersRole}.user_id 
      INNER JOIN ${tableUsersCustomers} ON ${tableName}.id = ${tableUsersCustomers}.user_id 
      INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id`;
    const selectData = `${tableName}.id,${tableName}.username,${tableName}.parent_id,${tableName}.is_actived,${tableUsersRole}.role_id,${tableCustomers}.name as customer_name,${tableCustomers}.email,${tableCustomers}.phone,${tableCustomers}.company,${tableCustomers}.address,${tableCustomers}.tax_code,${tableCustomers}.website`;

    const res_ = await this.select(
      conn,
      joinTable,
      selectData,
      where,
      conditions,
      `${tableName}.id`
    );
    return res_;
  }
  //Register
  async register(conn, connPromise, body, customerId, isCommit = true) {
    const { parent_id, username, password, role_id, customer_id, is_actived } =
      body;
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
      is_main: Number(customerId) === Number(customer_id) ? 0 : 1,
      is_team: 0,
      created_at: createdAt,
    });
    delete user.expired_on;
    delete user.updated_at;
    if (isCommit) {
      await connPromise.beginTransaction();
    }
    const res_ = await this.insert(conn, tableName, user);

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
  async registerTeam(conn, username, password, connPromise, body, userId) {
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
    const res_ = await this.insert(conn, tableName, user);

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

  async registerDevices(conn, body, params) {
    const { id } = params;
    const { devices } = body;
    const listDevice = JSON.parse(devices);

    const dataInsert = listDevice.map((item) => [
      id,
      item,
      0,
      0,
      1,
      Date.now(),
    ]);
    await this.insertDuplicate(
      conn,
      tableUsersDevices,
      "user_id,device_id,is_main,is_deleted,is_moved,created_at",
      dataInsert,
      `is_deleted=VALUES(is_deleted),is_moved=VALUES(is_moved)`
    );
    return [];
  }

  //update
  async updateById(conn, connPromise, body, params, userId) {
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
    await this.update(conn, tableName, user, "id", id);

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
    await this.update(conn, tableName, { is_deleted: 1 }, "id", id);
    return [];
  }

  //reset pass
  async resetPass(conn, params) {
    const { id } = params;
    const salt = await bcrypt.genSalt(12);
    const hashPass = await bcrypt.hash(PASSWORD_DEFAULT, salt);
    await this.update(
      conn,
      tableName,
      { password: hashPass, text_pass: PASSWORD_DEFAULT },
      "id",
      id,
      "Tài khoản"
    );
    return [{ new_password: PASSWORD_DEFAULT }];
  }

  //change pass
  async changePass(conn, body, userId, hashPass) {
    const { new_password } = body;

    await this.update(
      conn,
      tableName,
      { password: hashPass, text_pass: new_password },
      "id",
      userId
    );
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
    await keyTokenModel.register(conn, {
      user_id: id,
      client_id: clientId,
      publish_key_token: keyToken,
      publish_key_refresh_token: keyRefreshToken,
    });

    await setRedis(
      clientId,
      JSON.stringify({
        user_id: id,
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
      },
    ];
  }

  //refreshToken
  async refreshToken(body) {
    const { refresh_token } = body;
    const { data, keyRefreshToken } = await checkToken(
      refresh_token,
      REFRESH_TOKEN_SECRET_KEY,
      false
    );
    const keyToken = md5(Date.now());
    const { userId, role, clientId, level, customerId } = data;

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

    await keyTokenModel.updateById(
      {
        publish_key_token: keyToken,
      },
      { client_id: clientId }
    );

    await setRedis(
      clientId,
      JSON.stringify({
        user_id: userId,
        publish_key_token: keyToken,
        publish_key_refresh_token: keyRefreshToken,
      })
    );

    return [{ token }];
  }

  //logout
  async logout(clientId) {
    await keyTokenModel.deleteById({
      client_id: clientId,
    });

    await expireRedis(clientId, 0);

    return [];
  }
}

module.exports = new UsersModel();
