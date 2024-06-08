const DatabaseModel = require("./database.model");
const VehicleTypeSchema = require("./schema/vehicleType.schema");

const tableVehicleIcon = "tbl_vehicle_icon";
const tableName = "tbl_vehicle_type";

class VehicleTypeModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    let where = `${tableName}.is_deleted = ?`;
    const conditions = [isDeleted];

    if (query.keyword) {
      where += ` AND ${tableName}.name LIKE ?`;
      conditions.push(`%${query.keyword}%`);
    }

    if (query.publish) {
      where += ` AND ${tableName}.publish = ?`;
      conditions.push(query.publish);
    }
    if (query.vehicle_icon_id) {
      where += ` AND ${tableName}.vehicle_icon_id = ?`;
      conditions.push(query.vehicle_icon_id);
    }
    const joinTable = `${tableName} INNER JOIN ${tableVehicleIcon} ON ${tableName}.vehicle_icon_id = ${tableVehicleIcon}.id`;

    const select = `${tableName}.id,${tableName}.name,${tableName}.max_speed,${tableName}.rule,${tableName}.publish,${tableName}.created_at,${tableName}.updated_at,${tableVehicleIcon}.name as vehicle_icon_name`;
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
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `id,name,vehicle_icon_id,max_speed,rule,publish`;

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
  async register(conn, body) {
    const { name, vehicle_icon_id, max_speed, rule, publish } = body;
    const verhicleType = new VehicleTypeSchema({
      name,
      vehicle_icon_id,
      max_speed,
      rule,
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete verhicleType.updated_at;

    const res_ = await this.insert(conn, tableName, verhicleType);
    verhicleType.id = res_;
    delete verhicleType.is_deleted;
    return verhicleType;
  }

  //update
  async updateById(conn, body, params) {
    const { name, vehicle_icon_id, max_speed, rule, publish } = body;
    const { id } = params;

    const vehicleType = new VehicleTypeSchema({
      name,
      vehicle_icon_id,
      max_speed,
      rule,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete vehicleType.created_at;
    delete vehicleType.is_deleted;

    await this.update(conn, tableName, vehicleType, "id", id);
    vehicleType.id = id;
    return vehicleType;
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

module.exports = new VehicleTypeModel();
