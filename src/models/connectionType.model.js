const DatabaseModel = require("./database.model");
const ConnectionTypeSchema = require("./schema/connectionType.schema");

const tableName = "tbl_connection_type";

class ConnectionTypeModel extends DatabaseModel {
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
        tableName,
        select,
        where,
        conditions,
        "id",
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
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `id,name,note,publish`;

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
    const { name, note, publish } = body;
    const connectionType = new ConnectionTypeSchema({
      name,
      note: note || null,
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete connectionType.updated_at;
    const res_ = await this.insert(conn, tableName, connectionType);
    connectionType.id = res_;
    delete connectionType.is_deleted;
    return connectionType;
  }

  //update
  async updateById(conn, body, params) {
    const { name, note, publish } = body;
    const { id } = params;

    const connectionType = new ConnectionTypeSchema({
      name,
      note: note || null,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete connectionType.created_at;
    delete connectionType.sort;
    delete connectionType.is_deleted;

    await this.update(conn, tableName, connectionType, "id", id);
    connectionType.id = id;
    return connectionType;
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

module.exports = new ConnectionTypeModel();
