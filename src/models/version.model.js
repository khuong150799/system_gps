const { tableVersion } = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const VerSionSchema = require("./schema/version.schema");

class VersionModel extends DatabaseModel {
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
      where += ` AND (name LIKE ? OR keyword LIKE ?)`;
      conditions.push(`%${query.keyword}%`, `%${query.keyword}%`);
    }

    if (query.publish) {
      where += ` AND publish = ?`;
      conditions.push(query.publish);
    }

    const select = "id,keyword,name,ios,android,publish,created_at,updated_at";
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableVersion,
        select,
        where,
        conditions,
        "id",
        "ASC",
        offset,
        limit
      ),
      this.count(conn, tableVersion, "*", where, conditions),
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
    const selectData = `id,keyword,name,ios,android,publish`;

    const res_ = await this.select(
      conn,
      tableVersion,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const {
      keyword,
      name,
      ios_version,
      ios_link,
      ios_is_forced,
      ios_message,
      android_version,
      android_link,
      android_is_forced,
      android_message,
      publish,
    } = body;
    const version = new VerSionSchema({
      keyword,
      name,
      ios: JSON.stringify({
        version: ios_version,
        link: ios_link,
        is_forced: ios_is_forced,
        message: ios_message,
      }),
      android: JSON.stringify({
        version: android_version,
        link: android_link,
        is_forced: android_is_forced,
        message: android_message,
      }),
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete version.updated_at;

    const res_ = await this.insert(conn, tableVersion, version);
    version.id = res_;
    delete version.is_deleted;
    return version;
  }

  //update
  async updateById(conn, body, params) {
    const {
      keyword,
      name,
      ios_version,
      ios_link,
      ios_is_forced,
      ios_message,
      android_version,
      android_link,
      android_is_forced,
      android_message,
      publish,
    } = body;
    const { id } = params;

    const version = new VerSionSchema({
      keyword,
      name,
      ios: JSON.stringify({
        version: ios_version,
        link: ios_link,
        is_forced: ios_is_forced,
        message: ios_message,
      }),
      android: JSON.stringify({
        version: android_version,
        link: android_link,
        is_forced: android_is_forced,
        message: android_message,
      }),
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete version.created_at;
    delete version.is_deleted;

    await this.update(conn, tableVersion, version, "id", id);
    version.id = id;
    return version;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableVersion, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tableVersion, { publish }, "id", id);
    return [];
  }
}

module.exports = new VersionModel();
