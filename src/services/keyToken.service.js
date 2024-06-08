const db = require("../dbs/init.mysql");
const keyTokenModel = require("../models/keyToken.model");
const { BusinessLogicError } = require("../core/error.response");
const tableName = "tbl_key_token";

class KeyTokenService {
  //getallrow
  async getData(clientId) {
    try {
      const { conn } = await db.getConnection();
      try {
        const res = await keyTokenModel.getData(conn, clientId);

        return res;
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
        const keyToken = await keyTokenModel.register(conn, body);
        return keyToken;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
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
      throw new BusinessLogicError(error.msg);
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
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new KeyTokenService();
