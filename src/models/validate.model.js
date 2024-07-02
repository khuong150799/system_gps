const {
  ERROR,
  NOT_ADD_DEVICE,
  ALREADY_EXITS,
  STRUCTURE_ORDERS_FAIL,
  VALIDATE_ACCOUNT,
  VALIDATE_PASS,
  PASS_FAILED,
  NOT_ACTIVE_ACCOUNT,
  DELETED_ACCOUNT,
  CHOOSE_ERROR,
  ADD_CHILD_ERROR,
  VALIDATE_PHONE,
  VALIDATE_EMAIL,
} = require("../constants/msg.contant");
const {
  tableDevice,
  tableUserDevice,
  tableCustomers,
  tableUsersCustomers,
  tableUsers,
} = require("../constants/tableName.contant");
const {
  regexAccount,
  regexPass,
  regexEmail,
  regexPhoneNumber,
} = require("../ultils/regex");
const DatabaseModel = require("./database.model");

class ValidateModel extends DatabaseModel {
  constructor() {
    super();
  }

  async checkOwnerDevice(conn, userId, devices) {
    const where = `${tableUserDevice}.device_id IN (?) AND ${tableUserDevice}.user_id = ? AND ${tableDevice}.device_status_id = ?`;
    const conditions = [devices, userId, 4];
    const joinTable = `${tableDevice} INNER JOIN ${tableUserDevice} ON ${tableDevice}.id = ${tableUserDevice}.device_id`;
    const select = `${tableDevice}.id`;
    const dataDevices = await this.select(
      conn,
      joinTable,
      select,
      where,
      conditions,
      `${tableDevice}.id`,
      "DESC",
      0,
      1000000000
    );
    if (dataDevices.length <= 0)
      throw {
        msg: ERROR,
        errors: [{ value: devices, msg: NOT_ADD_DEVICE, param: "devices" }],
      };

    const dataId = new Set(dataDevices.map((item) => item.id));

    const idNotExit = devices.filter((item) => !dataId.has(item));

    if (idNotExit.length)
      throw {
        msg: ERROR,
        errors: [{ value: idNotExit, msg: NOT_ADD_DEVICE, param: "devices" }],
      };

    return [];
  }

  async checkExitValue(
    conn,
    table,
    field,
    condition,
    msgError,
    param,
    id = null
  ) {
    let where = `${field} = ? AND is_deleted = ?`;
    const conditions = [condition, 0];

    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await this.select(conn, table, "id", where, conditions);

    if (dataCheck.length > 0)
      throw {
        msg: ERROR,
        errors: [
          {
            value: condition,
            msg: `${msgError} ${ALREADY_EXITS}`,
            param,
          },
        ],
      };

    return [];
  }
  async CheckCustomerTree(conn, listCustomer, param = "recivers") {
    const errors = [];

    if (listCustomer.length <= 0) {
      errors.push({ value: listCustomer, msg: NOT_EMPTY, param });
    }

    if (errors.length) throw { msg: ERROR, errors };

    const joinTable = `${tableCustomers} INNER JOIN ${tableUsersCustomers} ON ${tableCustomers}.id = ${tableUsersCustomers}.customer_id INNER JOIN ${tableUsers} ON ${tableUsersCustomers}.user_id = ${tableUsers}.id`;
    const select = `${tableUsers}.parent_id,${tableUsers}.id`;
    const where = `${tableCustomers}.id = ? AND ${tableUsers}.is_main = ?`;

    const arrayPromise = listCustomer.reduce((result, item, i) => {
      if (i > 0) {
        result = [
          ...result,
          this.select(
            conn,
            joinTable,
            select,
            where,
            [item, 1],
            `${tableCustomers}.id`
          ),
        ];
      }

      return result;
    }, []);

    const dataInfo = await Promise.all(arrayPromise);
    const arrayPromiseParent = dataInfo.map((item) =>
      this.select(
        conn,
        joinTable,
        `${tableCustomers}.id`,
        `${tableUsers}.id = ?`,
        item[0].parent_id,
        `${tableCustomers}.id`
      )
    );

    const dataInfoParent = await Promise.all(arrayPromiseParent);
    const checkStructureRecivers = dataInfoParent.some(
      (item, i) => Number(item[0].id) !== Number(listCustomer[i])
    );
    if (checkStructureRecivers) {
      errors.push({
        value: listCustomer,
        msg: STRUCTURE_ORDERS_FAIL,
        param,
      });
    }

    if (errors.length) {
      throw {
        msg: ERROR,
        errors,
      };
    }
    return dataInfo;
  }

  async checkRegexUsername(username) {
    const errors = [];
    if (!regexAccount(username)) {
      errors.push({
        value: username,
        msg: VALIDATE_ACCOUNT,
        param: "username",
      });
    }
    if (errors.length)
      throw {
        msg: ERROR,
        errors,
      };

    return [];
  }

  async checkRegexPassword(password, isNew = false) {
    const errors = [];
    if (!regexPass(password)) {
      errors.push({
        value: password,
        msg: isNew ? VALIDATE_PASS : PASS_FAILED,
        param: "password",
      });
    }
    if (errors.length)
      throw {
        msg: ERROR,
        errors,
      };

    return [];
  }

  async checkRegexPhone(phone) {
    const errors = [];
    if (!regexPhoneNumber(phone)) {
      errors.push({
        value: phone,
        msg: VALIDATE_PHONE,
        param: "phone",
      });
    }
    if (errors.length)
      throw {
        msg: ERROR,
        errors,
      };

    return [];
  }

  async checkRegexEmial(email) {
    const errors = [];
    if (!regexEmail(email)) {
      errors.push({
        value: email,
        msg: VALIDATE_EMAIL,
        param: "email",
      });
    }
    if (errors.length)
      throw {
        msg: ERROR,
        errors,
      };

    return [];
  }

  async checkStatusUser(active = null, isDeleted = null) {
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

    if (Object.keys(errors).length) throw errors;

    return [];
  }

  async checkParentAndChildPermission(
    conn,
    table,
    perission,
    perissionIsCheck,
    msgError,
    fieldError
  ) {
    const data = await this.select(
      conn,
      table,
      "sort",
      "id = ?",
      perissionIsCheck
    );

    if (data?.length <= 0 || Number(data[0].sort) > Number(perission))
      throw {
        msg: ERROR,
        errors: [
          {
            value: perissionIsCheck,
            msg: `${CHOOSE_ERROR} ${msgError}`,
            param: fieldError,
          },
        ],
      };
    return [];
  }
  async CheckIsChild(connPromise, parent, child, fieldRes = "parent_id") {
    const dataReturn = [];
    let result = false;
    const dequy = async (data) => {
      dataReturn.push(data[0]);
      const parentId = data[0].parent_id;

      if (parentId?.toString() === parent.toString()) {
        return (result = true);
      }
      const dataRes = await connPromise.query(
        `SELECT ${tableUsers}.id,${tableUsers}.parent_id FROM ${tableUsers} WHERE ${tableUsers}.id = ? AND ${tableUsers}.is_deleted = ?`,
        [parentId, 0]
      );

      if (Object.keys(dataRes?.[0]?.[0] || {}).length > 0) {
        await dequy(dataRes[0]);
      } else {
        return (result = false);
      }
    };
    await dequy([{ parent_id: child }]);

    if (!result)
      throw {
        msg: ERROR,
        errors: [{ value: child, msg: ADD_CHILD_ERROR, param: fieldRes }],
      };

    return [];
  }

  async checkUserInfo(conn, id) {
    let errors = {};

    const dataInfo = await this.select(
      conn,
      tableUsers,
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

    if (Object.keys(errors).length) throw errors;

    return dataInfo[0];
  }
}

module.exports = new ValidateModel();
