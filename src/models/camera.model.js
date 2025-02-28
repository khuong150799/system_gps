const { NOT_EXITS } = require("../constants/msg.constant");
const {
  tableServerCamera,
  tableDevice,
} = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");

class CameraModel extends DatabaseModel {
  constructor() {
    super();
  }

  async getServerCam(conn, imei) {
    const inforDevice = await this.select(
      conn,
      tableDevice,
      "id,server_camera_id",
      "imei = ? anđ is_deleted = 0",
      imei,
      "id",
      "ASC",
      0,
      1
    );

    if (!inforDevice[0]?.server_camera_id)
      throw {
        msg: `Máy chủ camera ${NOT_EXITS}`,
      };

    const svCamId = inforDevice[0].server_camera_id;

    const dataServerCam = await this.select(
      conn,
      tableServerCamera,
      "host,port",
      "id = ?",
      svCamId
    );

    if (!dataServerCam?.length)
      throw {
        msg: `Máy chủ camera ${NOT_EXITS}`,
      };

    const { host, port } = dataServerCam[0];

    return { serCam: `${host}:${port}`, host };
  }
}

module.exports = new CameraModel();
