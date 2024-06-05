const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const PermissionModel = require("../models/permission.model");
const {
  ERROR,
  ALREADY_EXITS,
  REDIS_PROPERTY_PERMISSION,
} = require("../constants");
const { BusinessLogicError } = require("../core/error.response");
const {
  set: setRedis,
  setWithExpired: setRedisWithExpired,
} = require("./redis.service");
const tableName = "tbl_permission";
const tableRole = "tbl_role";
const tableRolePermission = "tbl_role_permission";
const tableLevel = "tbl_level";
const tableLevelPermission = "tbl_level_permission";

class PermissionService extends DatabaseService {
  constructor() {
    super();
  }

  async validate(conn, name, id = null) {
    let where = `name = ? AND is_deleted = ?`;
    const conditions = [name, 0];
    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await this.select(
      conn,
      tableName,
      "id",
      where,
      conditions
    );
    if (dataCheck.length > 0) {
      return {
        result: false,
        errors: {
          msg: ERROR,
          errors: [
            {
              value: name,
              msg: `Tên ${ALREADY_EXITS}`,
              param: "name",
            },
          ],
        },
      };
    }
    return { result: true };
  }

  async init() {
    try {
      const { conn } = await db.getConnection();
      try {
        const where = `p.publish = ? AND p.is_deleted = ? AND l.publish = ? AND l.is_deleted = ? AND r.publish = ? AND r.is_deleted = ?`;
        const conditions = [1, 0, 1, 0, 1, 0];
        const joinTable = `${tableName} p INNER JOIN ${tableLevelPermission} lp ON p.id = lp.permission_id 
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
        if (!res.length) {
          await setRedisWithExpired(
            REDIS_PROPERTY_PERMISSION,
            JSON.stringify([])
          );
          return [];
        }

        const formatData = res.reduce((result, item) => {
          result[`${item.method}_${item.router}`] = {
            role: item.role,
            level: item.level,
          };
          return result;
        }, {});

        await setRedis(REDIS_PROPERTY_PERMISSION, JSON.stringify(formatData));
        return formatData;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //getallrow
  async getallrows(query) {
    try {
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

      const { conn } = await db.getConnection();
      const [res_, count] = await Promise.all([
        this.select(
          conn,
          tableName,
          select,
          where,
          conditions,
          "id",
          "DESC",
          offset,
          limit
        ),
        this.count(conn, tableName, "*", where, conditions),
      ]);

      const totalPage = Math.ceil(count?.[0]?.total / limit);

      conn.release();
      return { data: res_, totalPage };
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { id } = params;
      const isDeleted = query.is_deleted || 0;
      const where = `is_deleted = ? AND id = ?`;
      const conditions = [isDeleted, id];
      const selectData = `id,name,method,router,group_,publish`;

      const { conn } = await db.getConnection();
      const res_ = await this.select(
        conn,
        tableName,
        selectData,
        where,
        conditions
      );
      conn.release();
      return res_;
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //Register
  async register(body) {
    try {
      const { name, method, router, group_, publish } = body;
      const permission = new PermissionModel({
        name,
        method,
        router,
        group_,
        publish,
        is_deleted: 0,
        created_at: Date.now(),
      });
      delete permission.updated_at;

      const { conn } = await db.getConnection();
      const isCheck = await this.validate(conn, name);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }
      const res_ = await this.insert(conn, tableName, permission);
      await this.init();
      conn.release();
      permission.id = res_;
      delete permission.is_deleted;
      return permission;
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //update
  async updateById(body, params) {
    try {
      const { name, method, router, group_, publish } = body;
      const { id } = params;

      const { conn } = await db.getConnection();

      const isCheck = await this.validate(conn, name, id);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const perission = new PermissionModel({
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

      await this.update(conn, tableName, perission, "id", id);
      await this.init();
      conn.release();
      perission.id = id;
      return perission;
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //delete
  async deleteById(params) {
    try {
      const { id } = params;
      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { is_deleted: 1 }, "id", id);
      await this.init();
      conn.release();
      return [];
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //updatePublish
  async updatePublish(body, params) {
    try {
      const { id } = params;
      const { publish } = body;

      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { publish }, "id", id);
      await this.init();
      conn.release();
      return [];
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new PermissionService();
