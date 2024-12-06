const db = require("../dbs/init.mysql");

const {
  ERROR,
  PASS_OLD_FAILED,
  ACCOUNT_FAILED,
  NOT_ADD_DEVICE,
  ACC_NOT_DEL,
  PASS_FAILED,
  LOGIN_FAIL,
  NOT_EXITS,
  STRUCTURE_CUSTOMER_FAIL,
} = require("../constants/msg.constant");

const bcrypt = require("bcryptjs");

const {
  BusinessLogicError,
  Api401Error,
  Api403Error,
} = require("../core/error.response");
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
  tableApiKey,
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
            msg: param === "old_password" ? PASS_OLD_FAILED : PASS_FAILED,
            param,
          },
        ],
      };
    }

    if (Object.keys(errors).length) return { result: false, errors };

    return { result: true };
  }

  //getallrow
  async getLockExtend() {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.getLockExtend(conn);
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

  async getallrowsSiteCustomerService(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.getallrowsSiteCustomerService(
          conn,
          query
        );
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

  async getListWithUser(query, parentId, isMain, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const dataParent = await usersModel.getInfoParent(
          conn,
          isMain == 0 ? parentId : userId
        );
        if (!dataParent?.length) return [];

        const { right, left } = dataParent[0];
        const chosseRight = right;
        const chosseLeft = left;

        const data = await usersModel.getListWithUser(
          conn,
          query,
          // userId,
          chosseLeft,
          chosseRight
        );
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

        const [treeReciver, treeUserIsMoved, listDevices, infoReciver] =
          await Promise.all([
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
            databaseModel.select(
              conn,
              tableUsers,
              "id,parent_id",
              "id = ? AND is_deleted = ?",
              [reciver, 0]
            ),
          ]);

        if (!infoReciver?.length || infoReciver[0]?.parent_id == user_is_moved)
          throw { msg: ERROR, errors: [{ msg: STRUCTURE_CUSTOMER_FAIL }] };

        // return { treeReciver, treeUserIsMoved, listDevices, infoReciver };

        // const customerIdUserIsMove =
        //   treeUserIsMoved?.[treeUserIsMoved?.length - 1]?.customer_id;

        // console.log({
        //   treeReciver,
        //   treeUserIsMoved,
        //   listDevices,
        //   customerIdUserIsMove,
        // });

        const dataInfoParent = [];

        for (let i = 0; i < treeReciver.length; i++) {
          const { id } = treeReciver[i];

          if (id != treeUserIsMoved[i].id) {
            dataInfoParent.push({ index: i - 1, ...treeReciver[i - 1] });
            break;
          } else if (!dataInfoParent.length && i === treeReciver.length - 1) {
            dataInfoParent.push({ index: i, ...treeReciver[i] });
            break;
          } else if (i == treeUserIsMoved.length - 1) {
            dataInfoParent.push({ index: i, ...treeReciver[i] });
            break;
          }
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
          treeReciver.length
        );
        // return { dataRemoveOrders, dataAddOrders, listDevices };
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
        // console.log("body", body);
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
      console.log(error);

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

        const dataDevice = await databaseModel.select(
          conn,
          tableUserDevice,
          "id",
          "user_id = ? AND is_main = 1 AND is_deleted = 0",
          id
        );

        // console.log("dataDevice", dataDevice);

        if (dataDevice?.length)
          throw {
            msg: ERROR,
            errors: [{ msg: ACC_NOT_DEL, value: id, params: "id" }],
          };

        await usersModel.deleteById(conn, connPromise, params);
        return [];
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      throw new BusinessLogicError(error.msg, error?.errors);
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

        // await validateModel.checkRegexPassword(new_password, true);

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
  async loginCustomer(params, body, leftAcc, rightAcc) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { username } = params;
        const { api_key } = body;

        // await validateModel.checkRegexUsername(username);

        // await validateModel.checkRegexPassword(password);

        let where = "u.username = ? AND u.is_deleted = 0";
        const condition = [username];
        let left = 0;
        let right = 999999999999;

        if (api_key) {
          const dataKey = await validateModel.checkExitValue(
            conn,
            tableApiKey,
            "api_key",
            api_key,
            `API KEY ${NOT_EXITS}`,
            "api_key",
            null,
            false,
            "owner,conditions",
            true
          );

          const { owner, conditions } = dataKey[0];

          if (conditions) {
            where += ` ${conditions}`;
          } else if (owner) {
            // const dataOwner = await databaseModel.select(conn,tableUsers,'left,right','id = ?',owner,)

            const dataOwner = await validateModel.checkExitValue(
              conn,
              tableUsers,
              "id",
              owner,
              `API KEY ${NOT_EXITS}`,
              "api_key",
              null,
              false,
              "left,right",
              true
            );

            const { left: leftOwner, right: rightOwner } = dataOwner[0];

            left = leftOwner;
            right = rightOwner;
          }
        }

        const joinTable = `${tableUsers} u INNER JOIN ${tableUsersRole} ur ON u.id = ur.user_id 
          INNER JOIN ${tableRole} r ON ur.role_id = r.id 
          INNER JOIN ${tableUsersCustomers} uc ON u.id = uc.user_id 
          INNER JOIN ${tableCustomers} c ON uc.customer_id = c.id 
          INNER JOIN ${tableLevel} l ON c.level_id = l.id`;

        const select = `u.id,u.parent_id,u.left,u.right,u.is_main,u.is_actived,u.is_deleted,
            r.sort as role,c.id as customer_id,l.sort as level`;
        const dataUser = await databaseModel.select(
          conn,
          joinTable,
          select,
          where,
          condition,
          "u.id",
          "ASC",
          0,
          1
        );
        // console.log("dataUser", dataUser);

        if (
          !dataUser?.length ||
          Number(left) >= Number(dataUser[0].left) ||
          Number(right) <= Number(dataUser[0].right)
        )
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
          left: leftCustomer,
          right: rightCustomer,
          is_main,
        } = dataUser[0];

        if (
          Number(leftAcc) <= Number(leftCustomer) ||
          Number(rightAcc) <= Number(rightCustomer)
        )
          throw {
            msg: ERROR,
            errors: [
              {
                value: username,
                msg: LOGIN_FAIL,
                param: "username",
              },
            ],
          };

        await validateModel.checkStatusUser(is_actived, is_deleted);

        const data = await usersModel.loginCustomer(
          id,
          parentId,
          role,
          level,
          customer_id,
          is_main
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
        const { username, password, api_key } = body;

        let where = "u.username = ? AND u.is_deleted = 0";
        const condition = [username];
        let left = 0;
        let right = 999999999999;

        if (api_key) {
          const dataKey = await validateModel.checkExitValue(
            conn,
            tableApiKey,
            "api_key",
            api_key,
            `API KEY ${NOT_EXITS}`,
            "api_key",
            null,
            false,
            "owner,conditions",
            true
          );

          const { owner, conditions } = dataKey[0];

          if (conditions) {
            where += ` ${conditions}`;
          } else if (owner) {
            // const dataOwner = await databaseModel.select(conn,tableUsers,'left,right','id = ?',owner,)

            const dataOwner = await validateModel.checkExitValue(
              conn,
              tableUsers,
              "id",
              owner,
              `API KEY ${NOT_EXITS}`,
              "api_key",
              null,
              false,
              "left,right",
              true
            );

            const { left: leftOwner, right: rightOwner } = dataOwner[0];

            left = leftOwner;
            right = rightOwner;
          }
        }

        // await validateModel.checkRegexUsername(username);

        // await validateModel.checkRegexPassword(password);

        const joinTable = `${tableUsers} u INNER JOIN ${tableUsersRole} ur ON u.id = ur.user_id 
          INNER JOIN ${tableRole} r ON ur.role_id = r.id 
          INNER JOIN ${tableUsersCustomers} uc ON u.id = uc.user_id 
          INNER JOIN ${tableCustomers} c ON uc.customer_id = c.id 
          INNER JOIN ${tableLevel} l ON c.level_id = l.id`;

        const select = `u.id,u.parent_id,u.password,u.is_actived,u.is_main,u.is_deleted,u.left,u.right,
            r.sort as role,c.id as customer_id,l.sort as level`;
        const dataUser = await databaseModel.select(
          conn,
          joinTable,
          select,
          where,
          condition,
          "u.id",
          "ASC",
          0,
          1
        );
        // console.log("dataUser", dataUser);

        if (
          !dataUser?.length ||
          Number(left) > Number(dataUser[0].left) ||
          Number(right) < Number(dataUser[0].right)
        )
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
          is_main: isMain,
        } = dataUser[0];

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
          body,
          id,
          parentId,
          role,
          level,
          customer_id,
          isMain
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
      // console.log(error?.status);
      if (error.message === "jwt expired") {
        throw new Api401Error(error.message);
      } else if (error?.status === 403) {
        throw new Api403Error();
      } else {
        throw new BusinessLogicError(error.msg);
      }
    }
  }

  //logout
  async logout(clientId, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.logout(conn, clientId, userId);

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
      console.log(error);

      const { msg, errors } = error;

      throw new BusinessLogicError(msg, errors);
    }
  }

  async unlockExtend(params) {
    try {
      await usersModel.unlockExtend(params);
      return [];
    } catch (error) {
      console.log(error);

      const { msg, errors } = error;

      throw new BusinessLogicError(msg, errors);
    }
  }
}

module.exports = new UsersService();
