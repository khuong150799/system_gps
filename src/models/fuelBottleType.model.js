const DatabaseModel = require("./database.model");

const { tableFuelBottleType } = require("../constants/tableName.constant");
const FuelBottleTypeSchema = require("./schema/fuelBottleType.schema");

class FuelBottleType extends DatabaseModel {
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

    const select = "id,name,des,publish,created_at,updated_at";
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableFuelBottleType,
        select,
        where,
        conditions,
        "sort",
        "ASC",
        offset,
        limit
      ),
      this.count(conn, tableFuelBottleType, "*", where, conditions),
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
    const select = `id,name,des,publish`;

    const res_ = await this.select(
      conn,
      tableFuelBottleType,
      select,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const { name, des, publish } = body;
    const fuelBottleType = new FuelBottleTypeSchema({
      name,
      des: des || null,
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete fuelBottleType.updated_at;

    const res_ = await this.insert(conn, tableFuelBottleType, fuelBottleType);
    fuelBottleType.id = res_;
    delete fuelBottleType.is_deleted;
    return fuelBottleType;
  }

  //update
  async updateById(conn, body, params) {
    const { name, des, publish } = body;
    const { id } = params;

    const fuelBottleType = new FuelBottleTypeSchema({
      name,
      des: des || null,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete fuelBottleType.created_at;
    delete fuelBottleType.is_deleted;

    await this.update(conn, tableFuelBottleType, fuelBottleType, "id", id);
    fuelBottleType.id = id;
    return fuelBottleType;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableFuelBottleType, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tableFuelBottleType, { publish }, "id", id);
    return [];
  }
}

module.exports = new FuelBottleType();
