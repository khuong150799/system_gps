const DatabaseModel = require("./database.model");
const { tableTypeCode } = require("../constants/tableName.constant");

class TypeCodeModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    let where = `1 = ?`;
    const conditions = [1];

    if (query.keyword) {
      where += ` AND name LIKE ?`;
      conditions.push(`%${query.keyword}%`);
    }

    const select = "id,name";
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableTypeCode,
        select,
        where,
        conditions,
        "id",
        "ASC",
        offset,
        limit
      ),
      this.count(conn, tableTypeCode, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  //Register
  // async register(conn, body = {}, listCode = []) {
  //   const { type } = body;
  //   const createdAt = Date.now();
  //   const dataInsert = listCode.map((code) => [code, type, 0, createdAt]);

  //   const res_ = await this.insertMulti(
  //     conn,
  //     tableRenewalCode,
  //     "code,type,is_used,created_at",
  //     dataInsert
  //   );

  //   return res_;
  // }
}

module.exports = new TypeCodeModel();
