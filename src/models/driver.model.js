const driverApi = require("../api/driver.api");
const {
  ERROR,
  WRITE_CARD_FAIL,
  WRITE_CARD_SUCCESS,
} = require("../constants/msg.constant");
const {
  REDIS_KEY_LIST_DRIVER,
  REDIS_KEY_SV_CAM,
} = require("../constants/redis.constant");
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
const { hSet, hdelOneKey, hGet } = require("./redis.model");
const DriverSchema = require("./schema/driver.schema");
const handleReplaceData = require("../ultils/replaceData");
const transmissionInfoApi = require("../api/transmissionInfo.api");
const { date, String2Unit } = require("../ultils/getTime");
const {
  CREATE_TYPE,
  UPDATE_TYPE,
  DELETE_TYPE,
} = require("../constants/global.constant");

class DriverModel extends DatabaseModel {
  constructor() {
    super();
    this.modelCam = {
      33: { isExisted: true, fn: this.getDataWriteCardAICam },
      32: { isExisted: true, fn: this.getDataWriteCardCMRGSHT },
      23: { isExisted: true, fn: this.getDataWriteCardCMRGSHT },
    };
  }

  async transmission({
    conn,
    licenseTypeId: license_type_id,
    licenseNumber: license_number,
    name,
    activationDate: activation_date,
    expiredOn: expired_on,
    placeOfIssue: place_of_issue,
    type,
  }) {
    const dataLicenseType = await this.select(
      conn,
      tableLicenseType,
      "id,title",
      "id = ? ",
      license_type_id
    );

    // console.log("dataLicenseType", dataLicenseType);

    if (dataLicenseType?.length) {
      const licenseType = dataLicenseType[0]?.title;
      await transmissionInfoApi.driver({
        license_number,
        name,
        issue_date: date(activation_date),
        expired_date: date(expired_on),
        issue_place: place_of_issue,
        license_type: licenseType,
        time: String2Unit(Date.now()),
        type,
      });
    }
  }

  getDataWriteCardAICam = ({ licenseNumber, name }) => {
    return {
      Flag: 9,
      TextInfo: `#RfidWrite:id=${licenseNumber},name=${name}#`,
      TextType: 1,
      utf8: 1,
    };
  };

  getDataWriteCardCMRGSHT = ({ licenseNumber, name }) => {
    return {
      Flag: 9,
      TextInfo: `<EXTM1YN,${licenseNumber},${name}>`,
      TextType: 1,
      utf8: 1,
    };
  };

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

    let whereDriver = `cdr.customer_id IN (?) AND dr.is_deleted = ? AND cdr.is_deleted = ?`;
    const conditions = [listCustomer, isDeleted, isDeleted];

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

    const select = `cdr.id,dr.name,dr.license_number,dr.is_actived,dr.is_check,dr.place_of_issue,
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
      `${whereDriver} GROUP BY dr.license_number`,
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
      dr.place_of_issue,
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

  async writeCard(conn, body) {
    const { license_number, name, device_id } = body;
    const infoDevice = await this.select(
      conn,
      tableDevice,
      "imei,model_id,sv_cam_id",
      "id = ? AND is_deleted = 0",
      [device_id]
    );
    // console.log("infoDevice", infoDevice);
    if (!infoDevice?.length)
      throw { msg: ERROR, errors: [{ msg: WRITE_CARD_FAIL }] };
    const formatName = handleReplaceData(name);

    const { imei, model_id, sv_cam_id } = infoDevice[0];

    if (this.modelCam?.[model_id]?.isExisted && sv_cam_id) {
      const { data } = await hGet(REDIS_KEY_SV_CAM, sv_cam_id.toString());

      // console.log("data");

      if (!data) throw { msg: ERROR, errors: [{ msg: WRITE_CARD_FAIL }] };

      const { host, port } = JSON.parse(data);
      const bodySendCms = this.modelCam[model_id].fn({
        licenseNumber: license_number,
        name: formatName,
      });

      const res = await driverApi.writeCardCms({
        url: host,
        body: bodySendCms,
        params: { Command: 33536, DevIDNO: imei, toMap: 1 },
        port,
      });
      // console.log("res", res);
      if (res?.result !== 0)
        throw { msg: ERROR, errors: [{ msg: res?.message }] };
    } else {
      // const { result, message, status, data, options } =
      const { result } = await driverApi.writeCard({
        license_number,
        name: formatName,
        imei,
      });
      // console.log("result", { result, message, status, data, options });
      if (!result) throw { msg: ERROR, errors: [{ msg: WRITE_CARD_FAIL }] };
      // return { message, status, data, options };
    }
    return { message: WRITE_CARD_SUCCESS };
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
      place_of_issue,
      is_actived,
    } = body;

    const driver = new DriverSchema({
      name,
      license_number,
      expired_on,
      activation_date,
      place_of_issue,
      license_type_id,
      birthday: birthday || null,
      citizen_identity_card: citizen_identity_card || null,
      gender,
      phone: phone || null,
      address: address || null,
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
      Object.keys(driver).join(","),
      [Object.values(driver)],
      `is_deleted=VALUES(is_deleted),updated_at=VALUES(created_at)`,
      true
    );

    // console.log("res_", res_);
    const { insertId: driverId, affectedRows } = res_;

    await this.insertDuplicate(
      conn,
      tableCustomersDriver,
      ` creator,
        customer_id,
        driver_id,
        is_deleted,
        created_at`,
      [[accId, customer_id, driverId, 0, Date.now()]],
      `is_deleted=VALUES(is_deleted),updated_at=VALUES(created_at)`
    );

    driver.id = driverId;
    delete driver.is_deleted;
    delete driver.is_check;

    const dataRedis = { name, phone, address, gender };
    const { result } = await hSet(
      REDIS_KEY_LIST_DRIVER,
      license_number.toString(),
      JSON.stringify(dataRedis)
    );

    if (!result) throw { msg: ERROR };

    if (affectedRows == 1) {
      await this.transmission({
        conn,
        licenseNumber: license_number,
        licenseTypeId: license_type_id,
        name,
        activationDate: activation_date,
        expiredOn: expired_on,
        placeOfIssue: place_of_issue,
        type: CREATE_TYPE,
      });
    }

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
      place_of_issue,
      is_actived,
    } = body;
    const { id } = params;

    const driver = new DriverSchema({
      name,
      license_number,
      expired_on,
      activation_date,
      place_of_issue,
      license_type_id,
      birthday: birthday || null,
      citizen_identity_card: citizen_identity_card || null,
      gender,
      phone: phone || null,
      address: address || null,
      is_actived,
      updated_at: Date.now(),
    });
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

    await this.transmission({
      conn,
      licenseNumber: license_number,
      licenseTypeId: license_type_id,
      name,
      activationDate: activation_date,
      expiredOn: expired_on,
      placeOfIssue: place_of_issue,
      type: UPDATE_TYPE,
    });

    await connPromise.commit();

    return driver;
  }

  //delete
  async deleteById(conn, connPromise, params, driverInfo, isDeleteđriver) {
    const { id } = params;
    const {
      driver_id,
      license_number,
      license_type_id,
      name,
      activation_date,
      expired_on,
      place_of_issue,
    } = driverInfo;
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

      await this.transmission({
        conn,
        licenseNumber: license_number,
        licenseTypeId: license_type_id,
        name,
        activationDate: activation_date || null,
        expiredOn: expired_on,
        placeOfIssue: place_of_issue || null,
        type: DELETE_TYPE,
      });
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
