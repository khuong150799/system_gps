const db = require("../dbs/init.mysql");
const { ERROR, ALREADY_EXITS, NOT_EMPTY } = require("../constants/msg.contant");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const modelModel = require("../models/model.model");
const tableName = "tbl_model";

const databaseModel = new DatabaseModel();

class ModelService {
  async validate(conn, name, type, disk, quantityChannel, id = null) {
    const errors = [];

    if (type == 2) {
      if (!disk) {
        errors.push({
          value: disk,
          msg: NOT_EMPTY,
          param: "disk",
        });
      }

      if (!quantityChannel) {
        errors.push({
          value: quantityChannel,
          msg: NOT_EMPTY,
          param: "quantity_channel",
        });
      }
    }

    let where = `name = ? AND is_deleted = ?`;
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
    if (dataCheck.length <= 0) return [];

    errors.push({
      value: name,
      msg: `Tên ${ALREADY_EXITS}`,
      param: "name",
    });

    throw {
      msg: ERROR,
      errors,
    };
  }

  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await modelModel.getallrows(conn, query);
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
        const data = await modelModel.getById(conn, params, query);
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
      const { conn, connPromise } = await db.getConnection();
      try {
        const { name, type, disk_id, quantity_channel } = body;

        await this.validate(conn, name, type, disk_id, quantity_channel);

        const model = await modelModel.register(conn, connPromise, body);
        return model;
      } catch (error) {
        await conn.rollback();
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
      const { conn, connPromise } = await db.getConnection();
      try {
        const { name, type, disk_id, quantity_channel } = body;
        const { id } = params;

        await this.validate(conn, name, type, disk_id, quantity_channel, id);

        const model = await modelModel.updateById(
          conn,
          connPromise,
          body,
          params
        );
        return model;
      } catch (error) {
        await connPromise.rollback();
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
        await modelModel.deleteById(conn, params);
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
        await modelModel.updatePublish(conn, body, params);
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

module.exports = new ModelService();
