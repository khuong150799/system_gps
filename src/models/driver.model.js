const DriverSchema = require("./schema/driver.schema");
const tableName = "tbl_driver";
const tableUsersRole = "tbl_users_role";
const tableRole = "tbl_role";
const tableCustomers = "tbl_customers";
const tableUsersCustomers = "tbl_users_customers";
const tableLicenseType = "tbl_license_type";
const tableUsers = "tbl_users";

class DriverModel {
  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    let where = `${tableName}.is_deleted = ?`;
    const conditions = [isDeleted];

    if (query.keyword) {
      where += ` AND (${tableName}.name LIKE ? OR ${tableName}.license_number LIKE ? OR ${tableName}.phone LIKE ?)`;
      conditions.push(
        `%${query.keyword}%`,
        `%${query.keyword}%`,
        `%${query.keyword}%`
      );
    }

    if (query.customer_id) {
      where += ` AND ${tableName}.customer_id = ?`;
      conditions.push(query.customer_id);
    }

    if (query.is_check) {
      where += ` AND ${tableName}.is_check = ?`;
      conditions.push(query.is_check);
    }
    const joinTable = `${tableName} INNER JOIN ${tableLicenseType} ON ${tableName}.license_type_id = ${tableLicenseType}.id
     INNER JOIN ${tableCustomers} ON ${tableName}.customer_id = ${tableCustomers}.id 
     INNER JOIN ${tableUsersCustomers} ON ${tableName}.creator = ${tableUsersCustomers}.user_id 
     INNER JOIN ${tableCustomers} c ON ${tableUsersCustomers}.customer_id = c.id 
     INNER JOIN ${tableUsers} ON ${tableName}.creator = ${tableUsers}.id
     INNER JOIN ${tableUsersRole} ON ${tableName}.creator = ${tableUsersRole}.user_id 
     INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id`;

    const select = `${tableName}.id,${tableName}.name,${tableName}.license_number,${tableName}.is_actived,${tableName}.is_check,
      ${tableName}.phone,${tableName}.address,${tableName}.birthday,${tableName}.expired_on,${tableName}.activation_date,
      ${tableLicenseType}.title as license_type_name,${tableCustomers}.name,${tableName}.gender,
      CONCAT(${tableUsers}.username,"(",${tableRole}.name,") ",COALESCE(c.company, c.name)) as ceator,${tableName}.citizen_identity_card,${tableName}.created_at,${tableName}.updated_at`;

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
      this.count(conn, tableName, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `${tableName}.is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `id,customer_id,
      name,
      license_number,
      birthday,
      citizen_identity_card,
      gender,
      phone,
      address,
      license_type_id,
      expired_on,
      activation_date,
      is_actived`;

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
  async register(conn, body, accId) {
    const {
      customer_id,
      name,
      license_number,
      birthday,
      citizen_identity_card,
      gender,
      phone,
      address,
      license_type_id,
      expired_on,
      activation_date,
      is_actived,
    } = body;
    const driver = new DriverSchema({
      creator: accId,
      customer_id,
      name,
      license_number,
      birthday: birthday || null,
      citizen_identity_card: citizen_identity_card || null,
      gender,
      phone: phone || null,
      address: address || null,
      license_type_id,
      expired_on: expired_on || null,
      activation_date: activation_date || null,
      is_check: 0,
      is_actived,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete driver.updated_at;

    const res_ = await this.insert(conn, tableName, driver);
    driver.id = res_;
    delete driver.is_deleted;
    delete driver.is_check;
    return driver;
  }

  //update
  async updateById(conn, body, params) {
    const {
      customer_id,
      name,
      license_number,
      birthday,
      citizen_identity_card,
      gender,
      phone,
      address,
      license_type_id,
      expired_on,
      activation_date,
      is_actived,
    } = body;
    const { id } = params;

    const driver = new DriverSchema({
      customer_id,
      name,
      license_number,
      birthday: birthday || null,
      citizen_identity_card: citizen_identity_card || null,
      gender,
      phone: phone || null,
      address: address || null,
      license_type_id,
      expired_on: expired_on || null,
      activation_date: activation_date || null,
      is_actived,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete driver.creator;
    delete driver.is_check;
    delete driver.is_deleted;
    delete driver.created_at;

    await this.update(conn, tableName, driver, "id", id);
    driver.id = id;
    return driver;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableName, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updateActived
  async updateActived(conn, body, params) {
    const { id } = params;
    const { is_actived } = body;
    await this.update(conn, tableName, { is_actived }, "id", id);
    return [];
  }

  //updateCheck
  async updateCheck(conn, body, params) {
    const { id } = params;
    const { is_check } = body;

    await this.update(conn, tableName, { is_check }, "id", id);
    return [];
  }
}

module.exports = new DriverModel();
