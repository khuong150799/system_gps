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
  VALIDATE_LICENSE,
  ERR_RENEWAL_CODE,
  NOT_USED_RENEWAL_CODE,
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
  regexLicense,
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
    // console.log("dataDevices", dataDevices);

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
    select = "id",
    useTheDeletedKey = true,
    checkRenewalCode = false,
    recall = false
  ) {
    let where = `${field} = ?`;

    const conditions = [condition];

    if (useTheDeletedKey) {
      where += " AND is_deleted = ?";
      conditions.push(0);
    }

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
    } else if (dataCheck.length > 0 && checkRenewalCode) {
      const { is_used } = dataCheck[0];

      if (!recall && is_used == 1) {
        throw {
          msg: ERROR,
          errors: [
            {
              value: condition,
              msg: ERR_RENEWAL_CODE,
              param,
            },
          ],
        };
      } else if (recall && is_used == 0) {
        throw {
          msg: ERROR,
          errors: [
            {
              value: condition,
              msg: NOT_USED_RENEWAL_CODE,
              param,
            },
          ],
        };
      }
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

  async checkExitMultiValue(
    conn,
    table,
    field,
    condition = [],
    msgError,
    param,
    id = null,
    is_exist_throw_error = true,
    select = "id",
    isCheckCode = false,
    modifier = "",
    promo = false
  ) {
    let where = `${field} IN (?)`;
    const conditions = condition;

    if (modifier) {
      where += `AND ${modifier}`;
    }
    if (promo) {
      where += `AND type = 2`;
    }

    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await this.select(conn, table, select, where, conditions);

    if (!isCheckCode && dataCheck.length > 0 && is_exist_throw_error) {
      const listExist = dataCheck.map((item) => item[field]);
      throw {
        msg: ERROR,
        errors: [
          {
            value: listExist,
            msg: `${listExist.join(",")} ${ALREADY_EXITS}`,
            param,
          },
        ],
      };
    } else if (isCheckCode) {
      if (!dataCheck?.length)
        throw {
          msg: ERROR,
          errors: [
            {
              value: conditions[0],
              msg: `${msgError} ${NOT_EXITS}`,
              param,
            },
          ],
          isLockAcc: true,
        };
      const codeIsUsed = [];
      const listCodeDb = [];

      for (let i = 0; i < dataCheck.length; i++) {
        const { code, is_used } = dataCheck[i];

        if (is_used == 1) {
          codeIsUsed.push(code);
        } else {
          listCodeDb.push(code);
        }
      }
      // console.log("codeIsUsed", codeIsUsed);

      if (codeIsUsed.length)
        throw {
          msg: ERROR,
          errors: [
            {
              value: codeIsUsed.join(","),
              msg: `${msgError} ${codeIsUsed.join(",")} đã được sử dụng`,
              param,
            },
          ],
          isLockAcc: true,
        };

      const codeNotExist = [];

      for (let i = 0; i < conditions[0].length; i++) {
        const code = conditions[0][i];
        if (!listCodeDb.includes(code)) {
          codeNotExist.push(code);
        }
      }

      if (codeNotExist.length)
        throw {
          msg: ERROR,
          errors: [
            {
              value: codeNotExist.join(","),
              msg: `${msgError} ${codeNotExist.join(",")} ${NOT_EXITS}`,
              param,
            },
          ],
          isLockAcc: true,
        };
    }

    return dataCheck;
  }

  async CheckCustomerTree(
    conn,
    listCustomer,
    param = "recivers",
    msg = STRUCTURE_ORDERS_FAIL,
    parentId,
    isMain
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

    if (!dataInfo?.length) {
      errors.push({ value: listCustomer, msg, param });
    }

    if (errors.length) throw { msg: ERROR, errors };

    const arrayPromiseParent = [];
    for (let i = 0; i < dataInfo.length; i++) {
      const item = dataInfo[i];
      if (item[0].parent_id) {
        arrayPromiseParent.push(() =>
          this.select(
            conn,
            joinTable,
            `c.id`,
            `u.id = ?`,
            item[0].parent_id,
            `c.id`
          )
        );
      }
    }

    const dataInfoParent = await Promise.all(
      arrayPromiseParent.map((fn) => fn())
    );
    // console.log("dataInfoParent", dataInfoParent);

    const checkStructureRecivers = dataInfoParent.some((item, i) => {
      if (
        parentId &&
        ((Number(parentId) === 1 && isMain == 1) || Number(parentId) > 1)
      ) {
        return Number(item[0].id) !== Number(listCustomer[i]);
      } else if (i > 0) {
        return Number(item[0].id) !== Number(listCustomer[i]);
      } else {
        return false;
      }
    });
    // console.log({
    //   dataInfo: JSON.stringify(dataInfo, null, 2),
    //   dataInfoParent: JSON.stringify(dataInfoParent, null, 2),
    //   listCustomer: JSON.stringify(listCustomer, null, 2),
    // });

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

      // console.log("parentId", parentId, parentAcc);

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
        `SELECT u.id,u.parent_id,uc.customer_id,u.username FROM ${joinTable} WHERE u.id = ? AND u.is_deleted = ?`,
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

  async checkRegexLicense(licenseNumber) {
    const errors = [];
    if (!regexLicense(licenseNumber)) {
      errors.push({
        value: licenseNumber,
        msg: VALIDATE_LICENSE,
        param: "license_number",
      });
    }
    if (errors.length)
      throw {
        msg: ERROR,
        errors,
      };

    return [];
  }
}

module.exports = new ValidateModel();
