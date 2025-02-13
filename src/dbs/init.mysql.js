const mysql = require("mysql2");
const dbConfig = require("../config/db.config");
const constants = require("../constants/msg.constant");

const pool = mysql.createPool(dbConfig);
// const vehicleModel = require("../models/vehicle.model");
// const {
//   tableDevice,
//   tableDeviceVehicle,
//   tableVehicle,
// } = require("../constants/tableName.constant");
// const { activationCms } = require("../models/device.model");
// const configFuelModel = require("../models/configFuel.model");
// const driverModel = require("../models/driver.model");
// const { hSet } = require("../models/redis.model");
// const { REDIS_KEY_LIST_DRIVER } = require("../constants/redis.constant");

// const { readFileSync, appendFileSync } = require("fs");
// const vehicleModel = require("../models/vehicle.model");

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
        //   console.log(`SUCCESS:: CONNECTED TO DATABASE >> ${dbConfig.host}`);
        //   const select =
        //     "d.id,d.imei,v.name as vehicle_name,dv.quantity_channel";
        //   const joinTable = `${tableDevice} d INNER JOIN ${tableDeviceVehicle} dv ON d.id = dv.device_id
        //     INNER JOIN ${tableVehicle} v ON dv.vehicle_id = v.id`;
        //   const where =
        //     "WHERE d.is_deleted = 0 AND d.device_status_id = 3 AND d.sv_cam_id = 10 AND dv.is_deleted = 0 AND v.is_deleted = 0";

        //   conn.query(
        //     `SELECT ${select} FROM ${joinTable} ${where}`,
        //     (err, data) => {
        //       if (err) {
        //         console.log(err);
        //         throw err;
        //       }

        //       console.log("data", data.length);

        //       let i = 0;

        //       const intervalId = setInterval(async () => {
        //         if (i === data.length - 1) {
        //           clearInterval(intervalId);
        //           return;
        //         }

        //         const { imei, vehicle_name, quantity_channel } = data[i];
        //         console.log(i, imei);
        //         i++;
        //         try {
        //           await activationCms(
        //             conn,
        //             10,
        //             vehicle_name,
        //             imei,
        //             quantity_channel
        //           );
        //         } catch (error) {
        //           console.log(error);
        //         }
        //       }, 1000);
        //     }
        //   );
        // } catch (error) {
        //   console.log(error);
        // } finally {
        //   // Đóng kết nối
        //   conn.release();
        // }

        // try {
        // Bắt đầu transaction
        console.log(`SUCCESS:: CONNECTED TO DATABASE >> ${dbConfig.host}`);

        // const data = JSON.parse(readFileSync("transmission.json", "utf8"));

        // // const listImei = data.map(({ devId }) => devId);
        // const listImei = [];

        // for (let i = 0; i < data.length; i++) {
        //   const { devId, isTTGPS } = data[i];

        //   if (isTTGPS == 1) {
        //     listImei.push(devId);
        //   }
        // }

        // console.log("listImei.length", listImei.length);

        // const dataDevice = await vehicleModel.getVehicleTransmission(
        //   conn,
        //   listImei
        // );

        // console.log("dataDevice.length", dataDevice.length);

        // const handleRecursive = async (data) => {
        //   const dataBatch = data.splice(0, 1000);
        //   const listPromise = dataBatch.map(({ device_id, vehicle_id }) => {
        //     console.log("device_id", device_id);
        //     return vehicleModel.updateTransmission(
        //       conn,
        //       conn.promise(),
        //       { property: "is_transmission_gps", value: 1, device_id },
        //       { id: vehicle_id }
        //     );
        //   });

        //   const res = await Promise.all(listPromise);

        //   for (let i = 0; i < res.length; i++) {
        //     const item = res[i];

        //     if (item?.length) {
        //       appendFileSync("./deviceError.txt", `${item[0]} @ `, "utf8");
        //     }
        //   }
        //   console.log("done", dataBatch.length);

        //   if (data.length === 0) {
        //     conn.release();
        //     console.log("done all");

        //     return;
        //   }
        //   setTimeout(() => {
        //     handleRecursive(data)
        //       .then(() => console.log("ok"))
        //       .catch((err) => console.log(err));
        //   }, 100);
        // };

        // await handleRecursive(dataDevice);

        //  const dataUpdate = data.map(({ id, transmission }) => {})

        // await vehicleModel.getInfoDevice(conn, null, null, null);

        // console.log(`SUCCESS UPDATE REDIS`);

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

        // await vehicleModel.getInfoDevice(conn, "08F4A28F9T");

        // await configFuelModel.getallrows(conn);

        // const { data } = await driverModel.getallrows(
        //   conn,
        //   { offset: 0, limit: 99999 },
        //   0,
        //   10556
        // );
        // console.log("data?.length", data?.length);

        // if (data?.length) {
        //   const listPromise = data.map(
        //     ({ license_number, name, phone, address, gender }) =>
        //       hSet(
        //         REDIS_KEY_LIST_DRIVER,
        //         license_number.toString(),
        //         JSON.stringify({ name, phone, address, gender })
        //       )
        //   );
        //   await Promise.all(listPromise);
        //   console.log("ok");
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
