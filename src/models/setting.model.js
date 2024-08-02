const DatabaseModel = require("./database.model");

const {
  tableSetting,
  tableUsersSetting,
  tableSettingCate,
} = require("../constants/tableName.constant");
const SettingSchema = require("./schema/setting.schema");

class SettingModel extends DatabaseModel {
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

    const select =
      "id,title, sort, on_default, is_disabled, publish,created_at,updated_at";
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableSetting,
        select,
        where,
        conditions,
        "sort",
        "ASC",
        offset,
        limit
      ),
      this.count(conn, tableSetting, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  //getlist
  async getList(conn, userId) {
    let where = `sc.is_deleted = ? AND sc.publish = ? AND s.is_deleted = ? AND s.publish = ?`;

    const joinTable = `${tableSettingCate} sc INNER JOIN ${tableSetting} s ON sc.id = s.setting_cate_id 
      LEFT JOIN ${tableUsersSetting} us ON s.id = us.setting_id AND us.user_id = ?`;

    const conditions = [0, 0, 0, 0, userId];
    const select =
      "sc.title,JSON_ARRAYAGG(JSON_OBJECT('id', s.id,'title', s.title,'is_disabled',us.is_disabled)) AS setting";
    const data = await this.select(
      conn,
      joinTable,
      select,
      where,
      conditions,
      "sc.sort,s.sort",
      "ASC",
      0,
      9999999
    );

    return data;
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `id,title, sort, on_default, is_disabled, publish`;

    const res_ = await this.select(
      conn,
      tableSetting,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const {
      title,
      keyword,
      setting_cate_id,
      sort,
      on_default,
      is_disabled,
      publish,
    } = body;
    const setting = new SettingSchema({
      title,
      keyword,
      setting_cate_id,
      on_default: on_default || 0,
      is_disabled: is_disabled || 0,
      publish,
      sort: sort || 0,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete setting.updated_at;

    const res_ = await this.insert(conn, tableSetting, setting);
    setting.id = res_;
    delete setting.is_deleted;
    return setting;
  }

  //Register
  async registerUser(conn, body, userId) {
    const { setting_id, id_disabled } = body;
    const usersSetting = [[userId, id, id_disabled, Date.now()]];
    await this.insertDuplicate(
      conn,
      tableUsersSetting,
      "user_id,setting_id,is_disabled,created_at",
      usersSetting,
      `is_disabled=VALUES(is_disabled),updated_at=VALUES(created_at)`
    );
    return [];
  }

  //update
  async updateById(conn, body, params) {
    const {
      title,
      keyword,
      setting_cate_id,
      sort,
      on_default,
      is_disabled,
      publish,
    } = body;
    const { id } = params;

    const setting = new SettingSchema({
      title,
      keyword,
      setting_cate_id,
      on_default,
      is_disabled,
      publish,
      sort: sort || 0,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete setting.created_at;
    delete setting.is_deleted;

    await this.update(conn, tableSetting, setting, "id", id);
    setting.id = id;
    return setting;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableSetting, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tableSetting, { publish }, "id", id);
    return [];
  }

  //sort
  async updateSort(conn, body, params) {
    const { id } = params;
    const { sort } = body;

    await this.update(conn, tableSetting, { sort }, "id", id);
    return [];
  }
}

module.exports = new SettingModel();
