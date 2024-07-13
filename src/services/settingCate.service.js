const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const { tableSettingCate } = require("../constants/tableName.contant");
const validateModel = require("../models/validate.model");
const settingCateModel = require("../models/settingCate.model");

class SettingCateService {
  //getallrow
  async getallrows(query, role) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await settingCateModel.getallrows(conn, query, role);
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
        const data = await settingCateModel.getById(conn, params, query);
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
          tableSettingCate,
          "title",
          title,
          "Tiêu đề",
          "title"
        );

        const data = await settingCateModel.register(conn, body);
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
          tableSettingCate,
          "title",
          title,
          "Tiêu đề",
          "title",
          id
        );

        const data = await settingCateModel.updateById(conn, body, params);
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
        await settingCateModel.deleteById(conn, params);
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
        await settingCateModel.updateSort(conn, body, params);
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
        await settingCateModel.updatePublish(conn, body, params);
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

module.exports = new SettingCateService();
