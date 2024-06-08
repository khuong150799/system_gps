const DatabaseSchema = require("./database.model");
const CustomersSchema = require("./schema/customers.schema");

const { makeCode } = require("../ultils/makeCode");
const usersModel = require("./users.model");
const tableName = "tbl_customers";
const tableLevel = "tbl_level";

class CustomersModel extends DatabaseSchema {
  constructor() {
    super();
    // this.validate = this.validate()
  }

  //getallrow
  async getallrows(conn, query) {
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

    return { data: res_, totalPage };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `${tableName}.is_deleted = ? AND ${tableName}.id = ?`;
    const conditions = [isDeleted, id];

    const selectData = `${tableName}.id,${tableName}.name,${tableName}.company,${tableName}.email,${tableName}.phone,${tableName}.address,${tableName}.tax_code,${tableName}.website,${tableName}.level_id`;

    const res_ = await this.select(
      conn,
      tableName,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, connPromise, body, isCommit = true) {
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
    let customer = new CustomersSchema({
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
    if (isCommit) {
      await connPromise.beginTransaction();
    }
    const res_ = await this.insert(conn, tableName, customer);

    const dataInsertUser = {
      parent_id,
      username,
      password,
      role_id,
      customer_id: res_,
      is_actived: 1,
    };
    const user = await usersModel.register(
      conn,
      connPromise,
      dataInsertUser,
      -1,
      false
    );
    if (isCommit) {
      await connPromise.commit();
    }
    if (isCommit) {
      customer.id = res_;
    }

    delete customer.is_deleted;
    customer = { ...customer, ...user[0] };
    return customer;
  }

  //update
  async updateById(conn, connPromise, body, params) {
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
    const customer = new CustomersSchema({
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

    await connPromise.beginTransaction();
    await this.update(conn, tableName, customer, "id", id);
    await connPromise.commit();

    customer.id = id;
    return customer;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableName, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;
    await this.update(conn, tableName, { publish }, "id", id);
    return [];
  }
}

module.exports = new CustomersModel();
