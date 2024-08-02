const db = require("../dbs/init.mysql");
const deviceStatusModel = require("../models/deviceStatus.model");
const { BusinessLogicError } = require("../core/error.response");
const validateModel = require("../models/validate.model");
const { tableDeviceStatus } = require("../constants/tableName.constant");

class DeviceStatusService {
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await deviceStatusModel.getallrows(conn, query);
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
        const data = await deviceStatusModel.getById(conn, params, query);
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
          tableDeviceStatus,
          "title",
          title,
          "Tiêu đề",
          "title"
        );

        const deviceStatus = await deviceStatusModel.register(conn, body);

        return deviceStatus;
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
          tableDeviceStatus,
          "title",
          title,
          "Tiêu đề",
          "title",
          id
        );

        const deviceStatus = await deviceStatusModel.updateById(
          conn,
          body,
          params
        );

        return deviceStatus;
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
        await deviceStatusModel.deleteById(conn, params);
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
        await deviceStatusModel.updatePublish(conn, body, params);

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

module.exports = new DeviceStatusService();
