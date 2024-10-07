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
    pool.getConnection(async function (err, conn) {
      if (err) {
        return console.log("error when connecting to Database", err);
      } else {
        // try {
        // Bắt đầu transaction
        //   console.log(`SUCCESS:: CONNECTED TO DATABASE >> ${dbConfig.host}`);

        //   await conn.promise().beginTransaction();

        //   // Xác định ID của root node
        //   const rootId = 1; // Node gốc có parent_id là NULL
        //   let currentLeft = 1;

        //   // Cập nhật toàn bộ cây từ root
        //   await updateNode(conn.promise(), rootId, currentLeft);

        //   // Commit transaction
        //   await conn.promise().commit();
        //   console.log("Cập nhật thành công Nested Set Model");
        // } catch (error) {
        //   // Rollback nếu có lỗi
        //   await conn.promise().rollback();
        //   console.error("Có lỗi xảy ra:", error);
        // } finally {
        //   // Đóng kết nối
        //   conn.release();
        // }

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

// async function updateNode(connection, nodeId, currentLeft) {
//   let newLeft = currentLeft;

//   // Cập nhật giá trị left cho node hiện tại
//   await connection.execute("UPDATE tbl_users SET `left` = ? WHERE `id` = ?", [
//     newLeft,
//     nodeId,
//   ]);
//   currentLeft++;

//   // Lấy tất cả các node con
//   const [children] = await connection.execute(
//     "SELECT id FROM tbl_users WHERE parent_id = ? AND is_deleted = ?",
//     [nodeId, 0]
//   );

//   // Đệ quy cập nhật cho các node con
//   for (let child of children) {
//     currentLeft = await updateNode(connection, child.id, currentLeft);
//   }

//   // Cập nhật giá trị right cho node hiện tại
//   await connection.execute("UPDATE tbl_users SET `right` = ? WHERE `id` = ?", [
//     currentLeft,
//     nodeId,
//   ]);
//   currentLeft++;

//   return currentLeft;
// }

const { getConnection, init, getActiveConnections } = new Datatbase();

module.exports = {
  getConnection,
  initDb: init,
  getActiveConnections,
  db: pool,
};
