const mysql = require("mysql2");
const dbConfig = require("../config/db.config");
const constants = require("../constants/msg.constant");

const pool = mysql.createPool(dbConfig);

class Datatbase {
  constructor() {
    this.getActiveConnections = this.getActiveConnections.bind(this);
    this.executeTransaction = this.executeTransaction.bind(this);
  }
  async getConnection() {
    return await new Promise((resolve, reject) => {
      pool.getConnection((err, conn) => {
        if (err) {
          return reject({ msg: constants.SERVER_ERROR });
        }
        resolve({ conn, connPromise: conn.promise() });
      });
    });
  }
  init() {
    pool.getConnection(async function (err, conn) {
      if (err) {
        return console.log("error when connecting to Database", err);
      } else {
        console.log(`SUCCESS:: CONNECTED TO DATABASE >> ${dbConfig.host}`);

        conn.release();
      }
    });
  }
  async getActiveConnections() {
    return await new Promise(async (resolve, reject) => {
      // console.log(this);

      const { conn } = await this.getConnection();
      const query =
        "SELECT COUNT(*) AS connection_count FROM information_schema.PROCESSLIST";

      conn.query(query, (err, results) => {
        conn.release();
        if (err) {
          console.error("Lỗi truy vấn SQL của count connect:", err);
          return reject(err);
        }
        console.log("result count connect", results);
        const connectionCount = results[0].connection_count;
        return resolve(connectionCount);
      });
    });
  }
  async executeTransaction(callback) {
    const { conn, connPromise } = await this.getConnection();
    try {
      await connPromise.beginTransaction();
      const result = await callback(conn);

      await connPromise.commit();

      return result;
    } catch (error) {
      await connPromise.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }
}

const { getConnection, init, getActiveConnections, executeTransaction } =
  new Datatbase();

module.exports = {
  getConnection,
  initDb: init,
  getActiveConnections,
  executeTransaction,
  db: pool,
};
