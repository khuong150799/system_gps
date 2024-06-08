const db = require("../dbs/init.mysql");
const customersModel = require("../models/customers.model");
const {
  ERROR,
  ALREADY_EXITS,
  VALIDATE_EMAIL,
  VALIDATE_PHONE,
} = require("../constants");
const { regexEmail, regexPhoneNumber } = require("../ultils/regex");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const usersService = require("./users.service");
const tableName = "tbl_customers";

const databaseModel = new DatabaseModel();

class CustomersService {
  async validate(conn, company = "", email = "", phone = "", id = null) {
    const errors = [];

    if (email && !regexEmail(email)) {
      errors.push({
        value: email,
        msg: VALIDATE_EMAIL,
        param: "email",
      });
    }

    if (phone && !regexPhoneNumber(phone)) {
      errors.push({
        value: phone,
        msg: VALIDATE_PHONE,
        param: "phone",
      });
    }

    if (errors.length) {
      return {
        result: false,
        errors: {
          msg: ERROR,
          errors,
        },
      };
    }

    let where = `is_deleted = ?`;
    const conditions = [0];

    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }
    where += ` AND (`;
    if (company) {
      where += `company = ?`;
      conditions.push(company);
    }

    if (email && company) {
      where += ` OR email = ?`;
      conditions.push(email);
    } else if (email) {
      where += `email = ?`;
      conditions.push(email);
    }

    if ((company && phone) || (email && phone)) {
      where += ` OR phone = ?`;
      conditions.push(phone);
    } else if (phone) {
      where += `phone = ?`;
      conditions.push(phone);
    }

    where += `)`;

    const dataCheck = await databaseModel.select(
      conn,
      tableName,
      "company,email,phone",
      where,
      conditions
    );
    if (dataCheck.length <= 0) return { result: true };

    dataCheck.forEach((item) => {
      if (company && item.company === company) {
        errors.push({
          value: company,
          msg: `Tên công ty ${ALREADY_EXITS}`,
          param: "company",
        });
      } else if (email && item.email === email) {
        errors.push({
          value: email,
          msg: `Email ${ALREADY_EXITS}`,
          param: "email",
        });
      } else if (phone && item.phone) {
        errors.push({
          value: phone,
          msg: `Số điện thoại ${ALREADY_EXITS}`,
          param: "phone",
        });
      }
    });

    return {
      result: false,
      errors: {
        msg: ERROR,
        errors,
      },
    };
  }

  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await customersModel.getallrows(conn, query);
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
        const data = await customersModel.getById(conn, params, query);
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
  async register(body, userId) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { company, email, phone, username, password, parent_id } = body;
        if (company || email || phone) {
          const isCheck = await this.validate(conn, company, email, phone);
          if (!isCheck.result) {
            throw isCheck.errors;
          }
        }
        const isCheckUsername = await usersService.validateUsername(username);
        if (!isCheckUsername.result) {
          throw isCheckUsername.errors;
        }

        const isCheckPassword = await usersService.validatePassword(
          password,
          true
        );
        if (!isCheckPassword.result) {
          throw isCheckPassword.errors;
        }

        const isCheckChild = await usersService.validateIsChild(
          connPromise,
          userId,
          parent_id
        );

        if (!isCheckChild.result) {
          throw isCheckChild.errors;
        }

        const customer = await customersModel.register(conn, connPromise, body);

        return customer;
      } catch (error) {
        // console.log("error", error.msg);
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

  //update
  async updateById(body, params) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { id } = params;
        const { company, email, phone } = body;

        if (company || email || phone) {
          const isCheck = await this.validate(conn, company, email, phone, id);
          if (!isCheck.result) {
            throw isCheck.errors;
          }
        }

        const customer = await customersModel.updateById(
          conn,
          connPromise,
          body,
          params
        );
        return customer;
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

  //delete
  async deleteById(params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await customersModel.deleteById(conn, params);
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

  //updatePublish
  async updatePublish(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await customersModel.updatePublish(conn, body, params);
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

module.exports = new CustomersService();
