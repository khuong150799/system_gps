const mysql = require("mysql2");
const dbConfig = require("../config/db.config");
const constants = require("../constants/msg.constant");

const pool = mysql.createPool(dbConfig);

class Datatbase {
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
    pool.getConnection(function (err, conn) {
      if (err) {
        return console.log("error when connecting to Database", err);
      } else {
        console.log(`SUCCESS:: CONNECTED TO DATABASE >> ${dbConfig.host}`);

        // conn.query(sql, (err, res) => {
        //   if (err) {
        //     console.log(err);
        //   }
        //   console.log(res);
        // });
        // const sql = `SELECT GPSData FROM jt808_vehicle_gps_3_202408`;
        // conn.query(sql, (err, data) => {
        //   if (err) {
        //     console.log(err);
        //   } else {
        //     const binaryData = data[0].GPSData;

        //     console.log("binaryData", JSON.parse(binaryData.toString()));
        //   }
        // });
        conn.release();
      }
    });
  }
  async getActiveConnections() {
    return await new Promise(async (resolve, reject) => {
      const connection = await getConnection();
      const query =
        "SELECT COUNT(*) AS connection_count FROM information_schema.PROCESSLIST";

      connection.query(query, (err, results) => {
        connection.release();
        if (err) {
          console.error("Lỗi truy vấn SQL của count connect:", err);
          return reject(err);
        }
        // console.log("result count connect", results);
        const connectionCount = results[0].connection_count;
        return resolve(connectionCount);
      });
    });
  }
}

const { getConnection, init, getActiveConnections } = new Datatbase();

module.exports = {
  getConnection,
  initDb: init,
  getActiveConnections,
  db: pool,
};
