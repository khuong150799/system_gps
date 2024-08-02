const DatabaseModel = require("./database.model");

const { tableSettingCate } = require("../constants/tableName.constant");
const SettingCateSchema = require("./schema/settingCate.schema");

class SettingCateModel extends DatabaseModel {
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
      where += ` AND title LIKE ?`;
      conditions.push(`%${query.keyword}%`);
    }

    if (query.publish) {
      where += ` AND publish = ?`;
      conditions.push(query.publish);
    }

    const select = "id,title,sort,publish,created_at,updated_at";
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableSettingCate,
        select,
        where,
        conditions,
        "id",
        "ASC",
        offset,
        limit
      ),
      this.count(conn, tableSettingCate, "*", where, conditions),
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
    const selectData = `id,title,sort,publish`;

    const res_ = await this.select(
      conn,
      tableSettingCate,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const { title, sort, publish } = body;
    const settingCate = new SettingCateSchema({
      title,
      sort,
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete settingCate.updated_at;

    const res_ = await this.insert(conn, tableSettingCate, settingCate);
    settingCate.id = res_;
    delete settingCate.is_deleted;
    return settingCate;
  }

  //update
  async updateById(conn, body, params) {
    const { title, sort, publish } = body;
    const { id } = params;

    const settingCate = new SettingCateSchema({
      title,
      sort,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete settingCate.created_at;
    delete settingCate.is_deleted;

    await this.update(conn, tableSettingCate, settingCate, "id", id);
    settingCate.id = id;
    return settingCate;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableSettingCate, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tableSettingCate, { publish }, "id", id);
    return [];
  }

  //sort
  async updateSort(conn, body, params) {
    const { id } = params;
    const { sort } = body;

    await this.update(conn, tableSettingCate, { sort }, "id", id);
    return [];
  }
}

module.exports = new SettingCateModel();
