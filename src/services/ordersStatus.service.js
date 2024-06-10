const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");
const ordersStatusModel = require("../models/ordersStatus.model");
const validateModel = require("../models/validate.model");
const { tableOrdersStatus } = require("../constants/tableName.contant");

class OrdersStatusService {
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await ordersStatusModel.getallrows(conn, query);
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
        const data = await ordersStatusModel.getById(conn, params, query);
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
          tableOrdersStatus,
          "title",
          title,
          "Tiêu đề",
          "title"
        );

        const data = await ordersStatusModel.register(conn, body);

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
          tableOrdersStatus,
          "title",
          title,
          "Tiêu đề",
          "title",
          id
        );

        const data = await ordersStatusModel.updateById(conn, body, params);

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
        await ordersStatusModel.deleteById(conn, params);
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
        await ordersStatusModel.updatePublish(conn, body, params);
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

module.exports = new OrdersStatusService();
