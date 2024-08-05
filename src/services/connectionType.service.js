const db = require("../dbs/init.mysql");
const connectionTypeModel = require("../models/connectionType.model");
const { BusinessLogicError } = require("../core/error.response");
const validateModel = require("../models/validate.model");
const { tableConnectionType } = require("../constants/tableName.constant");

class ConnectionTypeService {
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await connectionTypeModel.getallrows(conn, query);
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
        const data = await connectionTypeModel.getById(conn, params, query);
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
  async register(body, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { name } = body;

        await validateModel.checkExitValue(
          conn,
          tableConnectionType,
          "name",
          name,
          "Tên",
          "name"
        );

        const res_ = await connectionTypeModel.register(
          conn,
          connPromise,
          body,
          infoUser
        );

        return res_;
      } catch (error) {
        await connPromise.rollback();
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
  async updateById(body, params, infoUser) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { name } = body;
        const { id } = params;

        await validateModel.checkExitValue(
          conn,
          tableConnectionType,
          "name",
          name,
          "Tên",
          "name",
          id
        );

        const data = await connectionTypeModel.updateById(
          conn,
          connPromise,
          body,
          params,
          infoUser
        );
        return data;
      } catch (error) {
        await connPromise.rollback();
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
        await connectionTypeModel.deleteById(conn, params);
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
        await connectionTypeModel.updatePublish(conn, body, params);
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

module.exports = new ConnectionTypeService();
