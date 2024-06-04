const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const LevelModel = require("../models/level.model");
const { ERROR, ALREADY_EXITS } = require("../constants");
const { BusinessLogicError } = require("../core/error.response");
const tableName = "tbl_role";
const tableRolePermission = "tbl_role_permission";

class RoleService extends DatabaseService {
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
    if (dataCheck.length <= 0) return { result: true };

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

      const select = "id,name,des,publish,sort,created_at,updated_at";
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
      const selectData = `id,name,des,publish`;

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
      const { name, des, publish } = body;
      const level = new LevelModel({
        name,
        des: des || null,
        publish,
        sort: 0,
        is_deleted: 0,
        created_at: Date.now(),
      });
      delete level.updated_at;

      const { conn } = await db.getConnection();
      const isCheck = await this.validate(conn, name);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }
      const res_ = await this.insert(conn, tableName, level);
      conn.release();
      level.id = res_;
      delete level.is_deleted;
      return level;
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //Register permission
  async registerPermission(body) {
    try {
      const { id, permissions } = body;

      const listPermissionId = JSON.parse(permissions);
      if (listPermissionId?.length <= 0) return [];
      const dataInsert = listPermissionId.map((item) => [id, item, Date.now()]);

      const { conn } = await db.getConnection();

      await this.insertIgnore(
        conn,
        tableRolePermission,
        "role_id,permission_id,created_at",
        dataInsert
      );
      conn.release();

      return [];
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //update
  async updateById(body, params) {
    try {
      const { name, des, publish } = body;
      const { id } = params;

      const { conn } = await db.getConnection();

      const isCheck = await this.validate(conn, name, id);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const level = new LevelModel({
        name,
        des: des || null,
        publish,
        updated_at: Date.now(),
      });
      // console.log(id)
      delete level.created_at;
      delete level.sort;
      delete level.is_deleted;

      await this.update(conn, tableName, level, "id", id);
      conn.release();
      level.id = id;
      return level;
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
      conn.release();
      return [];
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //sort
  async updateSort(body, params) {
    try {
      const { id } = params;
      const { sort } = body;

      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { sort }, "id", id);
      return [];
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new RoleService();
