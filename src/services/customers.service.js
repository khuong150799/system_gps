const db = require("../dbs/init.mysql");
const customersModel = require("../models/customers.model");
const { ERROR, ALREADY_EXITS } = require("../constants/msg.constant");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const validateModel = require("../models/validate.model");
const {
  tableCustomers,
  tableLevel,
  tableUsers,
} = require("../constants/tableName.constant");

const databaseModel = new DatabaseModel();

class CustomersService {
  async validate(conn, company = "", email = "", phone = "", id = null) {
    const errors = [];

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
      tableCustomers,
      "company,email,phone",
      where,
      conditions
    );
    if (dataCheck.length <= 0) return;

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

    throw {
      msg: ERROR,
      errors,
    };
  }

  //getallrow
  async getallrows(query, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await customersModel.getallrows(conn, query, userId);
        return data;
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
  async register(body, userId, customerId, parentId, level) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const {
          level_id,
          company,
          email,
          phone,
          username,
          password,
          parent_id,
        } = body;
        if (email) {
          await validateModel.checkRegexEmial(email);
        }

        if (phone) {
          await validateModel.checkRegexPhone(phone);
        }

        await validateModel.checkRegexUsername(username);

        await validateModel.checkRegexPassword(password, true);

        await validateModel.checkParentAndChildPermission(
          conn,
          tableLevel,
          level,
          level_id,
          "Quy mô",
          "level_id"
        );

        if (company || email || phone) {
          await this.validate(conn, company, email, phone);
        }

        await validateModel.checkExitValue(
          conn,
          tableUsers,
          "username",
          username,
          "Tài khoản",
          "username"
        );

        await validateModel.CheckIsChild(
          connPromise,
          userId,
          customerId,
          parentId,
          parent_id
        );

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
          await this.validate(conn, company, email, phone, id);
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
      console.log(error);
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
