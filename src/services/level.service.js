const db = require("../dbs/init.mysql");
const levelModel = require("../models/level.model");
const { BusinessLogicError } = require("../core/error.response");
const validateModel = require("../models/validate.model");
const { tableLevel } = require("../constants/tableName.contant");

class LevelService {
  async getallrows(query, level) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await levelModel.getallrows(conn, query, level);
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
        const data = await levelModel.getById(conn, params, query);
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

  //getPermission
  async getPermission(params, query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await levelModel.getPermission(conn, params, query);
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

  //getPermission
  async getModule(params, query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await levelModel.getModule(conn, params, query);
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

        await validateModel.checkExitValue(
          conn,
          tableLevel,
          "name",
          name,
          "Tên",
          "name"
        );
        const level = await levelModel.register(conn, body);
        return level;
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

  async registerPermission(body) {
    try {
      const { conn } = await db.getConnection();
      try {
        await levelModel.registerPermission(conn, body);
        return [];
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

  async registerModule(body) {
    try {
      const { conn } = await db.getConnection();
      try {
        await levelModel.registerModule(conn, body);
        return [];
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
        const { name } = body;
        const { id } = params;

        await validateModel.checkExitValue(
          conn,
          tableLevel,
          "name",
          name,
          "Tên",
          "name",
          id
        );

        const level = await levelModel.updateById(conn, body, params);
        return level;
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
        await levelModel.deleteById(conn, params);
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

  async deleteModule(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await levelModel.deleteModule(conn, body, params);
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

  async deletePermission(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await levelModel.deletePermission(conn, body, params);
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
        await levelModel.updatePublish(conn, body, params);
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

  //sort
  async updateSort(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await levelModel.updateSort(conn, body, params);
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

module.exports = new LevelService();
