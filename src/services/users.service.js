const db = require("../dbs/init.mysql");

const {
  ERROR,
  PASS_OLD_FAILED,
  ACCOUNT_FAILED,
  NOT_ADD_DEVICE,
} = require("../constants/msg.constant");

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
  tableUserDevice,
  tableOrders,
  tableOrdersDevice,
} = require("../constants/tableName.constant");

const databaseModel = new DatabaseModel();

class UsersService {
  async validateComparePass(compare, isCompared, param) {
    let errors = [];
    // console.log({ compare, isCompared });
    const match = await bcrypt.compare(compare, isCompared);

    // console.log("match", match);
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

  async getTeamsWithUser(query, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.getTeamsWithUser(conn, query, userId);
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
  async getDeviceAdd(query, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.getDeviceAdd(conn, query, userId);
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

  // getbyid
  async getbyid(userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.getInfo(conn, userId, true);
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

  async move(body, userId, customerId, parentId) {
    try {
      const { reciver, user_is_moved } = body;
      const { conn, connPromise } = await db.getConnection();
      try {
        console.log(reciver, user_is_moved);

        if (Number(userId) === Number(user_is_moved)) throw "lỗi";

        const [treeReciver, treeUserIsMoved, listDevices] = await Promise.all([
          validateModel.CheckIsChild(
            connPromise,
            userId,
            customerId,
            parentId,
            reciver,
            "reciver"
          ),
          validateModel.CheckIsChild(
            connPromise,
            userId,
            customerId,
            parentId,
            user_is_moved,
            "user_is_moved"
          ),
          databaseModel.select(
            conn,
            tableUserDevice,
            "device_id",
            "user_id = ? AND is_main = ? AND is_deleted = ?",
            [user_is_moved, 1, 0],
            "device_id",
            "ASC",
            0,
            100000
          ),
        ]);

        const customerIdUserIsMove =
          treeUserIsMoved?.[treeUserIsMoved?.length - 1]?.customer_id;

        console.log({
          treeReciver,
          treeUserIsMoved,
          listDevices,
          customerIdUserIsMove,
        });

        const dataInfoParent = [];

        for (let i = 0; i < treeReciver.length; i++) {
          const { id } = treeReciver[i];

          if (id != treeUserIsMoved[i].id) {
            dataInfoParent.push({ index: i - 1, ...treeReciver[i - 1] });
          } else if (!dataInfoParent.length && i === treeReciver.length - 1) {
            dataInfoParent.push({ index: i, ...treeReciver[i] });
          }

          if (i == treeUserIsMoved.length - 1) break;
        }

        const indexUserMove = treeUserIsMoved.findIndex(
          (item) => item.id == user_is_moved
        );

        const dataRemoveOrders = treeUserIsMoved.slice(
          dataInfoParent[0].index + 1,
          indexUserMove
        );
        const dataAddOrders = treeReciver.slice(
          dataInfoParent[0].index + 1,
          treeUserIsMoved.length
        );

        // return {
        //   indexUserMove,
        //   dataInfoParent,
        //   dataRemoveOrders,
        //   dataAddOrders,
        //   treeUserIsMoved,
        //   treeReciver,
        // };

        const data = await usersModel.move(
          conn,
          connPromise,
          userId,
          body,
          dataRemoveOrders,
          dataAddOrders,
          listDevices
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

  //Register
  async register(body, userId, customerId, parentId, role) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { parent_id, username, password, role_id } = body;

        await validateModel.checkRegexUsername(username);

        await validateModel.checkRegexPassword(password, true);

        await validateModel.CheckIsChild(
          connPromise,
          userId,
          customerId,
          parentId,
          parent_id
        );

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
  async registerTeam(body, userId, customerId, parentId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { parent_id, name } = body;

        await validateModel.CheckIsChild(
          connPromise,
          userId,
          customerId,
          parentId,
          parent_id
        );

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

  async registerDevices(body, params, userId, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        console.log("body", body);
        const { devices } = body;
        const { id } = params;
        // console.log("devices", devices);
        const listDevices = JSON.parse(devices || "[]");

        if (Number(id) === Number(userId))
          throw {
            msg: ERROR,
            errors: [
              { value: listDevices, msg: NOT_ADD_DEVICE, param: "devices" },
            ],
          };

        await validateModel.checkOwnerDevice(conn, userId, listDevices);
        const data = await usersModel.registerDevices(
          conn,
          connPromise,
          body,
          params,
          infoUser
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

  //update
  async updateById(body, params, userId, customerId, parentId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { parent_id } = body;

        await validateModel.CheckIsChild(
          connPromise,
          userId,
          customerId,
          parentId,
          parent_id
        );

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
  async deleteDevice(params, body, userId, customerId, parentId, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        await validateModel.CheckIsChild(
          connPromise,
          userId,
          customerId,
          parentId,
          id
        );

        await usersModel.deleteDevice(
          conn,
          connPromise,
          params,
          body,
          infoUser
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
      throw new BusinessLogicError(error.msg);
    }
  }

  //delete
  async deleteById(params, userId, customerId, parentId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        await validateModel.CheckIsChild(
          connPromise,
          userId,
          customerId,
          parentId,
          id
        );

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
  async resetPass(params, userId, customerId, parentId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        await validateModel.CheckIsChild(
          connPromise,
          userId,
          customerId,
          parentId,
          id
        );

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
      const { conn, connPromise } = await db.getConnection();
      try {
        // console.log("userId", userId);
        const { new_password, old_password } = body;

        // await validateModel.checkRegexPassword(old_password);

        await validateModel.checkRegexPassword(new_password, true);

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

        const infoUser = { user_id: userId, ip: null, os: null, gps: null };

        await usersModel.changePass(
          conn,
          connPromise,
          body,
          userId,
          hashPass,
          infoUser
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

  //loginCustomer
  async loginCustomer(params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { username } = params;

        // await validateModel.checkRegexUsername(username);

        // await validateModel.checkRegexPassword(password);

        const joinTable = `${tableUsers} u INNER JOIN ${tableUsersRole} ur ON u.id = ur.user_id 
          INNER JOIN ${tableRole} r ON ur.role_id = r.id 
          INNER JOIN ${tableUsersCustomers} uc ON u.id = uc.user_id 
          INNER JOIN ${tableCustomers} c ON uc.customer_id = c.id 
          INNER JOIN ${tableLevel} l ON c.level_id = l.id`;

        const select = `u.id,u.parent_id,u.password,u.is_actived,u.is_deleted,
            r.sort as role,c.id as customer_id,l.sort as level`;
        const dataaUser = await databaseModel.select(
          conn,
          joinTable,
          select,
          "u.username = ?",
          [username],
          "u.id",
          "ASC",
          0,
          1
        );
        // console.log("dataaUser", dataaUser);

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
          is_actived,
          is_deleted,
          role,
          level,
          customer_id,
        } = dataaUser[0];

        await validateModel.checkStatusUser(is_actived, is_deleted);

        const data = await usersModel.loginCustomer(
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

  //login
  async login(body) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { username, password } = body;

        // await validateModel.checkRegexUsername(username);

        // await validateModel.checkRegexPassword(password);

        const joinTable = `${tableUsers} u INNER JOIN ${tableUsersRole} ur ON u.id = ur.user_id 
          INNER JOIN ${tableRole} r ON ur.role_id = r.id 
          INNER JOIN ${tableUsersCustomers} uc ON u.id = uc.user_id 
          INNER JOIN ${tableCustomers} c ON uc.customer_id = c.id 
          INNER JOIN ${tableLevel} l ON c.level_id = l.id`;

        const select = `u.id,u.parent_id,u.password,u.is_actived,u.is_deleted,
            r.sort as role,c.id as customer_id,l.sort as level`;
        const dataaUser = await databaseModel.select(
          conn,
          joinTable,
          select,
          "u.username = ? AND u.is_deleted = 0",
          [username],
          "u.id",
          "ASC",
          0,
          1
        );
        // console.log("dataaUser", dataaUser);

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
        // console.log("isCheckComparePass", isCheckComparePass);

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

  //updateUsername
  async updateUsername(body, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { username } = body;
        await validateModel.checkRegexUsername(username);

        await validateModel.checkExitValue(
          conn,
          tableUsers,
          "username",
          username,
          "Tài khoản",
          "username",
          userId
        );

        await usersModel.updateUsername(conn, body, userId);
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
