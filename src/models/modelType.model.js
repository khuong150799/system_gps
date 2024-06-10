const { tableModelType } = require("../constants/tableName.contant");
const DatabaseModel = require("./database.model");
const ModelTypeSchema = require("./schema/modelType.schema");

class ModelTypeModel extends DatabaseModel {
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

    const select = "id,name,publish,created_at,updated_at";
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableModelType,
        select,
        where,
        conditions,
        "id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, tableModelType, "*", where, conditions),
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
    const selectData = `id,name,des,publish`;

    const res_ = await this.select(
      conn,
      tableModelType,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const { name, des, publish } = body;
    const modelType = new ModelTypeSchema({
      name,
      des: des || null,
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete modelType.updated_at;

    const res_ = await this.insert(conn, tableModelType, modelType);
    modelType.id = res_;
    delete modelType.is_deleted;
    return modelType;
  }

  //update
  async updateById(conn, body, params) {
    const { name, des, publish } = body;
    const { id } = params;

    const modelType = new ModelTypeSchema({
      name,
      des: des || null,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete modelType.created_at;
    delete modelType.sort;
    delete modelType.is_deleted;

    await this.update(conn, tableModelType, modelType, "id", id);
    modelType.id = id;
    return modelType;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableModelType, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;
    await this.update(conn, tableModelType, { publish }, "id", id);
    return [];
  }
}

module.exports = new ModelTypeModel();
