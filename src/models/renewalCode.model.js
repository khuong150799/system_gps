const DatabaseModel = require("./database.model");
const {
  tableRenewalCode,
  tableRenewalCodeDevice,
  tableDeviceVehicle,
  tableVehicle,
  tableUsersCustomers,
  tableUsers,
  tableDevice,
  tableServicePackage,
  tableTypeCode,
  tableKeyTime,
} = require("../constants/tableName.constant");
const generateRandomNumber = require("../ultils/randomCode");

class RenewalCodeModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    let where = `1 = ?`;
    const conditions = [1];

    if (query.keyword) {
      where += ` AND (code LIKE ? OR v.name LIKE ?)`;
      conditions.push(`%${query.keyword}%`, `%${query.keyword}%`);
    }

    if (query.type) {
      where += ` AND type = ?`;
      conditions.push(query.type);
    }

    if (query.is_used) {
      where += ` AND is_used = ?`;
      conditions.push(query.is_used);
    }

    const joinTable = `${tableRenewalCode} rn LEFT JOIN ${tableRenewalCodeDevice} rnd ON rn.id = rnd.renewal_code_id 
      INNER JOIN ${tableTypeCode} tc ON rn.type = tc.id
      LEFT JOIN ${tableKeyTime} kt ON rnd.key_time_id = kt.id
      LEFT JOIN ${tableUsersCustomers} uc ON rnd.user_id = uc.user_id 
      LEFT JOIN ${tableUsers} u ON uc.user_id = u.id AND u.is_deleted = 0
      LEFT JOIN ${tableDevice} d ON rnd.device_id = d.id AND d.is_deleted = 0
      LEFT JOIN ${tableDeviceVehicle} dv ON rnd.device_id = dv.device_id AND dv.is_deleted = 0
      LEFT JOIN ${tableServicePackage} sp ON dv.service_package_id = sp.id
      LEFT JOIN ${tableVehicle} v ON rnd.vehicle_id = v.id AND v.is_deleted = 0`;

    const select =
      "rn.id,rn.code,tc.name as type_name,rn.is_used,rn.created_at,u.username,d.imei,d.id as device_id,v.id as vehicle_id,v.name as vehicle_name, sp.name as service_package_name, rnd.created_at as date_of_use,IF(kt.value > 1, sp.fees_to_agency, sp.	one_month_fee_to_agency) AS price";
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        "rn.id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  //Register
  async register(conn, body = {}) {
    const { type, quantity } = body;
    const createdAt = Date.now();
    const dataInsert = [];

    for (let i = 0; i < quantity; i++) {
      dataInsert.push([generateRandomNumber(Number(type)), type, 0, createdAt]);
    }

    const res_ = await this.insertMulti(
      conn,
      tableRenewalCode,
      "code,type,is_used,created_at",
      dataInsert
    );

    return res_;
  }
}

module.exports = new RenewalCodeModel();
