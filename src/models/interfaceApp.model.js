const DatabaseModel = require("./database.model");
const { tableInterface } = require("../constants/tableName.constant");
const InterfaceSchema = require("./schema/interface.schema");
const { NOT_EXITS } = require("../constants/msg.constant");
const { REDIS_KEY_LIST_INTERFACE } = require("../constants/redis.constant");
const cacheModel = require("./cache.model");

class InterfaceModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const { is_deleted, keyword, publish } = query;
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = is_deleted || 0;
    let where = `is_deleted = ?`;
    const conditions = [isDeleted];

    if (keyword) {
      where += ` AND ( name LIKE ? OR keyword LIKE ?)`;
      conditions.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (publish) {
      where += ` AND publish = ?`;
      conditions.push(publish);
    }

    const select = "id,name,keyword,publish,content,created_at,updated_at";
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableInterface,
        select,
        where,
        conditions,
        "id",
        "ASC",
        offset,
        limit
      ),
      this.count(conn, tableInterface, "*", where, conditions),
    ]);

    if (keyword) {
      await cacheModel.hsetRedis(REDIS_KEY_LIST_INTERFACE, keyword, res_);
    }

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `id,keyword,name,content,publish`;

    const res_ = await this.select(
      conn,
      tableInterface,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const { keyword, name, content, publish } = body;
    const ui = new InterfaceSchema({
      keyword,
      name,
      content: JSON.stringify(content),
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete ui.updated_at;

    const res_ = await this.insert(conn, tableInterface, ui);
    ui.id = res_;
    delete ui.is_deleted;
    return ui;
  }

  async uploadImage(conn, body, img) {
    const { id } = body;

    const dataOld = await this.select(
      conn,
      tableInterface,
      "content",
      "id = ?",
      [id]
    );

    if (!dataOld?.length) throw { msg: `ID ${NOT_EXITS}` };

    const contentOld = JSON.parse(dataOld[0]?.content);

    const content = { ...contentOld, ...img };

    await this.update(
      conn,
      tableInterface,
      { content: JSON.stringify(content) },
      "id",
      id
    );
    return content;
  }

  //update
  async updateById(conn, body, params) {
    const { keyword, name, content, publish } = body;
    const { id } = params;

    const ui = new InterfaceSchema({
      keyword,
      name,
      content,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete ui.created_at;
    delete ui.is_deleted;

    await this.update(conn, tableInterface, ui, "id", id);
    ui.id = id;
    return ui;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableInterface, { is_deleted: 1 }, "id", id);
    return [];
  }

  //deleteImage
  async deleteImage(conn, body) {
    const { id, property } = body;

    const dataOld = await this.select(
      conn,
      tableInterface,
      "content",
      "id = ?",
      id
    );
    if (!dataOld?.length) throw { msg: `ID ${NOT_EXITS}` };

    const contentOld = JSON.parse(dataOld[0]?.content);

    delete contentOld[property];

    await this.update(
      conn,
      tableInterface,
      { content: JSON.stringify(contentOld) },
      "id",
      id
    );
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tableInterface, { publish }, "id", id);
    await permissionModel.init(conn);
    return [];
  }
}

module.exports = new InterfaceModel();
