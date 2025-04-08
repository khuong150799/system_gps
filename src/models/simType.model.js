const { tableSimType } = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const SimTypeSchema = require("./schema/simType.schema");

class SimTypeModel extends DatabaseModel {
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

    const select = "id,name,des,created_at,updated_at";

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableSimType,
        select,
        where,
        conditions,
        "id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, tableSimType, "*", where, conditions),
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
    const selectData = `id,name,des`;

    const res_ = await this.select(
      conn,
      tableSimType,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const { name, des } = body;
    const simType = new SimTypeSchema({
      name,
      des,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete simType.updated_at;

    const res_ = await this.insert(conn, tableSimType, simType);
    simType.id = res_;
    delete simType.is_deleted;
    return simType;
  }

  //update
  async updateById(conn, body, params) {
    const { name, des } = body;
    const { id } = params;

    const simType = new SimTypeSchema({
      name,
      des,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete simType.created_at;
    delete simType.is_deleted;

    await this.update(conn, tableSimType, simType, "id", id);
    simType.id = id;
    return simType;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableSimType, { is_deleted: 1 }, "id", id);
    return [];
  }
}

module.exports = new SimTypeModel();
