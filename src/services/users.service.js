const db = require("../dbs/init.mysql");

const {
  ERROR,
  PASS_OLD_FAILED,
  ACCOUNT_FAILED,
  NOT_ADD_DEVICE,
} = require("../constants/msg.contant");

const bcrypt = require("bcrypt");

const { BusinessLogicError } = require("../core/error.response");
const makeUsername = require("../ultils/makeUsername");

const DatabaseModel = require("../models/database.model");
const usersModel = require("../models/users.model");
const validateModel = require("../models/validate.model");
const {
  tableUsers,
  tableCustomers,
  tableRole,
  tableUsersRole,
  tableUsersCustomers,
  tableLevel,
} = require("../constants/tableName.contant");

const databaseModel = new DatabaseModel();

class UsersService {
  async validateComparePass(compare, isCompared, param) {
    let errors = [];
    const match = await bcrypt.compare(compare, isCompared);
    if (!match) {
      errors = {
        msg: ERROR,
        errors: [
          {
            value: compare,
            msg: PASS_OLD_FAILED,
            param,
          },
        ],
      };
    }

    if (Object.keys(errors).length) return { result: false, errors };

    return { result: true };
  }

  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.getallrows(conn, query);
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

  async getallChild(query, customerId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.getallChild(conn, query, customerId);
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

  async getListWithUser(query, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.getListWithUser(conn, query, userId);
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
  // async getById(params, query) {
  //   try {
  //     const { conn } = await db.getConnection();
  //     try {
  //       const data = await usersModel.getById(conn, params, query);
  //       return data;
  //     } catch (error) {
  //       throw error;
  //     } finally {
  //       conn.release();
  //     }
  //   } catch (error) {
  //     throw new BusinessLogicError(error.msg);
  //   }
  // }

  async getInfo(userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.getInfo(conn, userId);
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

  async move(body, userId) {
    try {
      const { reciver, user_is_moved } = body;
      const { conn, connPromise } = await db.getConnection();
      try {
        if (Number(userId) === Number(user_is_moved)) throw "lỗi";

        await validateModel.CheckIsChild(
          connPromise,
          userId,
          reciver,
          "reciver"
        );

        await validateModel.CheckIsChild(
          connPromise,
          userId,
          user_is_moved,
          "user_is_moved"
        );

        const data = await usersModel.move(conn, connPromise, body);
        return data;
      } catch (error) {
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

  //Register
  async register(body, userId, customerId, role) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { parent_id, username, password, role_id } = body;

        await validateModel.checkRegexUsername(username);

        await validateModel.checkRegexPassword(password, true);

        await validateModel.CheckIsChild(connPromise, userId, parent_id);

        await validateModel.checkParentAndChildPermission(
          conn,
          tableRole,
          role,
          role_id,
          "vai trò này",
          "role_id"
        );

        await validateModel.checkExitValue(
          conn,
          tableUsers,
          "username",
          username,
          "Tài khoản",
          "username"
        );

        const data = await usersModel.register(
          conn,
          connPromise,
          body,
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
      console.log(error);
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //RegisterTeam
  async registerTeam(body, userId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { parent_id, name } = body;

        await validateModel.CheckIsChild(connPromise, userId, parent_id);

        const username = `${makeUsername(name)}${Date.now()}`;
        const password = `Mv${Date.now()}`;

        await validateModel.checkExitValue(
          conn,
          tableUsers,
          "username",
          username,
          "Tài khoản",
          "username"
        );

        const data = await usersModel.registerTeam(
          conn,
          username,
          password,
          connPromise,
          body,
          userId
        );

        return data;
      } catch (error) {
        // console.log(error);
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

  async registerDevices(body, params, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { devices } = body;
        const { id } = params;
        const listDevices = JSON.parse(devices);

        if (Number(id) === Number(userId))
          throw {
            msg: ERROR,
            errors: [
              { value: listDevices, msg: NOT_ADD_DEVICE, param: "devices" },
            ],
          };

        await validateModel.checkOwnerDevice(conn, userId, listDevices);
        const data = await usersModel.registerDevices(conn, body, params);
        return data;
      } catch (error) {
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
  async updateById(body, params, userId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { parent_id } = body;

        await validateModel.CheckIsChild(connPromise, userId, parent_id);

        const data = await usersModel.updateById(
          conn,
          connPromise,
          body,
          params,
          userId
        );

        return data;
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //delete
  async deleteById(params, userId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        await validateModel.CheckIsChild(connPromise, userId, id);

        await usersModel.deleteById(conn, params);
        return [];
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      throw new BusinessLogicError(error.msg);
    }
  }

  //reset pass
  async resetPass(params, userId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        await validateModel.CheckIsChild(connPromise, userId, id);

        const data = await usersModel.resetPass(conn, params);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      const { msg } = error;
      throw new BusinessLogicError(msg);
    }
  }

  //change pass
  async changePass(body, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { new_password, old_password } = body;

        await validateModel.checkRegexPassword(old_password);

        await validateModel.checkRegexPassword(new_password, true);

        if (!isCheckNewPassword.result) {
          throw isCheckNewPassword.errors;
        }

        const { is_actived, is_deleted, password } =
          await validateModel.checkUserInfo(conn, userId);

        await validateModel.checkStatusUser(is_actived, is_deleted);

        const isCheckComparePass = await this.validateComparePass(
          old_password,
          password,
          "old_password"
        );
        if (!isCheckComparePass.result) throw isCheckComparePass.errors;

        const salt = await bcrypt.genSalt(12);
        const hashPass = await bcrypt.hash(new_password, salt);

        await usersModel.changePass(conn, body, userId, hashPass);

        return [];
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //login
  async login(body) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { username, password } = body;

        await validateModel.checkRegexUsername(username);

        await validateModel.checkRegexPassword(password);

        const joinTable = `${tableUsers} INNER JOIN ${tableUsersRole} ON ${tableUsers}.id = ${tableUsersRole}.user_id 
          INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id 
          INNER JOIN ${tableUsersCustomers} ON ${tableUsers}.id = ${tableUsersCustomers}.user_id 
          INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id 
          INNER JOIN ${tableLevel} ON ${tableCustomers}.level_id = ${tableLevel}.id`;

        const select = `${tableUsers}.id,${tableUsers}.parent_id,${tableUsers}.password,${tableUsers}.is_actived,${tableUsers}.is_deleted,
            ${tableRole}.sort as role,${tableCustomers}.id as customer_id,${tableLevel}.sort as level`;
        const dataaUser = await databaseModel.select(
          conn,
          joinTable,
          select,
          "username = ?",
          [username]
        );
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
          parent_id: parentId,
          password: passwordDB,
          is_actived,
          is_deleted,
          role,
          level,
          customer_id,
        } = dataaUser[0];

        await validateModel.checkStatusUser(is_actived, is_deleted);

        const isCheckComparePass = await this.validateComparePass(
          password,
          passwordDB,
          "password"
        );
        if (!isCheckComparePass.result) throw isCheckComparePass.errors;

        const data = await usersModel.login(
          conn,
          id,
          parentId,
          role,
          level,
          customer_id
        );
        return data;
      } catch (error) {
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

  //refreshToken
  async refreshToken(body) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.refreshToken(conn, body);

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

  //logout
  async logout(clientId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.logout(conn, clientId);

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

  async updateActive(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await usersModel.updateActive(conn, body, params);
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
}

module.exports = new UsersService();
