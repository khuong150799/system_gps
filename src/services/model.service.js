const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const ModelModel = require("../models/model.model");
const { ERROR, ALREADY_EXITS, NOT_EMPTY } = require("../constants");
const tableName = "tbl_model";
const tableDisk = "tbl_disk";
const tableConnectType = "tbl_connection_type";
const tableModelConnectType = "tbl_model_connection_type";

class ModelService extends DatabaseService {
  constructor() {
    super();
  }

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

    const dataCheck = await this.select(
      conn,
      tableName,
      "id",
      where,
      conditions
    );
    if (dataCheck.length <= 0) return { result: true };

    errors.push({
      value: name,
      msg: `Tên ${ALREADY_EXITS}`,
      param: "name",
    });

    return {
      result: false,
      errors: {
        msg: ERROR,
        errors,
      },
    };
  }

  //getallrow
  async getallrows(query) {
    try {
      const offset = query.offset || 0;
      const limit = query.limit || 10;
      const isDeleted = query.is_deleted || 0;
      let where = `${tableName}.is_deleted = ?`;
      const conditions = [isDeleted];

      if (query.keyword) {
        where += ` AND (${tableName}.name LIKE ? OR ${tableName}.made_in LIKE ?)`;
        conditions.push(`%${query.keyword}%`, `%${query.keyword}%`);
      }

      if (query.publish) {
        where += ` AND ${tableName}.publish = ?`;
        conditions.push(query.publish);
      }

      if (query.disk_id) {
        where += ` AND ${tableName}.disk_id = ?`;
        conditions.push(query.disk_id);
      }

      if (query.type) {
        where += ` AND ${tableName}.type = ?`;
        conditions.push(query.type);
      }

      if (query.connection_type_id) {
        where += ` AND ${tableConnectType}.id = ?`;
        conditions.push(query.connection_type_id);
      }

      const joinTable = `${tableName} INNER JOIN ${tableDisk} ON ${tableName}.disk_id = ${tableDisk}.id INNER JOIN ${tableModelConnectType} ON ${tableName}.id = ${tableModelConnectType}.model_id INNER JOIN ${tableConnectType} ON ${tableModelConnectType}.connection_type_id = ${tableConnectType}.id`;

      const select = `${tableName}.id,${tableName}.name,${tableName}.made_in,${tableName}.type,${tableDisk}.name as disk_name,${tableName}.quantity_channel,${tableName}.note,${tableName}.publish,${tableName}.is_gps,GROUP_CONCAT(${tableConnectType}.name) as connection_type_name`;
      const { conn } = await db.getConnection();
      const [res_, count] = await Promise.all([
        this.select(
          conn,
          joinTable,
          select,
          `${where} GROUP BY ${tableName}.id`,
          conditions,
          "id",
          "DESC",
          offset,
          limit
        ),
        this.count(
          conn,
          joinTable,
          "*",
          `${where} GROUP BY ${tableName}.id`,
          conditions
        ),
      ]);

      const totalPage = Math.ceil(count?.[0]?.total / limit);

      conn.release();
      return { data: res_, totalPage };
    } catch (error) {
      throw error;
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { id } = params;
      const isDeleted = query.is_deleted || 0;
      const where = `${tableName}.is_deleted = ? AND ${tableName}.id = ?`;
      const conditions = [isDeleted, id];
      const joinTable = `${tableName} INNER JOIN ${tableModelConnectType} ON ${tableName}.id = ${tableModelConnectType}.model_id`;
      const selectData = `${tableName}.id,${tableName}.name,${tableName}.made_in,${tableName}.type,GROUP_CONCAT(${tableModelConnectType}.connection_type_id) as connection_type_id,${tableName}.disk_id,${tableName}.quantity_channel,${tableName}.note,${tableName}.publish,${tableName}.is_gps`;

      const { conn } = await db.getConnection();
      const res_ = await this.select(
        conn,
        joinTable,
        selectData,
        `${where} GROUP BY ${tableName}.id`,
        conditions,
        `${tableName}.id`
      );
      conn.release();
      return res_;
    } catch (error) {
      throw error;
    }
  }

  //Register
  async register(body) {
    const { conn, connPromise } = await db.getConnection();
    try {
      const {
        name,
        made_in,
        type,
        disk_id,
        connection_type_id,
        quantity_channel,
        note,
        publish,
        is_gps,
      } = body;

      const createdAt = Date.now();
      const model = new ModelModel({
        name,
        made_in,
        type,
        disk_id: type === 2 ? disk_id : null,
        quantity_channel: type === 2 ? quantity_channel : null,
        note,
        publish,
        is_gps,
        is_deleted: 0,
        created_at: createdAt,
      });
      delete model.updated_at;

      const isCheck = await this.validate(
        conn,
        name,
        type,
        disk_id,
        quantity_channel
      );
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }
      await connPromise.beginTransaction();
      const res_ = await this.insert(conn, tableName, model);

      const connectionTypeIdParse = JSON.parse(connection_type_id);

      const dataInsertModelConnectType = connectionTypeIdParse?.map((item) => [
        res_,
        item,
        createdAt,
      ]);

      await this.insertMulti(
        conn,
        tableModelConnectType,
        "model_id,connection_type_id,created_at",
        dataInsertModelConnectType
      );
      await connPromise.commit();
      conn.release();
      model.id = res_;
      model.connection_type_id = connection_type_id;
      delete model.is_deleted;
      return model;
    } catch (error) {
      throw error;
    } finally {
      conn.release();
    }
  }

  //update
  async updateById(body, params) {
    const { conn, connPromise } = await db.getConnection();
    try {
      const {
        name,
        made_in,
        type,
        disk_id,
        connection_type_id,
        quantity_channel,
        note,
        publish,
        is_gps,
      } = body;
      const { id } = params;

      const updatedAt = Date.now();

      const isCheck = await this.validate(
        conn,
        name,
        type,
        disk_id,
        quantity_channel,
        id
      );
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const model = new ModelModel({
        name,
        made_in,
        type,
        disk_id,
        quantity_channel,
        note,
        publish,
        is_gps,
        updated_at: updatedAt,
      });
      // console.log(id)
      delete model.created_at;
      delete model.is_deleted;

      await connPromise.beginTransaction();

      await this.update(conn, tableName, model, "id", id);
      const connectionTypeIdParse = JSON.parse(connection_type_id);
      await this.delete(
        conn,
        tableModelConnectType,
        `model_id = ? AND connection_type_id NOT IN (?)`,
        [id, connectionTypeIdParse.join(",")],
        "ID",
        false
      );

      const dataInsertModelConnectType = connectionTypeIdParse?.map((item) => [
        id,
        item,
        updatedAt,
      ]);

      await this.insertIgnore(
        conn,
        tableModelConnectType,
        "model_id,connection_type_id,created_at",
        dataInsertModelConnectType
      );
      await connPromise.commit();

      conn.release();
      model.id = id;
      model.connection_type_id = connection_type_id;
      return model;
    } catch (error) {
      throw error;
    }
  }

  //delete
  async deleteById(params) {
    try {
      const { id } = params;
      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { is_deleted: 1 }, "id", id);
      conn.release();
      return [];
    } catch (error) {
      throw error;
    }
  }

  //updatePublish
  async updatePublish(body, params) {
    try {
      const { id } = params;
      const { publish } = body;

      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { publish }, "id", id);
      conn.release();
      return [];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ModelService();
