const { connection_type_id } = require("../constants/property.constant");
const { tableConnectionType } = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const ConnectionTypeSchema = require("./schema/connectionType.schema");
const WriteLogsSchema = require("./schema/writeLogs.schema");
const writeLogModel = require("./writeLog.model");

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
        tableConnectionType,
        select,
        where,
        conditions,
        "id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, tableConnectionType, "*", where, conditions),
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
      tableConnectionType,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, connPromise, body, infoUser) {
    const { name, note, publish } = body;
    const createdAt = Date.now();
    const connectionType = new ConnectionTypeSchema({
      name,
      note: note || null,
      publish,
      is_deleted: 0,
      created_at: createdAt,
    });
    delete connectionType.updated_at;
    await connPromise.beginTransaction();
    const res_ = await this.insert(conn, tableConnectionType, connectionType);

    await writeLogModel.post(conn, {
      ...infoUser,
      name,
      module: connection_type_id,
      createdAt,
    });

    await connPromise.commit();
    connectionType.id = res_;
    delete connectionType.is_deleted;
    return connectionType;
  }

  //update
  async updateById(conn, connPromise, body, params, infoUser) {
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

    await connPromise.beginTransaction();
    const dataOld = await this.select(
      conn,
      tableConnectionType,
      "name,note,publish",
      "id = ?",
      id
    );

    await this.update(conn, tableConnectionType, connectionType, "id", id);

    await writeLogModel.update(conn, {
      dataOld: dataOld[0],
      dataNew: { ...connectionType },
      module: connection_type_id,
      ...infoUser,
    });

    connectionType.id = id;
    await connPromise.commit();
    return connectionType;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableConnectionType, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;
    await this.update(conn, tableConnectionType, { publish }, "id", id);
    return [];
  }
}

module.exports = new ConnectionTypeModel();
