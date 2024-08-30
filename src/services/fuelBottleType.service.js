const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const validateModel = require("../models/validate.model");
const fuelBottleTypeModel = require("../models/fuelBottleType.model");
const { tableFuelBottleType } = require("../constants/tableName.constant");

class FuelBottleTypeService {
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await fuelBottleTypeModel.getallrows(conn, query, role);
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
        const data = await fuelBottleTypeModel.getById(conn, params, query);
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
          tableFuelBottleType,
          "name",
          name,
          "Tên",
          "name"
        );

        const data = await fuelBottleTypeModel.register(conn, body);
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
        const { name } = body;
        const { id } = params;

        await validateModel.checkExitValue(
          conn,
          tableFuelBottleType,
          "name",
          name,
          "Tên",
          "name",
          id
        );

        const data = await fuelBottleTypeModel.updateById(conn, body, params);
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
        await fuelBottleTypeModel.deleteById(conn, params);
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
        await fuelBottleTypeModel.updatePublish(conn, body, params);
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

module.exports = new FuelBottleTypeService();
