const { tableDisk } = require("../constants/tableName.contant");
const DatabaseModel = require("./database.model");
const DiskSchema = require("./schema/disk.schema");

class DiskModel extends DatabaseModel {
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
        tableDisk,
        select,
        where,
        conditions,
        "id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, tableDisk, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecaord: count?.[0]?.total };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `id,name,publish`;

    const res_ = await this.select(
      conn,
      tableDisk,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const { name, publish } = body;
    const disk = new DiskSchema({
      name,
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete disk.updated_at;

    const res_ = await this.insert(conn, tableDisk, disk);
    disk.id = res_;
    delete disk.is_deleted;
    return disk;
  }

  //update
  async updateById(conn, body, params) {
    const { name, publish } = body;
    const { id } = params;

    const disk = new DiskSchema({
      name,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete disk.created_at;
    delete disk.sort;
    delete disk.is_deleted;

    await this.update(conn, tableDisk, disk, "id", id);
    disk.id = id;
    return disk;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableDisk, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;
    await this.update(conn, tableDisk, { publish }, "id", id);
    return [];
  }
}

module.exports = new DiskModel();
