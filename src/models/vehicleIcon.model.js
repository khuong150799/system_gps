const { tableVehicleIcon } = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const deviceModel = require("./device.model");
const VehicleIconSchema = require("./schema/vehicleIcon.schema");

class VehicleIconModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    let where = `is_deleted = ?`;
    const conditions = [isDeleted];

    if (query.keyword) {
      where += ` AND name LIKE ?`;
      conditions.push(`%${query.keyword}%`);
    }

    if (query.publish) {
      where += ` AND publish = ?`;
      conditions.push(query.publish);
    }

    const select = "id,name,note,publish,created_at,updated_at";

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableVehicleIcon,
        select,
        where,
        conditions,
        "id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, tableVehicleIcon, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `id,name,note,publish`;

    const res_ = await this.select(
      conn,
      tableVehicleIcon,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const { name, note, publish } = body;
    const verhicleIcon = new VehicleIconSchema({
      name,
      note: note || null,
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete verhicleIcon.updated_at;

    const res_ = await this.insert(conn, tableVehicleIcon, verhicleIcon);
    verhicleIcon.id = res_;
    delete verhicleIcon.is_deleted;
    return verhicleIcon;
  }

  //update
  async updateById(conn, body, params) {
    const { name, note, publish } = body;
    const { id } = params;

    const vehicleIcon = new VehicleIconSchema({
      name,
      note: note || null,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete vehicleIcon.created_at;
    delete vehicleIcon.is_deleted;

    await this.update(conn, tableVehicleIcon, vehicleIcon, "id", id);
    await deviceModel.getWithImei(conn);
    vehicleIcon.id = id;
    return vehicleIcon;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableVehicleIcon, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tableVehicleIcon, { publish }, "id", id);
    return [];
  }
}

module.exports = new VehicleIconModel();
