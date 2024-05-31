const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const UsersModel = require("../models/users.model");
const UsersRoleModel = require("../models/usersRole.model");
const UsersCustomersModel = require("../models/usersCustomers.model");
const { v4: uuidv4 } = require("uuid");
const md5 = require("md5");
const keyTokenService = require("./keyToken.service");

const {
  ERROR,
  VALIDATE_ACCOUNT,
  ALREADY_EXITS,
  VALIDATE_PASS,
  PASSWORD_DEFAULT,
  NOT_EXITS,
  NOT_ACTIVE_ACCOUNT,
  DELETED_ACCOUNT,
  PASS_OLD_FAILED,
  ACCOUNT_FAILED,
  PASS_FAILED,
  REFRESH_TOKEN_SECRET_KEY,
} = require("../constants");
const { regexAccount, regexPass } = require("../ultils/regex");
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
const { set: setRedis, expire: expireRedis } = require("./redis.service");
const { BusinessLogicError } = require("../core/error.response");

class UsersService extends DatabaseService {
  constructor() {
    super();
  }

  async validate(conn, username, password, id = null) {
    const errors = [];

    if (!regexAccount(username)) {
      errors.push({
        value: username,
        msg: VALIDATE_ACCOUNT,
        param: "username",
      });
    }

    if (password && !regexPass(password)) {
      errors.push({
        value: password,
        msg: VALIDATE_PASS,
        param: "password",
      });
    }

    if (errors.length)
      return {
        result: false,
        errors: {
          msg: ERROR,
          errors,
        },
      };

    let where = `username = ? AND is_deleted = ?`;
    const conditions = [username, 0];

    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await this.select(
      conn,
      tableName,
      "id",
      where,
      conditions
    );

    if (dataCheck.length <= 0) return { result: true };

    return {
      result: false,
      errors: {
        msg: ERROR,
        errors: [
          {
            value: username,
            msg: `Tài khoản ${ALREADY_EXITS}`,
            param: "username",
          },
        ],
      },
    };
  }

  //getallrow
  async getallrows(query) {
    try {
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
      const joinTable = `${tableName} INNER JOIN ${tableUsersRole} ON ${tableName}.id = ${tableUsersRole}.user_id`;
      const selectData = `${tableName}.id,${tableName}.username,${tableName}.parent_id,${tableName}.is_actived,${tableUsersRole}.role_id`;

      const { conn } = await db.getConnection();
      const res_ = await this.select(
        conn,
        joinTable,
        selectData,
        where,
        conditions
      );
      conn.release();
      return res_;
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  async getInfo(userId) {
    try {
      const where = `${tableName}.is_deleted = ? AND ${tableName}.id = ?`;
      const conditions = [0, userId];
      const joinTable = `${tableName} INNER JOIN ${tableUsersRole} ON ${tableName}.id = ${tableUsersRole}.user_id 
      INNER JOIN ${tableUsersCustomers} ON ${tableName}.id = ${tableUsersCustomers}.user_id 
      INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id`;
      const selectData = `${tableName}.id,${tableName}.username,${tableName}.parent_id,${tableName}.is_actived,${tableUsersRole}.role_id,${tableCustomers}.name as customer_name,${tableCustomers}.email,${tableCustomers}.phone,${tableCustomers}.company,${tableCustomers}.address,${tableCustomers}.tax_code,${tableCustomers}.website`;

      const { conn } = await db.getConnection();
      const res_ = await this.select(
        conn,
        joinTable,
        selectData,
        where,
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
  async register(body) {
    const { conn, connPromise } = await db.getConnection();
    try {
      const {
        parent_id,
        username,
        password,
        role_id,
        customer_id,
        is_actived,
      } = body;
      const createdAt = Date.now();

      const isCheck = await this.validate(conn, username, password);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const salt = await bcrypt.genSalt(12);
      const hashPass = await bcrypt.hash(password, salt);
      const user = new UsersModel({
        parent_id: parent_id || null,
        username,
        password: hashPass,
        text_pass: password,
        is_actived,
        is_deleted: 0,
        created_at: createdAt,
      });
      delete user.expired_on;
      delete user.updated_at;

      await connPromise.beginTransaction();
      const res_ = await this.insert(conn, tableName, user);

      const usersRole = new UsersRoleModel({
        user_id: res_,
        role_id,
        created_at: createdAt,
      });

      delete usersRole.updated_at;
      await this.insert(conn, tableUsersRole, usersRole);

      const usersCustomers = new UsersCustomersModel({
        user_id: res_,
        customer_id,
        created_at: createdAt,
      });

      delete usersCustomers.updated_at;
      await this.insert(conn, tableUsersCustomers, usersCustomers);

      await connPromise.commit();
      conn.release();
      // user.id = res_;
      // delete user.is_deleted;
      // delete user.is_deleted;
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
      const { parent_id, role_id, customer_id, is_actived } = body;
      const { id } = params;
      const updatedAt = Date.now();
      await connPromise.beginTransaction();

      const user = new UsersModel({
        parent_id: parent_id || null,
        is_actived,
        updated_at: updatedAt,
      });
      delete user.username;
      delete user.password;
      delete user.text_pass;
      delete user.expired_on;
      delete user.is_deleted;
      delete user.created_at;
      await this.update(conn, tableName, user, "id", id);

      const usersRole = new UsersRoleModel({
        role_id,
        updated_at: updatedAt,
      });
      delete usersRole.user_id;
      delete usersRole.created_at;
      await this.update(conn, tableUsersRole, usersRole, "user_id", id);

      const usersCustomers = new UsersCustomersModel({
        customer_id,
        updated_at: updatedAt,
      });
      delete usersCustomers.user_id;
      delete usersCustomers.created_at;
      await this.update(
        conn,
        tableUsersCustomers,
        usersCustomers,
        "user_id",
        id
      );

      // const customer = await this.select(
      //   conn,
      //   tableCustomers,
      //   "name",
      //   "id = ?",
      //   [customer_id]
      // );

      await connPromise.commit();
      conn.release();
      user.id = id;
      user.role_id = role_id;
      user.customer_id = customer_id;
      // user.customer_name = customer[0]?.name;
      delete user.is_deleted;
      return user;
    } catch (error) {
      await connPromise.rollback();
      throw new BusinessLogicError(error.msg);
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

  //reset pass
  async resetPass(params) {
    try {
      const { id } = params;
      const { conn } = await db.getConnection();
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
      conn.release();
      return [{ new_password: PASSWORD_DEFAULT }];
    } catch (error) {
      const { msg } = error;
      throw new BusinessLogicError(msg);
    }
  }

  //change pass
  async changePass(body, params) {
    try {
      const { id } = params;
      const { new_password, old_password } = body;
      const { conn } = await db.getConnection();

      const dataInfo = await this.select(
        conn,
        tableName,
        "password,is_actived,is_deleted",
        "id = ?",
        [id]
      );

      if (dataInfo?.length <= 0)
        throw {
          msg: ERROR,
          errors: [
            {
              value: "",
              msg: `Tài khoản ${NOT_EXITS}`,
              param: "",
            },
          ],
        };
      if (dataInfo[0].is_actived === 0)
        throw {
          msg: NOT_ACTIVE_ACCOUNT,
          errors: [
            {
              value: "",
              msg: NOT_ACTIVE_ACCOUNT,
              param: "",
            },
          ],
        };
      if (dataInfo[0].is_deleted === 1)
        throw {
          msg: DELETED_ACCOUNT,
          errors: [
            {
              value: "",
              msg: DELETED_ACCOUNT,
              param: "",
            },
          ],
        };

      const match = await bcrypt.compare(old_password, dataInfo[0].password);
      if (!match)
        throw {
          msg: ERROR,
          errors: [
            {
              value: old_password,
              msg: PASS_OLD_FAILED,
              param: "old_password",
            },
          ],
        };

      if (!regexPass(new_password))
        throw {
          msg: ERROR,
          errors: [
            {
              value: new_password,
              msg: VALIDATE_PASS,
              param: "new_password",
            },
          ],
        };

      const salt = await bcrypt.genSalt(12);
      const hashPass = await bcrypt.hash(new_password, salt);

      await this.update(
        conn,
        tableName,
        { password: hashPass, text_pass: new_password },
        "id",
        id
      );
      conn.release();
      return [];
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //login
  async login(body) {
    try {
      const { username, password, device_token } = body;
      const { conn } = await db.getConnection();

      if (!regexAccount(username))
        throw {
          msg: ERROR,
          errors: [
            {
              value: username,
              msg: ACCOUNT_FAILED,
              param: "username",
            },
          ],
        };

      if (!regexPass(password))
        throw {
          msg: ERROR,
          errors: [
            {
              value: password,
              msg: PASS_FAILED,
              param: "password",
            },
          ],
        };

      const joinTable = `${tableName} INNER JOIN ${tableUsersRole} ON ${tableName}.id = ${tableUsersRole}.user_id INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id INNER JOIN ${tableUsersCustomers} ON ${tableName}.id = ${tableUsersCustomers}.user_id INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id INNER JOIN ${tableLevel} ON ${tableCustomers}.level_id = ${tableLevel}.id`;
      const dataaUser = await this.select(
        conn,
        joinTable,
        `${tableName}.id,${tableName}.password,${tableName}.is_actived,${tableName}.is_deleted,${tableRole}.sort as role,${tableCustomers}.id as customer_id,${tableLevel}.sort as level`,
        "username = ?",
        [username]
      );
      console.log({ dataaUser });
      if (dataaUser?.length <= 0)
        throw {
          msg: ERROR,
          errors: [
            {
              value: username,
              msg: ACCOUNT_FAILED,
              param: "username",
            },
          ],
        };

      const {
        id,
        password: passwordDB,
        is_actived,
        is_deleted,
        role,
        level,
        customer_id,
      } = dataaUser[0];

      if (is_actived === 0)
        throw {
          msg: ERROR,
          errors: [
            {
              value: username,
              msg: NOT_ACTIVE_ACCOUNT,
              param: "username",
            },
          ],
        };

      if (is_deleted === 1)
        throw {
          msg: ERROR,
          errors: [
            {
              value: username,
              msg: DELETED_ACCOUNT,
              param: "username",
            },
          ],
        };

      const match = await bcrypt.compare(password, passwordDB);
      if (!match)
        throw {
          msg: ERROR,
          errors: [
            {
              value: password,
              msg: PASS_FAILED,
              param: "password",
            },
          ],
        };

      const clientId = uuidv4();
      const keyToken = md5(Date.now());
      const keyRefreshToken = md5(Date.now() + 1);

      const token = await makeAccessToken(
        {
          userId: id,
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
          clientId,
          role,
          level,
          customerId: customer_id,
        },
        keyRefreshToken
      );
      await keyTokenService.register({
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

      conn.release();

      return [
        {
          token,
          refreshToken,
          userId: id,
          role,
          level,
          customerId: customer_id,
        },
      ];
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //refreshToken
  async refreshToken(body) {
    try {
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

      await keyTokenService.updateById(
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
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //logout
  async logout(clientId) {
    try {
      await keyTokenService.deleteById({
        client_id: clientId,
      });

      await expireRedis(clientId, 0);

      return [];
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new UsersService();
