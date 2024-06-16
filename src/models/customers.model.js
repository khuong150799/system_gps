const DatabaseSchema = require("./database.model");
const CustomersSchema = require("./schema/customers.schema");

const { makeCode } = require("../ultils/makeCode");
const usersModel = require("./users.model");
const {
  tableCustomers,
  tableLevel,
} = require("../constants/tableName.contant");
const deviceModel = require("./device.model");

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
    let where = `${tableCustomers}.is_deleted = ?`;
    const conditions = [isDeleted];

    if (query.keyword) {
      where += ` AND (${tableCustomers}.name LIKE ? OR ${tableCustomers}.company LIKE ? OR ${tableCustomers}.email LIKE ? OR ${tableCustomers}.phone LIKE ? OR ${tableCustomers}.address LIKE ? OR ${tableCustomers}.tax_code LIKE ?)`;
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

    const joinTable = `${tableCustomers} INNER JOIN ${tableLevel} ON ${tableCustomers}.level_id = ${tableLevel}.id`;

    const select = `${tableCustomers}.id,${tableCustomers}.name,${tableCustomers}.company,${tableCustomers}.email,${tableCustomers}.phone,${tableCustomers}.address,
      ${tableCustomers}.tax_code,${tableCustomers}.website,${tableLevel}.name as level_name,${tableCustomers}.created_at,${tableCustomers}.updated_at`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        `${tableCustomers}.id`,
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
    const where = `${tableCustomers}.is_deleted = ? AND ${tableCustomers}.id = ?`;
    const conditions = [isDeleted, id];

    const selectData = `${tableCustomers}.id,${tableCustomers}.name,${tableCustomers}.company,${tableCustomers}.email,${tableCustomers}.phone,${tableCustomers}.address,${tableCustomers}.tax_code,${tableCustomers}.website,${tableCustomers}.level_id`;

    const res_ = await this.select(
      conn,
      tableCustomers,
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
    const res_ = await this.insert(conn, tableCustomers, customer);

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
    await this.update(conn, tableCustomers, customer, "id", id);
    await connPromise.commit();
    await deviceModel.getWithImei(conn);
    customer.id = id;
    return customer;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableCustomers, { is_deleted: 1 }, "id", id);
    await deviceModel.getWithImei(conn);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;
    await this.update(conn, tableCustomers, { publish }, "id", id);
    return [];
  }
}

module.exports = new CustomersModel();
