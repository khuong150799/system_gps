const {
  tableModel,
  tableDisk,
  tableModelConnectionType,
  tableConnectionType,
  tableModelType,
} = require("../constants/tableName.contant");
const DatabaseModel = require("./database.model");
const deviceModel = require("./device.model");
const ModelSchema = require("./schema/model.schema");

class ModelModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    let where = `${tableModel}.is_deleted = ?`;
    const conditions = [isDeleted];

    if (query.keyword) {
      where += ` AND (${tableModel}.name LIKE ? OR ${tableModel}.made_in LIKE ?)`;
      conditions.push(`%${query.keyword}%`, `%${query.keyword}%`);
    }

    if (query.publish) {
      where += ` AND ${tableModel}.publish = ?`;
      conditions.push(query.publish);
    }

    if (query.disk_id) {
      where += ` AND ${tableModel}.disk_id = ?`;
      conditions.push(query.disk_id);
    }

    if (query.type) {
      where += ` AND ${tableModel}.type = ?`;
      conditions.push(query.type);
    }

    if (query.connection_type_id) {
      where += ` AND ${tableConnectionType}.id = ?`;
      conditions.push(query.connection_type_id);
    }

    const joinTable = `${tableModel} LEFT JOIN ${tableDisk} ON ${tableModel}.disk_id = ${tableDisk}.id 
    INNER JOIN ${tableModelConnectionType} ON ${tableModel}.id = ${tableModelConnectionType}.model_id 
    INNER JOIN ${tableConnectionType} ON ${tableModelConnectionType}.connection_type_id = ${tableConnectionType}.id 
    INNER JOIN ${tableModelType} ON ${tableModel}.model_type_id = ${tableModelType}.id`;

    const select = `${tableModel}.id,${tableModel}.name,${tableModel}.note,${tableModel}.made_in,${tableDisk}.name as disk_name,${tableModel}.quantity_channel,${tableModel}.note,${tableModel}.publish,${tableModel}.is_gps,GROUP_CONCAT(${tableConnectionType}.name) as connection_type_name,${tableModelType}.name as model_type_name`;
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        `${where} GROUP BY ${tableModel}.id`,
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
        `${where} GROUP BY ${tableModel}.id`,
        conditions
      ),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecaord: count?.[0]?.total };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `${tableModel}.is_deleted = ? AND ${tableModel}.id = ?`;
    const conditions = [isDeleted, id];
    const joinTable = `${tableModel} INNER JOIN ${tableModelConnectionType} ON ${tableModel}.id = ${tableModelConnectionType}.model_id`;
    const selectData = `${tableModel}.id,${tableModel}.name,${tableModel}.made_in,${tableModel}.model_type_id,GROUP_CONCAT(${tableModelConnectionType}.connection_type_id) as connection_type_id,${tableModel}.disk_id,${tableModel}.quantity_channel,${tableModel}.note,${tableModel}.publish,${tableModel}.is_gps`;

    const res_ = await this.select(
      conn,
      joinTable,
      selectData,
      `${where} GROUP BY ${tableModel}.id`,
      conditions,
      `${tableModel}.id`
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
      model_type_id: type,
      disk_id: Number(type) === 2 ? disk_id : null,
      quantity_channel: Number(type) === 2 ? quantity_channel : null,
      note,
      publish,
      is_gps,
      is_deleted: 0,
      created_at: createdAt,
    });
    delete model.updated_at;

    await connPromise.beginTransaction();
    const res_ = await this.insert(conn, tableModel, model);

    const connectionTypeIdParse = JSON.parse(connection_type_id);

    const dataInsertModelConnectType = connectionTypeIdParse?.map((item) => [
      res_,
      item,
      createdAt,
    ]);

    await this.insertMulti(
      conn,
      tableModelConnectionType,
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
      quantity_channel,
      connection_type_id,
      note,
      publish,
      is_gps,
    } = body;
    const { id } = params;

    const updatedAt = Date.now();

    const model = new ModelSchema({
      name,
      made_in,
      model_type_id: type,
      disk_id: Number(type) === 2 ? disk_id : null,
      quantity_channel: Number(type) === 2 ? quantity_channel : null,
      note,
      publish,
      is_gps,
      updated_at: updatedAt,
    });
    // console.log(id)
    delete model.created_at;
    delete model.is_deleted;

    await connPromise.beginTransaction();

    await this.update(conn, tableModel, model, "id", id);
    const connectionTypeIdParse = JSON.parse(connection_type_id);
    await this.delete(
      conn,
      tableModelConnectionType,
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
      tableModelConnectionType,
      "model_id,connection_type_id,created_at",
      dataInsertModelConnectType
    );
    await connPromise.commit();
    await deviceModel.getWithImei(conn);

    model.id = id;
    model.connection_type_id = connection_type_id;
    return model;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableModel, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tableModel, { publish }, "id", id);
    return [];
  }
}

module.exports = new ModelModel();
