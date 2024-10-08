const { tableKeyToken } = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const KeyTokenSchema = require("./schema/keyToken.schema");

class KeyTokenModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getData(conn, clientId) {
    const where = `client_id = ?`;
    const conditions = [clientId];

    const select = "id,publish_key_token,publish_key_refresh_token";
    const res = await this.select(
      conn,
      tableKeyToken,
      select,
      where,
      conditions
    );

    return res;
  }

  //Register
  async register(conn, body) {
    const { user_id, client_id, publish_key_token, publish_key_refresh_token } =
      body;
    const keyToken = new KeyTokenSchema({
      user_id,
      client_id,
      publish_key_token,
      publish_key_refresh_token,
      created_at: Date.now(),
    });
    delete keyToken.updated_at;
    console.log("keyToken", keyToken);

    const res_ = await this.insert(conn, tableKeyToken, keyToken);
    console.log("res_", res_);

    keyToken.id = res_;
    delete keyToken.is_deleted;
    return keyToken;
  }

  //update
  async updateById(conn, body, params) {
    const { publish_key_token } = body;
    const { client_id } = params;

    const keyToken = new KeyTokenSchema({
      publish_key_token,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete keyToken.user_id;
    delete keyToken.client_id;
    delete keyToken.publish_key_refresh_token;
    delete keyToken.created_at;

    await this.update(conn, tableKeyToken, keyToken, "client_id", client_id);
    return keyToken;
  }

  //delete
  async deleteById(conn, params) {
    const { client_id } = params;
    await this.delete(conn, tableKeyToken, "client_id = ?", [client_id]);
    return [];
  }
}

module.exports = new KeyTokenModel();
