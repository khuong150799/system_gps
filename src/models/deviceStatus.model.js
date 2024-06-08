const DatabaseModel = require("./database.model");
const db = require("../dbs/init.mysql");
const DeviceStatusSchema = require("./schema/deviceStatus.schema");
const tableName = "tbl_device_status";

class DeviceStatusModel extends DatabaseModel {
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
      where += ` AND ${tableName}.title LIKE ?`;
      conditions.push(`%${query.keyword}%`);
    }

    if (query.publish) {
      where += ` AND ${tableName}.publish = ?`;
      conditions.push(query.publish);
    }

    const select = `${tableName}.id,${tableName}.title,${tableName}.des,${tableName}.publish,${tableName}.created_at,${tableName}.updated_at`;
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableName,
        select,
        where,
        conditions,
        `${tableName}.id`,
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
    const selectData = `id,title,des,publish`;

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
    const { title, des, publish } = body;
    const deviceStatus = new DeviceStatusSchema({
      title,
      des,
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete deviceStatus.updated_at;

    const res_ = await this.insert(conn, tableName, deviceStatus);
    deviceStatus.id = res_;
    delete deviceStatus.is_deleted;
    return deviceStatus;
  }

  //update
  async updateById(conn, body, params) {
    const { title, des, publish } = body;
    const { id } = params;

    const deviceStatus = new DeviceStatusSchema({
      title,
      des,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete deviceStatus.created_at;
    delete deviceStatus.is_deleted;

    await this.update(conn, tableName, deviceStatus, "id", id);
    deviceStatus.id = id;
    return deviceStatus;
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

module.exports = new DeviceStatusModel();
