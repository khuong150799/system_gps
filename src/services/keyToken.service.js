const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const KeyTokenModel = require("../models/keyToken.model");
const tableName = "tbl_key_token";

class KeyTokenService extends DatabaseService {
  constructor() {
    super();
  }

  //getallrow
  async getData(clientId) {
    try {
      const where = `client_id = ?`;
      const conditions = [clientId];

      const select = "id,publish_key_token,publish_key_refresh_token";
      const { conn } = await db.getConnection();
      const res = await this.select(conn, tableName, select, where, conditions);

      conn.release();
      return res;
    } catch (error) {
      throw error;
    }
  }

  //Register
  async register(body) {
    try {
      const {
        user_id,
        client_id,
        publish_key_token,
        publish_key_refresh_token,
      } = body;
      const keyToken = new KeyTokenModel({
        user_id,
        client_id,
        publish_key_token,
        publish_key_refresh_token,
        created_at: Date.now(),
      });
      delete keyToken.updated_at;

      const { conn } = await db.getConnection();

      const res_ = await this.insert(conn, tableName, keyToken);
      conn.release();
      keyToken.id = res_;
      delete keyToken.is_deleted;
      return keyToken;
    } catch (error) {
      throw error;
    }
  }

  //update
  async updateById(body, params) {
    try {
      const { publish_key_token } = body;
      const { client_id } = params;

      const { conn } = await db.getConnection();

      const keyToken = new KeyTokenModel({
        publish_key_token,
        updated_at: Date.now(),
      });
      // console.log(id)
      delete keyToken.user_id;
      delete keyToken.client_id;
      delete keyToken.publish_key_refresh_token;
      delete keyToken.created_at;

      await this.update(conn, tableName, keyToken, "client_id", client_id);
      conn.release();
      return keyToken;
    } catch (error) {
      throw error;
    }
  }

  //delete
  async deleteById(params) {
    try {
      const { client_id } = params;
      const { conn } = await db.getConnection();
      await this.delete(conn, tableName, "client_id = ?", [client_id]);
      conn.release();
      return [];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new KeyTokenService();
