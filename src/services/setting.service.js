const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const validateModel = require("../models/validate.model");
const settingModel = require("../models/setting.model");
const { tableSetting } = require("../constants/tableName.constant");

class SettingService {
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await settingModel.getallrows(conn, query);
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
        const data = await settingModel.getById(conn, params, query);
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
  async getList(userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await settingModel.getList(conn, userId);
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

  //Register
  async register(body) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { title } = body;

        await validateModel.checkExitValue(
          conn,
          tableSetting,
          "title",
          title,
          "Tiêu đề",
          "title"
        );

        const data = await settingModel.register(conn, body);
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

  async registerUser(body, userId) {
    try {
      const { conn } = await db.getConnection();
      try {
        console.log("body", body);

        const data = await settingModel.registerUser(conn, body, userId);
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
        const { title } = body;
        const { id } = params;

        await validateModel.checkExitValue(
          conn,
          tableSetting,
          "title",
          title,
          "Tiêu đề",
          "title",
          id
        );

        const data = await settingModel.updateById(conn, body, params);
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
        await settingModel.deleteById(conn, params);
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

  //updateSort
  async updateSort(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await settingModel.updateSort(conn, body, params);
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
        await settingModel.updatePublish(conn, body, params);
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

module.exports = new SettingService();
