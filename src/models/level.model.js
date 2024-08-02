const DatabaseModel = require("./database.model");
const LevelSchema = require("./schema/level.schema");
const permissionModel = require("./permission.model");
const {
  tableLevel,
  tableLevelPermission,
  tablePermission,
  tableLevelModule,
  tableModule,
} = require("../constants/tableName.constant");

class LevelModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query, level) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    let where = `sort <= ? AND is_deleted = ?`;
    const conditions = [level, isDeleted];

    if (query.keyword) {
      where += ` AND name LIKE ?`;
      conditions.push(`%${query.keyword}%`);
    }

    if (query.publish) {
      where += ` AND publish = ?`;
      conditions.push(query.publish);
    }

    const select = "id,name,des,publish,sort,created_at,updated_at";

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableLevel,
        select,
        where,
        conditions,
        "sort",
        "ASC",
        offset,
        limit
      ),
      this.count(conn, tableLevel, "*", where, conditions),
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
    const selectData = `id,name,des,publish`;

    const res_ = await this.select(
      conn,
      tableLevel,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //getPermission
  async getPermission(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];

    const levelInfo = await this.select(
      conn,
      tableLevel,
      "sort",
      where,
      conditions
    );
    if (!levelInfo || levelInfo?.length <= 0) return [];

    const level = levelInfo[0]?.sort || 0;

    const select = `${tablePermission}.id`;
    const joinTable = `${tableLevel} INNER JOIN ${tableLevelPermission} ON ${tableLevel}.id = ${tableLevelPermission}.level_id 
      INNER JOIN ${tablePermission} ON ${tableLevelPermission}.permission_id = ${tablePermission}.id`;

    const res_ = await this.select(
      conn,
      joinTable,
      select,
      `${tableLevel}.sort <= ? AND ${tablePermission}.is_deleted = ? AND ${tablePermission}.publish = ? AND ${tableLevelPermission}.is_deleted = ?`,
      [level, isDeleted, 1, isDeleted],
      `${tablePermission}.id`,
      "DESC",
      0,
      10000
    );

    return res_;
  }

  //getPermission
  async getModule(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];

    const levelInfo = await this.select(
      conn,
      tableLevel,
      "sort",
      where,
      conditions
    );
    if (!levelInfo || levelInfo?.length <= 0) return [];

    const level = levelInfo[0]?.sort || 0;

    const select = `${tableModule}.id`;
    const joinTable = `${tableLevel} INNER JOIN ${tableLevelModule} ON ${tableLevel}.id = ${tableLevelModule}.level_id 
      INNER JOIN ${tableModule} ON ${tableLevelModule}.module_id = ${tableModule}.id`;

    const res_ = await this.select(
      conn,
      joinTable,
      select,
      `${tableLevel}.sort <= ? AND ${tableModule}.is_deleted = ? AND ${tableModule}.publish = ? AND ${tableLevelModule}.is_deleted = ?`,
      [level, isDeleted, 1, isDeleted],
      `${tableModule}.id`,
      "DESC",
      0,
      10000
    );

    return res_;
  }

  //Register
  async register(conn, body) {
    const { name, des, publish } = body;
    const level = new LevelSchema({
      name,
      des: des || null,
      publish,
      sort: 0,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete level.updated_at;

    const res_ = await this.insert(conn, tableLevel, level);
    level.id = res_;
    delete level.is_deleted;
    return level;
  }

  async registerPermission(conn, body) {
    const { id, permissions } = body;

    const listPermissionId = JSON.parse(permissions);
    if (listPermissionId?.length <= 0) return [];
    const dataInsert = listPermissionId.map((item) => [
      id,
      item,
      0,
      Date.now(),
    ]);

    await this.insertDuplicate(
      conn,
      tableLevelPermission,
      "level_id,permission_id,is_deleted,created_at",
      dataInsert,
      "level_id=VALUES(level_id),is_deleted=VALUES(is_deleted),created_at=VALUES(created_at)"
    );
    await permissionModel.init(conn);

    return [];
  }

  async registerModule(conn, body) {
    const { id, modules } = body;

    const listModuleId = JSON.parse(modules);
    if (listModuleId?.length <= 0) return [];
    const dataInsert = listModuleId.map((item) => [id, item, 0, Date.now()]);

    await this.insertDuplicate(
      conn,
      tableLevelModule,
      "level_id,module_id,is_deleted,created_at",
      dataInsert,
      "level_id=VALUES(level_id),is_deleted=VALUES(is_deleted),created_at=VALUES(created_at)"
    );

    return [];
  }

  //update
  async updateById(conn, body, params) {
    const { name, des, publish } = body;
    const { id } = params;

    const level = new LevelSchema({
      name,
      des: des || null,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete level.created_at;
    delete level.sort;
    delete level.is_deleted;

    await this.update(conn, tableLevel, level, "id", id);
    await permissionModel.init(conn);
    level.id = id;
    return level;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableLevel, { is_deleted: 1 }, "id", id);
    await permissionModel.init(conn);
    return [];
  }

  async deleteModule(conn, body, params) {
    const { modules } = body;
    const listModuleId = JSON.parse(modules);
    const { id } = params;

    const levelParent = await this.select(
      conn,
      tableLevel,
      "id",
      `sort > (SELECT sort FROM ${tableLevel} WHERE id = ?)`,
      id,
      "id",
      "ASC",
      0,
      1
    );
    if (levelParent?.length) {
      await this.update(
        conn,
        tableLevelModule,
        { level_id: levelParent[0].id },
        "module_id",
        listModuleId
      );
    } else {
      await this.update(
        conn,
        tableLevelModule,
        { is_deleted: 1 },
        "module_id",
        listModuleId
      );
    }

    return [];
  }

  async deletePermission(conn, body, params) {
    const { permissions } = body;
    const { id } = params;
    const listPermissionId = JSON.parse(permissions);
    const levelParent = await this.select(
      conn,
      tableLevel,
      "id",
      `sort > (SELECT sort FROM ${tableLevel} WHERE id = ?)`,
      id,
      "id",
      "ASC",
      0,
      1
    );

    if (levelParent?.length > 0) {
      await this.update(
        conn,
        tableLevelPermission,
        { level_id: levelParent[0].id },
        "permission_id",
        listPermissionId
      );
    } else {
      await this.update(
        conn,
        tableLevelPermission,
        { is_deleted: 1 },
        "permission_id",
        listPermissionId
      );
    }

    await permissionModel.init(conn);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tableLevel, { publish }, "id", id);
    await permissionModel.init(conn);
    return [];
  }

  //sort
  async updateSort(conn, body, params) {
    const { id } = params;
    const { sort } = body;

    await this.update(conn, tableLevel, { sort }, "id", id);
    await permissionModel.init(conn);
    return [];
  }
}

module.exports = new LevelModel();
