const db = require("../dbs/init.mysql");
const { ERROR, ALREADY_EXITS } = require("../constants");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const servicePackageModel = require("../models/servicePackage.model");
const tableName = "tbl_service_package";

const databaseModel = new DatabaseModel();

class ServicePackageService {
  async validate(conn, name, id = null) {
    let where = `(name = ?) AND is_deleted = ?`;
    const conditions = [name, 0];

    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await databaseModel.select(
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
              msg: `Tên gói ${ALREADY_EXITS}`,
              param: "name",
            },
          ],
        },
      };
    }
    return { result: true };
  }

  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await servicePackageModel.getallrows(conn, query);
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
        const data = await servicePackageModel.getById(conn, params, query);
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
        const { name } = body;
        const isCheck = await this.validate(conn, name);
        if (!isCheck.result) {
          conn.release();
          throw isCheck.errors;
        }
        const data = await servicePackageModel.register(conn, body);
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

  //update
  async updateById(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { id } = params;
        const { name } = body;

        const isCheck = await this.validate(conn, name, id);
        if (!isCheck.result) {
          conn.release();
          throw isCheck.errors;
        }

        const data = await servicePackageModel.updateById(conn, body, params);
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
      const { conn } = await db.getConnection();
      try {
        await servicePackageModel.deleteById(conn, params);
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

  //updatePublish
  async updatePublish(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await servicePackageModel.updatePublish(conn, body, params);
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

module.exports = new ServicePackageService();
