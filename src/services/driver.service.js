const DatabaseService = require("./query.service");
const DriverModel = require("../models/driver.model");
const db = require("../dbs/init.mysql");
const { ERROR, VALIDATE_PHONE, ALREADY_EXITS } = require("../constants");
const { regexPhoneNumber } = require("../ultils/regex");
const { BusinessLogicError } = require("../core/error.response");
const tableName = "tbl_driver";
const tableUsersRole = "tbl_users_role";
const tableRole = "tbl_role";
const tableCustomers = "tbl_customers";
const tableUsersCustomers = "tbl_users_customers";
const tableLicenseType = "tbl_license_type";
const tableUsers = "tbl_users";

class DriverService extends DatabaseService {
  constructor() {
    super();
  }
  async validate(conn, licenseNumber, phone, id = null) {
    const errors = [];

    if (phone && !regexPhoneNumber(phone))
      return {
        result: false,
        errors: {
          msg: ERROR,
          errors: [
            {
              value: phone,
              msg: `Số điện thoại ${ALREADY_EXITS}`,
              param: "phone",
            },
          ],
        },
      };

    let where = `is_deleted = ?`;
    const conditions = [0];

    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    where += ` AND (license_number = ?`;
    conditions.push(licenseNumber);

    if (phone) {
      where += ` OR phone = ?`;
      conditions.push(phone);
    }

    where += `)`;

    const dataCheck = await this.select(
      conn,
      tableName,
      "license_number,phone",
      where,
      conditions
    );
    if (dataCheck.length <= 0) return { result: true };

    dataCheck.forEach((item) => {
      if (item.license_number === licenseNumber) {
        errors.push({
          value: licenseNumber,
          msg: `Số bằng lái ${ALREADY_EXITS}`,
          param: "license_number",
        });
      } else if (phone && item.phone === phone) {
        errors.push({
          value: phone,
          msg: `Số diện thoại ${ALREADY_EXITS}`,
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
        this.count(conn, tableName, "*", where, conditions),
      ]);

      const totalPage = Math.ceil(count?.[0]?.total / limit);

      conn.release();
      return { data: res_, totalPage };
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params, query) {
    try {
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
      throw new BusinessLogicError(error.msg);
    }
  }

  //Register
  async register(body, accId) {
    try {
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
      const driver = new DriverModel({
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

      const { conn } = await db.getConnection();

      const isCheck = await this.validate(conn, license_number, phone);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const res_ = await this.insert(conn, tableName, driver);
      conn.release();
      driver.id = res_;
      delete driver.is_deleted;
      delete driver.is_check;
      return driver;
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //update
  async updateById(body, params) {
    try {
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

      const { conn } = await db.getConnection();

      const isCheck = await this.validate(conn, license_number, phone, id);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const driver = new DriverModel({
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
      conn.release();
      driver.id = id;
      return driver;
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
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
      throw new BusinessLogicError(error.msg);
    }
  }

  //updateActived
  async updateActived(body, params) {
    try {
      const { id } = params;
      const { is_actived } = body;

      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { is_actived }, "id", id);
      conn.release();
      return [];
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //updateCheck
  async updateCheck(body, params) {
    try {
      const { id } = params;
      const { is_check } = body;

      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { is_check }, "id", id);
      conn.release();
      return [];
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new DriverService();
