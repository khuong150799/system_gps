const driverApi = require("../api/driverApi");
const { ERROR, WRITE_CARD_FAIL } = require("../constants/msg.contant");
const { REDIS_KEY_LIST_DRIVER } = require("../constants/redis.contant");
const {
  tableDriver,
  tableLicenseType,
  tableCustomers,
  tableUsersCustomers,
  tableUsersRole,
  tableRole,
  tableUsers,
  tableDevice,
} = require("../constants/tableName.contant");
const DatabaseModel = require("./database.model");
const { hSet, hdelOneKey, hGet } = require("./redis.model");
const DriverSchema = require("./schema/driver.schema");

class DriverModel extends DatabaseModel {
  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    let where = `${tableDriver}.is_deleted = ?`;
    const conditions = [isDeleted];

    if (query.keyword) {
      where += ` AND (${tableDriver}.name LIKE ? OR ${tableDriver}.license_number LIKE ? OR ${tableDriver}.phone LIKE ?)`;
      conditions.push(
        `%${query.keyword}%`,
        `%${query.keyword}%`,
        `%${query.keyword}%`
      );
    }

    if (query.customer_id) {
      where += ` AND ${tableDriver}.customer_id = ?`;
      conditions.push(query.customer_id);
    }

    if (query.is_check) {
      where += ` AND ${tableDriver}.is_check = ?`;
      conditions.push(query.is_check);
    }
    const joinTable = `${tableDriver} INNER JOIN ${tableLicenseType} ON ${tableDriver}.license_type_id = ${tableLicenseType}.id
     INNER JOIN ${tableCustomers} ON ${tableDriver}.customer_id = ${tableCustomers}.id 
     INNER JOIN ${tableUsersCustomers} ON ${tableDriver}.creator = ${tableUsersCustomers}.user_id 
     INNER JOIN ${tableCustomers} c ON ${tableUsersCustomers}.customer_id = c.id 
     INNER JOIN ${tableUsers} ON ${tableDriver}.creator = ${tableUsers}.id
     INNER JOIN ${tableUsersRole} ON ${tableDriver}.creator = ${tableUsersRole}.user_id 
     INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id`;

    const select = `${tableDriver}.id,${tableDriver}.name,${tableDriver}.license_number,${tableDriver}.is_actived,${tableDriver}.is_check,
      ${tableDriver}.phone,${tableDriver}.address,${tableDriver}.birthday,${tableDriver}.expired_on,${tableDriver}.activation_date,
      ${tableLicenseType}.title as license_type_name,${tableCustomers}.name as customer_name,${tableDriver}.gender,
      CONCAT(${tableUsers}.username,"(",${tableRole}.name,") ",COALESCE(c.company, c.name)) as creator,${tableDriver}.citizen_identity_card,${tableDriver}.created_at,${tableDriver}.updated_at`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        `${tableDriver}.id`,
        "DESC",
        offset,
        limit
      ),
      this.count(conn, tableDriver, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  //get tree
  async getTree(conn, query, userId) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    let where = `u.parent_id = ? AND dr.is_deleted = ?`;
    const conditions = [userId, isDeleted];
    const whereDequy = `AND dr.is_deleted = ${isDeleted}`;

    const joinTable = `${tableDriver} dr INNER JOIN ${tableUsersCustomers} uc ON dr.customer_id = uc.customer_id
     INNER JOIN ${tableUsers} u ON uc.user_id = u.id`;

    const select = `u.id,dr.name,dr.license_number,dr.phone`;

    const res_ = await this.getAllRowsMenu(
      conn,
      joinTable,
      select,
      where,
      conditions,
      `u.id`,
      "DESC",
      select,
      whereDequy,
      `u.id`,
      "DESC"
    );

    return res_;
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `${tableDriver}.is_deleted = ? AND id = ?`;
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
      tableDriver,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  async wirteCard(conn, body) {
    const { license_number, name, device_id } = body;
    const infoDevice = await this.select(conn, tableDevice, "imei", "id = ?", [
      device_id,
    ]);
    if (!infoDevice?.length)
      throw { msg: ERROR, errors: [{ msg: WRITE_CARD_FAIL }] };
    const { result } = await driverApi.writeCard({
      license_number,
      name,
      imei: infoDevice[0].imei,
    });

    if (!result) throw { msg: ERROR, errors: [{ msg: WRITE_CARD_FAIL }] };
    return [];
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

    const res_ = await this.insert(conn, tableDriver, driver);
    driver.id = res_;
    delete driver.is_deleted;
    delete driver.is_check;

    const dataRedis = { name, phone, address, gender, listDevices: [] };
    await hSet(
      REDIS_KEY_LIST_DRIVER,
      license_number.toString(),
      JSON.stringify(dataRedis)
    );
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

    const dataOled = await this.select(
      conn,
      tableDriver,
      "license_number",
      "id = ?",
      id
    );

    await this.update(conn, tableDriver, driver, "id", id);
    driver.id = id;

    const dataRedisOld = await hGet(
      REDIS_KEY_LIST_DRIVER,
      license_number.toString()
    );

    const dataRedis = { name, phone, address, gender, listDevices: [] };
    if (dataRedisOld && Object.values(dataRedisOld).length) {
      const { listDevices: listDevicesOld } = dataRedisOld;
      dataRedis.listDevices = listDevicesOld;
    }

    await hSet(
      REDIS_KEY_LIST_DRIVER,
      license_number.toString(),
      JSON.stringify(dataRedis)
    );

    if (
      dataOled?.length &&
      dataOled[0].license_number.toString() !== license_number.toString()
    ) {
      await hdelOneKey(
        REDIS_KEY_LIST_DRIVER,
        dataOled[0].license_number.toString()
      );
    }

    return driver;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableDriver, { is_deleted: Date.now() }, "id", id);
    return [];
  }

  //updateActived
  async updateActived(conn, body, params) {
    const { id } = params;
    const { is_actived } = body;
    await this.update(conn, tableDriver, { is_actived }, "id", id);
    return [];
  }

  //updateCheck
  async updateCheck(conn, body, params) {
    const { id } = params;
    const { is_check } = body;

    await this.update(conn, tableDriver, { is_check }, "id", id);
    return [];
  }
}

module.exports = new DriverModel();
