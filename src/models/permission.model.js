const DatabaseModel = require("./database.model");
const PermissionSchema = require("./schema/permission.schema");
const {
  set: setRedis,
  setWithExpired: setRedisWithExpired,
  hSet,
} = require("./redis.model");
const {
  tablePermission,
  tableRole,
  tableRolePermission,
  tableLevel,
  tableLevelPermission,
} = require("../constants/tableName.constant");
const { REDIS_KEY_PERMISSION } = require("../constants/redis.constant");

class PermissionModel extends DatabaseModel {
  constructor() {
    super();
  }

  async init(conn) {
    const where = `p.publish = ? AND p.is_deleted = ? AND l.publish = ? AND l.is_deleted = ? AND r.publish = ? AND r.is_deleted = ? AND lp.is_deleted = ? AND rp.is_deleted = ?`;
    const conditions = [1, 0, 1, 0, 1, 0, 0, 0];
    const joinTable = `${tablePermission} p INNER JOIN ${tableLevelPermission} lp ON p.id = lp.permission_id 
    INNER JOIN ${tableLevel} l ON lp.level_id = l.id 
    INNER JOIN ${tableRolePermission} rp ON p.id = rp.permission_id 
    INNER JOIN ${tableRole} r ON rp.role_id = r.id`;

    const select = `p.id,p.method,p.router,l.sort as level, r.sort as role`;

    const res = await this.select(
      conn,
      joinTable,
      select,
      where,
      conditions,
      `p.id`,
      "DESC",
      0,
      100000
    );

    // console.log("res", res);

    if (!res.length) {
      await setRedisWithExpired(REDIS_KEY_PERMISSION, JSON.stringify([]));
      return [];
    }

    const formatData = {};
    const listPromise = [];

    for (let i = 0; i < res.length; i++) {
      const { method, router, role, level } = res[i];
      const key = `${method}_${router}`;
      const value = JSON.stringify({
        role,
        level,
      });
      formatData[key] = value;
      listPromise.push(() =>
        hSet(
          REDIS_KEY_PERMISSION,
          key,
          value,
          "permission.model.js",
          Date.now()
        )
      );
    }

    await Promise.all(listPromise.map((fn) => fn()));

    // const formatData = res.reduce((result, item) => {
    //   result[`${item.method}_${item.router}`] = {
    //     role: item.role,
    //     level: item.level,
    //   };
    //   return result;
    // }, {});

    // await setRedis(REDIS_KEY_PERMISSION, JSON.stringify(formatData));
    return formatData;
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

    const select = `id,name,method,group_,router,publish,created_at,updated_at`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tablePermission,
        select,
        where,
        conditions,
        "id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, tablePermission, "*", where, conditions),
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
    const selectData = `id,name,method,router,group_,publish`;

    const res_ = await this.select(
      conn,
      tablePermission,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const { name, method, router, group_, publish } = body;
    const permission = new PermissionSchema({
      name,
      method,
      router,
      group_,
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete permission.updated_at;

    const res_ = await this.insert(conn, tablePermission, permission);
    await this.init(conn);
    permission.id = res_;
    delete permission.is_deleted;
    return permission;
  }

  //update
  async updateById(conn, body, params) {
    const { name, method, router, group_, publish } = body;
    const { id } = params;

    const perission = new PermissionSchema({
      name,
      method,
      router,
      group_,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete perission.created_at;
    delete perission.is_deleted;

    await this.update(conn, tablePermission, perission, "id", id);
    await this.init(conn);
    perission.id = id;
    return perission;
  }

  //delete
  async deleteById(conn, connPromise, params) {
    const { id } = params;
    await connPromise.beginTransaction();
    await this.update(conn, tablePermission, { is_deleted: 1 }, "id", id);
    await this.update(
      conn,
      tableRolePermission,
      { is_deleted: 1 },
      "permission_id",
      id,
      "permission_id",
      false
    );

    await this.init(conn);

    await connPromise.commit();

    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tablePermission, { publish }, "id", id);
    await this.init(conn);
    return [];
  }
}

module.exports = new PermissionModel();
