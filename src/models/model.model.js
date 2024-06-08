const DatabaseModel = require("./database.model");
const ModelSchema = require("./schema/model.schema");
const tableName = "tbl_model";
const tableDisk = "tbl_disk";
const tableConnectType = "tbl_connection_type";
const tableModelConnectType = "tbl_model_connection_type";

class ModelModel extends DatabaseModel {
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
      where += ` AND (${tableName}.name LIKE ? OR ${tableName}.made_in LIKE ?)`;
      conditions.push(`%${query.keyword}%`, `%${query.keyword}%`);
    }

    if (query.publish) {
      where += ` AND ${tableName}.publish = ?`;
      conditions.push(query.publish);
    }

    if (query.disk_id) {
      where += ` AND ${tableName}.disk_id = ?`;
      conditions.push(query.disk_id);
    }

    if (query.type) {
      where += ` AND ${tableName}.type = ?`;
      conditions.push(query.type);
    }

    if (query.connection_type_id) {
      where += ` AND ${tableConnectType}.id = ?`;
      conditions.push(query.connection_type_id);
    }

    const joinTable = `${tableName} INNER JOIN ${tableDisk} ON ${tableName}.disk_id = ${tableDisk}.id INNER JOIN ${tableModelConnectType} ON ${tableName}.id = ${tableModelConnectType}.model_id INNER JOIN ${tableConnectType} ON ${tableModelConnectType}.connection_type_id = ${tableConnectType}.id`;

    const select = `${tableName}.id,${tableName}.name,${tableName}.note,${tableName}.made_in,${tableDisk}.name as disk_name,${tableName}.quantity_channel,${tableName}.note,${tableName}.publish,${tableName}.is_gps,GROUP_CONCAT(${tableConnectType}.name) as connection_type_name`;
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        `${where} GROUP BY ${tableName}.id`,
        conditions,
        "id",
        "DESC",
        offset,
        limit
      ),
      this.count(
        conn,
        joinTable,
        "*",
        `${where} GROUP BY ${tableName}.id`,
        conditions
      ),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `${tableName}.is_deleted = ? AND ${tableName}.id = ?`;
    const conditions = [isDeleted, id];
    const joinTable = `${tableName} INNER JOIN ${tableModelConnectType} ON ${tableName}.id = ${tableModelConnectType}.model_id`;
    const selectData = `${tableName}.id,${tableName}.name,${tableName}.made_in,${tableName}.type,GROUP_CONCAT(${tableModelConnectType}.connection_type_id) as connection_type_id,${tableName}.disk_id,${tableName}.quantity_channel,${tableName}.note,${tableName}.publish,${tableName}.is_gps`;

    const res_ = await this.select(
      conn,
      joinTable,
      selectData,
      `${where} GROUP BY ${tableName}.id`,
      conditions,
      `${tableName}.id`
    );
    return res_;
  }

  //Register
  async register(conn, connPromise, body) {
    const {
      name,
      made_in,
      type,
      disk_id,
      connection_type_id,
      quantity_channel,
      note,
      publish,
      is_gps,
    } = body;

    const createdAt = Date.now();
    const model = new ModelSchema({
      name,
      made_in,
      type,
      disk_id: type === 2 ? disk_id : null,
      quantity_channel: type === 2 ? quantity_channel : null,
      note,
      publish,
      is_gps,
      is_deleted: 0,
      created_at: createdAt,
    });
    delete model.updated_at;

    await connPromise.beginTransaction();
    const res_ = await this.insert(conn, tableName, model);

    const connectionTypeIdParse = JSON.parse(connection_type_id);

    const dataInsertModelConnectType = connectionTypeIdParse?.map((item) => [
      res_,
      item,
      createdAt,
    ]);

    await this.insertMulti(
      conn,
      tableModelConnectType,
      "model_id,connection_type_id,created_at",
      dataInsertModelConnectType
    );
    await connPromise.commit();
    model.id = res_;
    model.connection_type_id = connection_type_id;
    delete model.is_deleted;
    return model;
  }

  //update
  async updateById(conn, connPromise, body, params) {
    const {
      name,
      made_in,
      type,
      disk_id,
      connection_type_id,
      quantity_channel,
      note,
      publish,
      is_gps,
    } = body;
    const { id } = params;

    const updatedAt = Date.now();

    const model = new ModelSchema({
      name,
      made_in,
      type,
      disk_id,
      quantity_channel,
      note,
      publish,
      is_gps,
      updated_at: updatedAt,
    });
    // console.log(id)
    delete model.created_at;
    delete model.is_deleted;

    await connPromise.beginTransaction();

    await this.update(conn, tableName, model, "id", id);
    const connectionTypeIdParse = JSON.parse(connection_type_id);
    await this.delete(
      conn,
      tableModelConnectType,
      `model_id = ? AND connection_type_id NOT IN (?)`,
      [id, connectionTypeIdParse],
      "ID",
      false
    );

    const dataInsertModelConnectType = connectionTypeIdParse?.map((item) => [
      id,
      item,
      updatedAt,
    ]);

    await this.insertIgnore(
      conn,
      tableModelConnectType,
      "model_id,connection_type_id,created_at",
      dataInsertModelConnectType
    );
    await connPromise.commit();

    model.id = id;
    model.connection_type_id = connection_type_id;
    return model;
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

module.exports = new ModelModel();
