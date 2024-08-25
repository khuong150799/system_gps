const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const validateModel = require("../models/validate.model");
const serverCameraModel = require("../models/serverCamera.model");
const { tableServerCamera } = require("../constants/tableName.constant");

class ServerCameraService {
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await serverCameraModel.getallrows(conn, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);

      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await serverCameraModel.getById(conn, params, query);
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
        const { ip } = body;

        await validateModel.checkExitValue(
          conn,
          tableServerCamera,
          "ip",
          ip,
          "IP",
          "ip"
        );

        const data = await serverCameraModel.register(conn, body);
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
        const { ip } = body;
        const { id } = params;

        await validateModel.checkExitValue(
          conn,
          tableServerCamera,
          "ip",
          ip,
          "IP",
          "ip",
          id
        );

        const data = await serverCameraModel.updateById(conn, body, params);
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

  //delete
  async deleteById(params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await serverCameraModel.deleteById(conn, params);
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
        await serverCameraModel.updatePublish(conn, body, params);
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

module.exports = new ServerCameraService();
