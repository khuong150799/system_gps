const db = require("../dbs/init.mysql");

const {
  ERROR,
  VALIDATE_ACCOUNT,
  ALREADY_EXITS,
  VALIDATE_PASS,
  NOT_EXITS,
  NOT_ACTIVE_ACCOUNT,
  DELETED_ACCOUNT,
  PASS_OLD_FAILED,
  ACCOUNT_FAILED,
  PASS_FAILED,
  ADD_CHILD_ERROR,
  NOT_ADD_DEVICE,
} = require("../constants");
const { regexAccount, regexPass } = require("../ultils/regex");
const tableName = "tbl_users";
const tableCustomers = "tbl_customers";
const tableLevel = "tbl_level";
const tableUsersCustomers = "tbl_users_customers";
const tableRole = "tbl_role";
const tableUsersRole = "tbl_users_role";

const bcrypt = require("bcrypt");

const { BusinessLogicError } = require("../core/error.response");
const makeUsername = require("../ultils/makeUsername");

const DatabaseModel = require("../models/database.model");
const usersModel = require("../models/users.model");
const validateModel = require("../models/validate.model");

const databaseModel = new DatabaseModel();

class UsersService {
  async validateUsername(username) {
    const errors = [];
    if (!regexAccount(username)) {
      errors.push({
        value: username,
        msg: VALIDATE_ACCOUNT,
        param: "username",
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

    return { result: true };
  }

  async validatePassword(password, isNew = false) {
    const errors = [];
    if (!regexPass(password)) {
      errors.push({
        value: password,
        msg: isNew ? VALIDATE_PASS : PASS_FAILED,
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

    return { result: true };
  }
  async validateCheckExitUsername(conn, username, id = null) {
    let where = `username = ? AND is_deleted = ?`;
    const conditions = [username, 0];

    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await databaseModel.select(
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
  async validateStatusUser(active = null, isDeleted = null) {
    let errors = {};
    if (active !== null && active === 0) {
      errors = {
        msg: NOT_ACTIVE_ACCOUNT,
        errors: [
          {
            value: "",
            msg: NOT_ACTIVE_ACCOUNT,
            param: "",
          },
        ],
      };
    } else if (isDeleted === 1) {
      errors = {
        msg: DELETED_ACCOUNT,
        errors: [
          {
            value: "",
            msg: DELETED_ACCOUNT,
            param: "",
          },
        ],
      };
    }

    if (Object.keys(errors).length)
      return {
        result: false,
        errors,
      };

    return { result: true };
  }

  async validateComparePass(compare, isCompared) {
    const errors = [];
    const match = await bcrypt.compare(compare, isCompared);
    if (!match) {
      errors = {
        msg: ERROR,
        errors: [
          {
            value: compare,
            msg: PASS_OLD_FAILED,
            param: "old_password",
          },
        ],
      };
    }

    if (Object.keys(errors).length) return { result: false, errors };

    return { result: true };
  }

  async validateIsChild(connPromise, parent, child) {
    const dataReturn = [];
    const dequy = async (data) => {
      dataReturn.push(data[0]);
      const id = data[0].id;

      if (id.toString() === parent.toString()) {
        return true;
      }

      const dataRes = await connPromise.query(
        `SELECT ${tableName}.id,${tableName}.parent_id FROM ${tableName} WHERE ${tableName}.parent_id = ? AND ${tableName}.is_deleted = ?`,
        [id, 0]
      );

      if (
        dataRes?.[0]?.[0].length > 0 &&
        dataRes?.[0]?.[0].id.toString() !== userId.toString()
      ) {
        await dequy(dataRes[0]);
      }
      return false;
    };
    const result = await dequy([{ id: child }]);

    if (!result)
      return {
        result: false,
        errors: {
          msg: ERROR,
          errors: [{ value: id, msg: ADD_CHILD_ERROR, param: "parent_id" }],
        },
      };
    return { result: true };
  }

  async validateUserInfo(conn, id) {
    let errors = {};

    const dataInfo = await databaseModel.select(
      conn,
      tableName,
      "password,is_actived,is_deleted",
      "id = ?",
      [id]
    );

    if (dataInfo?.length <= 0) {
      errors = {
        msg: ERROR,
        errors: [
          {
            value: "",
            msg: `Tài khoản ${NOT_EXITS}`,
            param: "",
          },
        ],
      };
    }

    if (Object.keys(errors).length) return { result: false, errors };

    return { result: true, data: dataInfo[0] };
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

  //getbyid
  async getById(params, query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await usersModel.getById(conn, params, query);
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
  //Register
  async register(body, userId, customerId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { parent_id, username, password } = body;

        const isCheckUsername = await this.validateUsername(username);
        if (!isCheckUsername.result) {
          throw isCheckUsername.errors;
        }

        const isCheckPassword = await this.validatePassword(password, true);
        if (!isCheckPassword.result) {
          throw isCheckPassword.errors;
        }

        const isCheckChild = await this.validateIsChild(
          connPromise,
          userId,
          parent_id
        );
        if (!isCheckChild.result) {
          throw isCheckChild.errors;
        }

        const isCheck = await this.validateCheckExitUsername(conn, username);
        if (!isCheck.result) {
          throw isCheck.errors;
        }

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

        const isCheckChild = await this.validateIsChild(
          connPromise,
          userId,
          parent_id
        );
        if (!isCheckChild.result) {
          throw isCheckChild.errors;
        }

        const username = `${makeUsername(name)}${Date.now()}`;
        const password = `Mv${Date.now()}`;

        const isCheck = await this.validateCheckExitUsername(conn, username);
        if (!isCheck.result) {
          throw isCheck.errors;
        }

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

        const isCheckChild = await this.validateIsChild(
          connPromise,
          userId,
          parent_id
        );

        if (!isCheckChild.result) {
          throw isCheckChild.errors;
        }

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
      const { conn } = await db.getConnection();
      try {
        const { id } = params;
        const isCheckChild = await this.validateIsChild(
          connPromise,
          userId,
          id
        );

        if (!isCheckChild.result) {
          throw isCheckChild.errors;
        }
        await usersModel.deleteById(conn, params);
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

  //reset pass
  async resetPass(params, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { id } = params;
        const isCheckChild = await this.validateIsChild(
          connPromise,
          userId,
          id
        );

        if (!isCheckChild.result) {
          throw isCheckChild.errors;
        }
        const data = await usersModel.resetPass(conn, params);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
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

        const isCheckOldPassword = await this.validatePassword(old_password);
        if (!isCheckOldPassword.result) {
          throw isCheckOldPassword.errors;
        }

        const isCheckNewPassword = await this.validatePassword(
          new_password,
          true
        );
        if (!isCheckNewPassword.result) {
          throw isCheckNewPassword.errors;
        }

        const isCheckInfo = await this.validateUserInfo(conn, userId);
        if (!isCheckInfo.result) throw isCheckInfo.errors;

        const { data: dataInfo } = isCheckInfo;
        const { is_actived, is_deleted, password } = dataInfo;
        const isCheckStatusUser = await this.validateStatusUser(
          is_actived,
          is_deleted
        );
        if (!isCheckStatusUser.result) throw isCheckStatusUser.errors;

        const isCheckComparePass = await this.validateComparePass(
          old_password,
          password
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

        const isCheckUsername = await this.validateUsername(username);
        if (!isCheckUsername.result) {
          throw isCheckUsername.errors;
        }

        const isCheckPassword = await this.validatePassword(password);
        if (!isCheckPassword.result) {
          throw isCheckPassword.errors;
        }

        const joinTable = `${tableName} INNER JOIN ${tableUsersRole} ON ${tableName}.id = ${tableUsersRole}.user_id INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id INNER JOIN ${tableUsersCustomers} ON ${tableName}.id = ${tableUsersCustomers}.user_id INNER JOIN ${tableCustomers} ON ${tableUsersCustomers}.customer_id = ${tableCustomers}.id INNER JOIN ${tableLevel} ON ${tableCustomers}.level_id = ${tableLevel}.id`;
        const dataaUser = await databaseModel.select(
          conn,
          joinTable,
          `${tableName}.id,${tableName}.parent_id,${tableName}.password,${tableName}.is_actived,${tableName}.is_deleted,${tableRole}.sort as role,${tableCustomers}.id as customer_id,${tableLevel}.sort as level`,
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

        const isCheckStatusUser = await this.validateStatusUser(
          is_actived,
          is_deleted
        );
        if (!isCheckStatusUser.result) throw isCheckStatusUser.errors;

        const isCheckComparePass = await this.validateComparePass(
          password,
          passwordDB
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
      const data = await usersModel.refreshToken(body);
      return data;
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //logout
  async logout(clientId) {
    try {
      const data = await usersModel.logout(clientId);

      return data;
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new UsersService();
