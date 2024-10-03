const driverApi = require("../api/driver.api");
const { ERROR, WRITE_CARD_FAIL } = require("../constants/msg.constant");
const { REDIS_KEY_LIST_DRIVER } = require("../constants/redis.constant");
const {
  tableDriver,
  tableLicenseType,
  tableCustomers,
  tableUsersCustomers,
  tableUsersRole,
  tableRole,
  tableUsers,
  tableDevice,
  tableCustomersDriver,
} = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const { hSet, hdelOneKey } = require("./redis.model");
const DriverSchema = require("./schema/driver.schema");
const handleReplaceData = require("../ultils/replaceData");

class DriverModel extends DatabaseModel {
  //getallrow
  async getallrows(conn, query, left, right) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;

    const joinTableUserCustomer = `${tableUsers} u INNER JOIN ${tableUsersCustomers} uc ON u.id = uc.user_id`;
    const where =
      "u.left >= ? AND u.right <= ? AND u.is_main = 1 AND u.is_deleted = 0";
    const treeUser = await this.select(
      conn,
      joinTableUserCustomer,
      "u.id,uc.customer_id",
      where,
      [left, right],
      "u.left",
      "ASC",
      0,
      9999999
    );

    if (!treeUser?.length) return [];

    const listCustomer = treeUser.map((item) => item.customer_id);

    let whereDriver = `cdr.customer_id IN (?) AND dr.is_deleted = ? `;
    const conditions = [listCustomer, isDeleted];

    if (query.keyword) {
      whereDriver += ` AND (dr.name LIKE ? OR dr.license_number LIKE ? OR dr.phone LIKE ?)`;
      conditions.push(
        `%${query.keyword}%`,
        `%${query.keyword}%`,
        `%${query.keyword}%`
      );
    }

    if (query.is_check) {
      whereDriver += ` AND dr.is_check = ?`;
      conditions.push(query.is_check);
    }

    const joinTable = `${tableCustomersDriver} cdr INNER JOIN ${tableDriver} dr ON cdr.driver_id = dr.id
     INNER JOIN ${tableLicenseType} lt ON dr.license_type_id = lt.id
     INNER JOIN ${tableCustomers} c ON cdr.customer_id = c.id 
     INNER JOIN ${tableUsersCustomers} uc  ON cdr.creator = uc.user_id 
     INNER JOIN ${tableCustomers} c1 ON uc.customer_id = c1.id 
     INNER JOIN ${tableUsers} u ON cdr.creator = u.id
     INNER JOIN ${tableUsersRole} ur ON cdr.creator = ur.user_id 
     INNER JOIN ${tableRole} r ON ur.role_id = r.id
    `;

    // const joinTable = `${tableDriver}
    //  INNER JOIN ${tableLicenseType} ON ${tableDriver}.license_type_id = ${tableLicenseType}.id
    //  INNER JOIN ${tableCustomers} ON ${tableDriver}.customer_id = ${tableCustomers}.id
    //  INNER JOIN ${tableUsersCustomers} ON ${tableDriver}.creator = ${tableUsersCustomers}.user_id
    //  INNER JOIN ${tableCustomers} c ON ${tableUsersCustomers}.customer_id = c.id
    //  INNER JOIN ${tableUsers} ON ${tableDriver}.creator = ${tableUsers}.id
    //  INNER JOIN ${tableUsersRole} ON ${tableDriver}.creator = ${tableUsersRole}.user_id
    //  INNER JOIN ${tableRole} ON ${tableUsersRole}.role_id = ${tableRole}.id`;

    const select = `cdr.id,dr.name,dr.license_number,dr.is_actived,dr.is_check,
      dr.phone,dr.address,dr.birthday,dr.expired_on,dr.activation_date,
      lt.title as license_type_name,c.name as customer_name,dr.gender,
      CONCAT(u.username,"(",r.name,") ",COALESCE(c1.company, c1.name)) as creator,dr.citizen_identity_card,dr.created_at,dr.updated_at`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        whereDriver,
        conditions,
        `cdr.id`,
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "*", whereDriver, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  //get tree
  async getTree(conn, query, left, right) {
    const offset = query.offset || 0;
    const limit = query.limit || 99999999;
    const isDeleted = query.is_deleted || 0;

    const joinTableUserCustomer = `${tableUsers} u INNER JOIN ${tableUsersCustomers} uc ON u.id = uc.user_id`;
    const where =
      "u.left >= ? AND u.right <= ? AND u.is_main = 1 AND u.is_deleted = 0";
    const treeUser = await this.select(
      conn,
      joinTableUserCustomer,
      "u.id,uc.customer_id",
      where,
      [left, right],
      "u.left",
      "ASC",
      0,
      9999999
    );

    if (!treeUser?.length) return [];

    const listCustomer = treeUser.map((item) => item.customer_id);

    const joinTable = `${tableCustomersDriver} cdr INNER JOIN ${tableDriver} dr ON cdr.driver_id = dr.id`;
    const whereDriver =
      "cdr.customer_id IN (?) AND cdr.is_deleted = ? AND dr.is_deleted = ?";
    const conditions = [listCustomer, isDeleted, isDeleted];
    const select = `cdr.id,cdr.customer_id, dr.id, dr.name,dr.license_number,dr.phone`;

    const data = await this.select(
      conn,
      joinTable,
      select,
      `${whereDriver} GROUP BY cdr.customer_id`,
      conditions,
      "cdr.id",
      "DESC",
      offset,
      limit
    );

    return data;
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `cdr.id = ? AND dr.is_deleted = ? AND cdr.is_deleted = 0`;
    const conditions = [id, isDeleted];
    const selectData = `cdr.id,
      cdr.customer_id,
      dr.name,
      dr.license_number,
      dr.birthday,
      dr.citizen_identity_card,
      dr.gender,
      dr.phone,
      dr.address,
      dr.license_type_id,
      dr.expired_on,
      dr.activation_date,
      dr.is_actived`;

    const joinTable = `${tableDriver} dr INNER JOIN ${tableCustomersDriver} cdr ON dr.id = cdr.driver_id`;

    const res_ = await this.select(
      conn,
      joinTable,
      selectData,
      where,
      conditions,
      "cdr.id",
      "DESC",
      0,
      1
    );
    return res_;
  }

  async wirteCard(conn, body) {
    const { license_number, name, device_id } = body;
    const infoDevice = await this.select(conn, tableDevice, "imei", "id = ?", [
      device_id,
    ]);
    // console.log("infoDevice", infoDevice);
    if (!infoDevice?.length)
      throw { msg: ERROR, errors: [{ msg: WRITE_CARD_FAIL }] };
    const formatName = handleReplaceData(name);

    const { result, message, status, data, options } =
      await driverApi.writeCard({
        license_number,
        name: formatName,
        imei: infoDevice[0].imei,
      });
    // console.log("result", result);
    if (!result) throw { msg: ERROR, errors: [{ msg: WRITE_CARD_FAIL }] };
    return { message, status, data, options };
  }

  //Register
  async register(conn, connPromise, body, accId) {
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
    await connPromise.beginTransaction();

    const res_ = await this.insertDuplicate(
      conn,
      tableDriver,
      ` 
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
        is_check,
        is_actived,
        is_deleted,
        created_at`,
      [
        [
          name,
          license_number,
          birthday || null,
          citizen_identity_card || null,
          gender,
          phone || null,
          address || null,
          license_type_id,
          expired_on || null,
          activation_date || null,
          0,
          is_actived,
          0,
          Date.now(),
        ],
      ],
      `is_deleted=VALUES(is_deleted),updated_at=VALUES(created_at)`
    );

    await this.insertDuplicate(
      conn,
      tableCustomersDriver,
      ` creator,
        customer_id,
        driver_id,
        is_deleted,
        created_at`,
      [[accId, customer_id, res_, 0, Date.now()]],
      `is_deleted=VALUES(is_deleted),updated_at=VALUES(created_at)`
    );

    driver.id = res_;
    delete driver.is_deleted;
    delete driver.is_check;

    const dataRedis = { name, phone, address, gender };
    const { result } = await hSet(
      REDIS_KEY_LIST_DRIVER,
      license_number.toString(),
      JSON.stringify(dataRedis)
    );

    if (!result) throw { msg: ERROR };
    await connPromise.commit();
    return driver;
  }

  //update
  async updateById(
    conn,
    connPromise,
    body,
    params,
    driverId,
    customerId,
    licenseNumber
  ) {
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
    delete driver.customer_id;
    delete driver.is_check;
    delete driver.is_deleted;
    delete driver.created_at;

    await connPromise.beginTransaction();

    await this.update(conn, tableDriver, driver, "id", driverId);
    driver.id = driverId;

    if (customer_id != customerId) {
      await this.update(conn, tableCustomersDriver, { customer_id }, "id", id);
    }

    const dataRedis = { name, phone, address, gender };

    const { result } = await hSet(
      REDIS_KEY_LIST_DRIVER,
      license_number.toString(),
      JSON.stringify(dataRedis)
    );

    if (!result) throw { msg: ERROR };

    if (licenseNumber.toString() !== license_number.toString()) {
      await hdelOneKey(REDIS_KEY_LIST_DRIVER, licenseNumber.toString());
    }

    await connPromise.commit();

    return driver;
  }

  //delete
  async deleteById(conn, connPromise, params, driverInfo, isDeleteđriver) {
    const { id } = params;
    const { driver_id, license_number } = driverInfo;
    await connPromise.beginTransaction();

    await this.update(conn, tableCustomersDriver, { is_deleted: 1 }, "id", id);

    if (isDeleteđriver) {
      await this.update(
        conn,
        tableDriver,
        { is_deleted: Date.now() },
        "id",
        driver_id
      );
      await hdelOneKey(REDIS_KEY_LIST_DRIVER, license_number.toString());
    }

    await connPromise.commit();
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
