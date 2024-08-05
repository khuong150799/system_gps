const db = require("../dbs/init.mysql");
const { BusinessLogicError } = require("../core/error.response");

const writeLogModel = require("../models/writeLog.model");

class WriteLogsService {
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await writeLogModel.getallrows(conn, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log("error", error);
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new WriteLogsService();
