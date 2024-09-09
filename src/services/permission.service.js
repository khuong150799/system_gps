const db = require("../dbs/init.mysql");
const { ERROR, ALREADY_EXITS } = require("../constants/msg.constant");
const { BusinessLogicError } = require("../core/error.response");

const permissionModel = require("../models/permission.model");
const DatabaseModel = require("../models/database.model");
const { tablePermission } = require("../constants/tableName.constant");

const databaseModel = new DatabaseModel();

class PermissionService {
  async validate(conn, name, router, id = null) {
    let where = `(name = ? OR router = ?) AND is_deleted = ?`;
    const conditions = [name, router, 0];
    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await databaseModel.select(
      conn,
      tablePermission,
      "id,name,router",
      where,
      conditions
    );

    if (dataCheck.length <= 0) return [];

    // console.log("dataCheck", dataCheck);

    const errors = dataCheck.map((item) => {
      if (item.name) {
        return {
          value: name,
          msg: `Tên ${ALREADY_EXITS}`,
          param: "name",
        };
      } else if (item.router) {
        return {
          value: router,
          msg: `Router ${ALREADY_EXITS}`,
          param: "router",
        };
      }
    });

    throw {
      msg: ERROR,
      errors,
    };
  }

  async init() {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await permissionModel.init(conn);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await permissionModel.getallrows(conn, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await permissionModel.getById(conn, params, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //Register
  async register(body) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { name, router } = body;

        await this.validate(conn, name, router);

        const data = await permissionModel.register(conn, body);
        return data;
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

  //update
  async updateById(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { name, router } = body;
        const { id } = params;

        await this.validate(conn, name, router, id);

        const data = await permissionModel.updateById(conn, body, params);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //delete
  async deleteById(params) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        await permissionModel.deleteById(conn, connPromise, params);

        return [];
      } catch (error) {
        await connPromise.rollback();
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //updatePublish
  async updatePublish(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await permissionModel.updatePublish(conn, body, params);
        return [];
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new PermissionService();
