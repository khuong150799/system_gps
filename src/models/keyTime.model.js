const DatabaseModel = require("./database.model");
const { tableKeyTime } = require("../constants/tableName.constant");

class KeyTimeModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    let where = `1 = ?`;
    const conditions = [1];

    const select = "*";
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableKeyTime,
        select,
        where,
        conditions,
        "id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, tableKeyTime, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  // //Register
  // async register(conn, body = {}) {
  //   const { type, quantity } = body;
  //   const createdAt = Date.now();
  //   const dataInsert = [];

  //   for (let i = 0; i < quantity; i++) {
  //     dataInsert.push([generateRandomNumber(), type, 0, createdAt]);
  //   }

  //   const res_ = await this.insertMulti(
  //     conn,
  //     tableRenewalCode,
  //     "code,type,is_used,created_at",
  //     dataInsert
  //   );

  //   return res_;
  // }
}

module.exports = new KeyTimeModel();
