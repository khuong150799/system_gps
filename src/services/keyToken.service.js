const db = require("../dbs/init.mysql");
const keyTokenModel = require("../models/keyToken.model");
const { BusinessLogicError } = require("../core/error.response");

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
      const { conn } = await db.getConnection();
      try {
        const data = await keyTokenModel.updateById(conn, body, params);

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

  //delete
  async deleteById(params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await keyTokenModel.deleteById(conn, params);
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

module.exports = new KeyTokenService();
