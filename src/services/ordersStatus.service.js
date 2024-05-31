const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const OrdersStatusModel = require("../models/ordersStatus.model");
const { ERROR, ALREADY_EXITS } = require("../constants");
const { BusinessLogicError } = require("../core/error.response");
const tableName = "tbl_orders_status";

class OrdersStatusService extends DatabaseService {
  constructor() {
    super();
  }

  async validate(conn, title, id = null) {
    let where = `title = ? AND is_deleted = ?`;
    const conditions = [title, 0];
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

    return {
      result: false,
      errors: {
        msg: ERROR,
        errors: [
          {
            value: title,
            msg: `Tiêu đề ${ALREADY_EXITS}`,
            param: "title",
          },
        ],
      },
    };
  }

  //getallrow
  async getallrows(query) {
    try {
      const offset = query.offset || 0;
      const limit = query.limit || 10;
      const isDeleted = query.is_deleted || 0;
      let where = `is_deleted = ?`;
      const conditions = [isDeleted];

      if (query.keyword) {
        where += ` AND title LIKE ?`;
        conditions.push(`%${query.keyword}%`);
      }

      if (query.publish) {
        where += ` AND publish = ?`;
        conditions.push(query.publish);
      }

      const select = "id,title,publish,created_at,updated_at";
      const { conn } = await db.getConnection();
      const [res_, count] = await Promise.all([
        this.select(
          conn,
          tableName,
          select,
          where,
          conditions,
          "id",
          "DESC",
          offset,
          limit
        ),
        this.count(conn, tableName, "*", where, conditions),
      ]);

      const totalPage = Math.ceil(count?.[0]?.total / limit);

      conn.release();
      return { data: res_, totalPage };
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { id } = params;
      const isDeleted = query.is_deleted || 0;
      const where = `is_deleted = ? AND id = ?`;
      const conditions = [isDeleted, id];
      const selectData = `id,title,des,publish`;

      const { conn } = await db.getConnection();
      const res_ = await this.select(
        conn,
        tableName,
        selectData,
        where,
        conditions
      );
      conn.release();
      return res_;
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //Register
  async register(body) {
    try {
      const { title, des, publish } = body;
      const ordersStatus = new OrdersStatusModel({
        title,
        des: des || null,
        publish,
        is_deleted: 0,
        created_at: Date.now(),
      });
      delete ordersStatus.updated_at;

      const { conn } = await db.getConnection();
      const isCheck = await this.validate(conn, title);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }
      const res_ = await this.insert(conn, tableName, ordersStatus);
      conn.release();
      ordersStatus.id = res_;
      delete ordersStatus.is_deleted;
      return ordersStatus;
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //update
  async updateById(body, params) {
    try {
      const { title, des, publish } = body;
      const { id } = params;

      const { conn } = await db.getConnection();

      const isCheck = await this.validate(conn, title, id);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const ordersStatus = new OrdersStatusModel({
        title,
        des: des || null,
        publish,
        updated_at: Date.now(),
      });
      // console.log(id)
      delete ordersStatus.created_at;
      delete ordersStatus.sort;
      delete ordersStatus.is_deleted;

      await this.update(conn, tableName, ordersStatus, "id", id);
      conn.release();
      ordersStatus.id = id;
      return ordersStatus;
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
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
      throw new BusinessLogicError(error.msg);
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
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new OrdersStatusService();
