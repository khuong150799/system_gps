const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const { tableSimStatus } = require("../constants/tableName.constant");
const validateModel = require("../models/validate.model");
const simStatusModel = require("../models/simStatus.model");

class SimStatusService {
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await simStatusModel.getallrows(conn, query);
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
        const data = await simStatusModel.getById(conn, params, query);
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
        const { title } = body;

        await validateModel.checkExitValue(
          conn,
          tableSimStatus,
          "title",
          title,
          "Trạng thái sim",
          "title"
        );

        const disk = await simStatusModel.register(conn, body);
        return disk;
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
        const { title } = body;
        const { id } = params;

        await validateModel.checkExitValue(
          conn,
          tableSimStatus,
          "title",
          title,
          "Trạng thái sim",
          "title",
          id
        );

        const disk = await simStatusModel.updateById(conn, body, params);
        return disk;
      } catch (error) {
        throw error;
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
        await simStatusModel.deleteById(conn, params);
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

module.exports = new SimStatusService();
