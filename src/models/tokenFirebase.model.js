const { tableTokenFirebase } = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const TokenFirebaseSchema = require("./schema/tokenFirebase.schema");

class TokenFirebaseModel extends DatabaseModel {
  constructor() {
    super();
  }

  //Register
  async register(conn, body) {
    const { user_id, client_id, token } = body;
    const data = new TokenFirebaseSchema({
      user_id,
      client_id,
      token,
      created_at: Date.now(),
    });
    // console.log("data", data);

    const res_ = await this.insertDuplicate(
      conn,
      tableTokenFirebase,
      "user_id,client_id,token,created_at",
      [[user_id, client_id, token, Date.now()]],
      "user_id=VALUES(user_id),client_id=VALUES(client_id),created_at=VALUES(created_at)"
    );
    // console.log("res_", res_);

    data.id = res_;
    delete data.is_deleted;
    return data;
  }

  //delete
  async deleteById(conn, body) {
    const { client_id, user_id } = body;
    await this.delete(
      conn,
      tableTokenFirebase,
      "user_id = ? AND client_id = ?",
      [user_id, client_id],
      "",
      false
    );
    return [];
  }
}

module.exports = new TokenFirebaseModel();
