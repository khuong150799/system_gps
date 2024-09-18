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
  NOT_EXITS,
} = require("../constants/msg.constant");
const {
  tableDevice,
  tableUserDevice,
  tableCustomers,
  tableUsersCustomers,
  tableUsers,
  tableDeviceVehicle,
} = require("../constants/tableName.constant");
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

  async checkOwnerDevice(conn, userId, devices = [], msg = NOT_ADD_DEVICE) {
    const where = `ud.device_id IN (?) AND ud.user_id = ? AND d.device_status_id = ?`;
    const conditions = [devices, userId, 3];
    const joinTable = `${tableDevice} d INNER JOIN ${tableUserDevice} ud ON d.id = ud.device_id
      INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id`;
    const select = `d.id,d.imei,dv.vehicle_id`;
    const dataDevices = await this.select(
      conn,
      joinTable,
      select,
      where,
      conditions,
      `d.id`,
      "DESC",
      0,
      1000000000
    );
    console.log("dataDevices", dataDevices);

    if (dataDevices.length <= 0)
      throw {
        msg: ERROR,
        errors: [{ value: devices, msg, param: "devices" }],
      };

    const dataId = new Set(dataDevices.map((item) => Number(item.id)));

    const idNotExit = devices.filter((item) => !dataId.has(Number(item)));

    if (idNotExit.length)
      throw {
        msg: ERROR,
        errors: [{ value: idNotExit, msg, param: "devices" }],
      };

    return dataDevices;
  }

  async checkExitValue(
    conn,
    table,
    field,
    condition,
    msgError,
    param,
    id = null,
    is_exist_throw_error = true,
    select = "id"
  ) {
    let where = `${field} = ? AND is_deleted = ?`;
    const conditions = [condition, 0];

    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await this.select(conn, table, select, where, conditions);

    if (dataCheck.length > 0 && is_exist_throw_error) {
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
    } else if (dataCheck.length === 0 && !is_exist_throw_error) {
      throw {
        msg: ERROR,
        errors: [
          {
            value: condition,
            msg: `${msgError} ${NOT_EXITS}`,
            param,
          },
        ],
      };
    }

    return dataCheck;
  }
  async CheckCustomerTree(
    conn,
    listCustomer,
    param = "recivers",
    msg = STRUCTURE_ORDERS_FAIL
  ) {
    const errors = [];

    if (listCustomer.length <= 0) {
      errors.push({ value: listCustomer, msg: NOT_EMPTY, param });
    }

    if (errors.length) throw { msg: ERROR, errors };

    const joinTable = `${tableCustomers} c INNER JOIN ${tableUsersCustomers} uc ON c.id = uc.customer_id INNER JOIN ${tableUsers} u ON uc.user_id = u.id`;
    const select = `u.parent_id,u.id`;
    const where = `c.id = ? AND u.is_main = ?`;

    const arrayPromise = listCustomer.reduce((result, item, i) => {
      if (i > 0) {
        result = [
          ...result,
          this.select(conn, joinTable, select, where, [item, 1], `c.id`),
        ];
      }

      return result;
    }, []);

    const dataInfo = await Promise.all(arrayPromise);

    const arrayPromiseParent = dataInfo.map((item) =>
      this.select(
        conn,
        joinTable,
        `c.id`,
        `u.id = ?`,
        item[0].parent_id,
        `c.id`
      )
    );

    const dataInfoParent = await Promise.all(arrayPromiseParent);

    const checkStructureRecivers = dataInfoParent.some(
      (item, i) => Number(item[0].id) !== Number(listCustomer[i])
    );
    if (checkStructureRecivers) {
      errors.push({
        value: listCustomer,
        msg,
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
  async CheckIsChild(
    connPromise,
    parentAcc,
    customerIdAcc,
    parentIdAcc,
    child,
    fieldRes = "parent_id"
  ) {
    // console.log(parentAcc, customerIdAcc, parentIdAcc, child);

    const dataReturn = [];
    let result = false;

    const joinTable = `${tableUsers} u INNER JOIN ${tableUsersCustomers} uc ON u.id = uc.user_id`;
    const dequy = async (data) => {
      const parentId = data[0].parent_id;
      const id = data[0]?.id;

      if (id) {
        dataReturn.unshift(data[0]);
      }

      if (parentId?.toString() === parentAcc.toString()) {
        dataReturn.unshift({
          id: parentAcc,
          parent_id: parentIdAcc,
          customer_id: customerIdAcc,
        });
        return (result = true);
      }
      const dataRes = await connPromise.query(
        `SELECT u.id,u.parent_id,uc.customer_id FROM ${joinTable} WHERE u.id = ? AND u.is_deleted = ?`,
        [parentId, 0]
      );
      // console.log("dataRes[0]", dataRes, parentId);

      if (Object.keys(dataRes?.[0]?.[0] || {}).length > 0) {
        await dequy(dataRes[0]);
      } else {
        return (result = false);
      }
    };
    await dequy([{ parent_id: child }]);
    // console.log("dataReturn", dataReturn);

    if (!result)
      throw {
        msg: ERROR,
        errors: [{ value: child, msg: ADD_CHILD_ERROR, param: fieldRes }],
      };

    return dataReturn;
  }

  async checkUserInfo(conn, id) {
    let errors = {};

    const dataInfo = await this.select(
      conn,
      tableUsers,
      "password,is_actived,is_deleted,is_main",
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
