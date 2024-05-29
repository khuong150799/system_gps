const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const CustomersModel = require("../models/customers.model");
const {
  ERROR,
  ALREADY_EXITS,
  VALIDATE_EMAIL,
  VALIDATE_PHONE,
} = require("../constants");
const { makeCode } = require("../ultils/makeCode");
const { regexEmail, regexPhoneNumber } = require("../ultils/regex");
const tableName = "tbl_customers";
const tableUsers = "tbl_users";
const tableLevel = "tbl_level";
const tableUsersCustomers = "tbl_users_customers";

class CustomersService extends DatabaseService {
  constructor() {
    super();
    // this.validate = this.validate()
  }

  async validate(conn, company = "", email = "", phone = "", id = null) {
    // console.log({ company, email, phone });

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
    } else {
      where += `email = ?`;
      conditions.push(email);
    }

    if ((company && phone) || (email && phone)) {
      where += ` OR phone = ?`;
      conditions.push(phone);
    } else {
      where += `phone = ?`;
      conditions.push(phone);
    }

    where += `)`;

    const dataCheck = await this.select(
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
      errors,
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
        where += ` AND (${tableName}.name LIKE ? OR ${tableName}.company LIKE ? OR ${tableName}.email LIKE ? OR ${tableName}.phone LIKE ? OR ${tableName}.address LIKE ? OR ${tableName}.tax_code LIKE ?)`;
        conditions.push(
          `%${query.keyword}%`,
          `%${query.keyword}%`,
          `%${query.keyword}%`,
          `%${query.keyword}%`,
          `%${query.keyword}%`,
          `%${query.keyword}%`
        );
      }

      if (query.level_id) {
        where += ` AND level_id = ?`;
        conditions.push(query.level_id);
      }

      const joinTable = `${tableName} INNER JOIN ${tableLevel} ON ${tableName}.level_id = ${tableLevel}.id`;

      const select = `${tableName}.id,${tableName}.name,${tableName}.company,${tableName}.email,${tableName}.phone,${tableName}.address,${tableName}.tax_code,${tableName}.website,${tableLevel}.name as level_name,${tableName}.created_at,${tableName}.updated_at`;

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
      throw error;
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { id } = params;
      const isDeleted = query.is_deleted || 0;
      const where = `${tableName}.is_deleted = ? AND ${tableName}.id = ?`;
      const conditions = [isDeleted, id];

      const selectData = `${tableName}.id,${tableName}.name,${tableName}.company,${tableName}.email,${tableName}.phone,${tableName}.address,${tableName}.tax_code,${tableName}.website,${tableName}.level_id`;

      const { conn } = await db.getConnection();
      const res_ = await this.select(
        conn,
        tableName,
        selectData,
        where,
        conditions
      );
      conn.release();
      return res_;
    } catch (error) {
      throw error;
    }
  }

  //Register
  async register(body) {
    const { conn, connPromise } = await db.getConnection();
    try {
      const {
        level_id,
        name,
        company,
        email,
        phone,
        address,
        tax_code,
        website,
        parent_id,
        username,
        password,
        role_id,
        publish,
      } = body;
      const code = makeCode();
      const customer = new CustomersModel({
        level_id,
        code,
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        tax_code: tax_code || null,
        website: website || null,
        publish,
        is_deleted: 0,
        created_at: Date.now(),
      });
      delete customer.updated_at;

      if (company || email || phone) {
        const isCheck = await this.validate(conn, company, email, phone);
        if (!isCheck.result) {
          conn.release();
          throw isCheck.errors;
        }
      }

      await connPromise.beginTransaction();
      const res_ = await this.insert(conn, tableName, customer);
      await connPromise.commit();
      conn.release();
      customer.id = res_;
      delete customer.is_deleted;
      return customer;
    } catch (error) {
      await connPromise.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  //update
  async updateById(body, params) {
    const { conn, connPromise } = await db.getConnection();
    try {
      const { id } = params;
      const {
        level_id,
        name,
        company,
        email,
        phone,
        address,
        tax_code,
        website,
        publish,
      } = body;
      const customer = new CustomersModel({
        level_id,
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        tax_code: tax_code || null,
        website: website || null,
        publish,
        updated_at: Date.now(),
      });
      delete customer.code;
      delete customer.is_deleted;
      delete customer.created_at;

      if (company || email || phone) {
        const isCheck = await this.validate(conn, company, email, phone, id);
        if (!isCheck.result) {
          conn.release();
          throw isCheck.errors;
        }
      }

      await connPromise.beginTransaction();
      await this.update(conn, tableName, customer, "id", id);
      await connPromise.commit();

      conn.release();
      customer.id = id;
      return customer;
    } catch (error) {
      await connPromise.rollback();
      throw error;
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
      throw error;
    }
  }

  //updatePublish
  async updatePublish(body, params) {
    try {
      const { id } = params;
      const { publish } = body;

      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { publish }, "id", id);
      conn.release();
      return [];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CustomersService();
