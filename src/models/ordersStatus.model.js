const DatabaseModel = require("./database.model");
const OrdersStatusSchema = require("./schema/ordersStatus.schema");
const tableName = "tbl_orders_status";

class OrdersStatusModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
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

    const select = "id,title,des,publish,created_at,updated_at";
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

    return { data: res_, totalPage };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `id,title,des,publish`;

    const res_ = await this.select(
      conn,
      tableName,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const { title, des, publish } = body;
    const ordersStatus = new OrdersStatusSchema({
      title,
      des: des || null,
      publish,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete ordersStatus.updated_at;

    const res_ = await this.insert(conn, tableName, ordersStatus);
    ordersStatus.id = res_;
    delete ordersStatus.is_deleted;
    return ordersStatus;
  }

  //update
  async updateById(conn, body, params) {
    const { title, des, publish } = body;
    const { id } = params;

    const ordersStatus = new OrdersStatusSchema({
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
    ordersStatus.id = id;
    return ordersStatus;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableName, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;
    await this.update(conn, tableName, { publish }, "id", id);
    return [];
  }
}

module.exports = new OrdersStatusModel();
