const DatabaseSchema = require("./database.model");
const CustomersSchema = require("./schema/customers.schema");

const { makeCode } = require("../helper/makeCode.helper");
const usersModel = require("./users.model");
const {
  tableCustomers,
  tableLevel,
  tableUsersCustomers,
  tableUsers,
} = require("../constants/tableName.constant");
const vehicleModel = require("./vehicle.model");
const { DELETED_CUSTOMER, ERROR } = require("../constants/msg.constant");
const transmissionInfoApi = require("../api/transmissionInfo.api");
const { String2Unit } = require("../utils/time.util");
const {
  CREATE_TYPE,
  UPDATE_TYPE,
  DELETE_TYPE,
} = require("../constants/global.constant");
const handleShufflePhoneNumber = require("../helper/shufflePhoneNumber");
const cacheModel = require("./cache.model");
const { REDIS_KEY_LIST_USER_INFO } = require("../constants/redis.constant");

class CustomersModel extends DatabaseSchema {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query, left, right) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;

    const { keyword, is_deleted, level_id } = query;

    // console.log("left, right", left, right);

    const joinTable = `${tableUsers} u INNER JOIN ${tableUsersCustomers} uc ON u.id = uc.user_id 
      INNER JOIN ${tableCustomers} c ON uc.customer_id = c.id
      INNER JOIN ${tableLevel} lv ON c.level_id = lv.id`;

    const select = `u.username,u.id as user_id,u.is_actived,c.id ,c.name,c.company,c.email,c.phone,c.address,
      c.tax_code,c.website,lv.name as level_name,c.created_at,c.updated_at`;

    let where_ = `u.left > ? AND u.right < ? AND u.is_main = 1 AND c.is_deleted = ? AND u.is_deleted = ?`;
    const conditions_ = [left, right, is_deleted, is_deleted];

    if (keyword) {
      where_ += ` AND (c.name LIKE ? OR c.company LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.address LIKE ? OR c.tax_code LIKE ?)`;
      conditions_.push(
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`
      );
    }

    if (level_id) {
      where_ += ` AND c.level_id = ?`;
      conditions_.push(level_id);
    }

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where_,
        conditions_,
        `c.id`,
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "*", where_, conditions_),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  async handleTransmission({ tax_code, company, address, phone, type }) {
    await transmissionInfoApi.company({
      tax_code,
      full_name: company,
      address,
      phone: phone ? handleShufflePhoneNumber(phone) : null,
      time: String2Unit(Date.now()),
      type,
    });
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `${tableCustomers}.is_deleted = ? AND ${tableCustomers}.id = ?`;
    const conditions = [isDeleted, id];

    const selectData = `${tableCustomers}.id,${tableCustomers}.name,${tableCustomers}.company,${tableCustomers}.email,${tableCustomers}.phone,${tableCustomers}.address,${tableCustomers}.tax_code,${tableCustomers}.website,${tableCustomers}.level_id,${tableCustomers}.business_type_id`;

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
  register = async (conn, connPromise, body, isCommit = true) => {
    const {
      level_id,
      name,
      company,
      email,
      phone,
      address,
      tax_code,
      website,
      business_type_id,
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
      business_type_id: business_type_id || null,
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

    //transmission
    if (tax_code) {
      await this.handleTransmission({
        tax_code,
        company,
        address,
        phone,
        type: CREATE_TYPE,
      });
    }

    if (isCommit) {
      await connPromise.commit();
      customer.id = res_;
    }

    delete customer.is_deleted;
    customer = { ...customer, ...user[0] };
    return customer;
  };

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
      business_type_id,
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
      business_type_id: business_type_id || null,
      tax_code: tax_code || null,
      website: website || null,
      publish,
      updated_at: Date.now(),
    });
    delete customer.code;
    delete customer.is_deleted;
    delete customer.created_at;

    const joinTable = `${tableCustomers} c INNER JOIN ${tableUsersCustomers} uc ON c.id = uc.customer_id`;
    const infoUser = await this.select(
      conn,
      joinTable,
      "uc.user_id,c.name,c.company",
      "uc.customer_id = ? AND c.is_deleted = ?",
      [id, 0],
      "c.id"
    );

    if (!infoUser?.length) throw { msg: DELETED_CUSTOMER };
    const {
      user_id: userId,
      name: nameCustomer,
      company: companyCustomer,
    } = infoUser[0];
    await connPromise.beginTransaction();

    await this.update(conn, tableCustomers, customer, "id", id);

    if (name != nameCustomer || company != companyCustomer) {
      await vehicleModel.getInfoDevice(conn, null, null, userId);
    }

    //transmission
    if (tax_code) {
      await this.handleTransmission({
        tax_code,
        company,
        address,
        phone,
        type: UPDATE_TYPE,
      });
    }

    const resultDelCache = await cacheModel.hdelOneKeyRedis(
      REDIS_KEY_LIST_USER_INFO,
      userId
    );
    if (!resultDelCache) throw { msg: ERROR };

    await connPromise.commit();
    customer.id = id;
    return customer;
  }

  //delete
  async deleteById(conn, params, info) {
    const { id } = params;

    const { tax_code, company, address, phone } = info[0];
    await this.update(conn, tableCustomers, { is_deleted: 1 }, "id", id);
    // console.log("tax_code", tax_code);
    if (tax_code) {
      await this.handleTransmission({
        tax_code,
        company,
        address,
        phone,
        type: DELETE_TYPE,
      });
    }
    // await vehicleModel.getInfoDevice(conn);
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
