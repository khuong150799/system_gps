const { NOT_EXITS } = require("../constants/msg.constant");
const {
  tableServerCamera,
  tableDevice,
  tableCommandConfigurations,
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
      "id,sv_cam_id",
      "imei = ? AND is_deleted = 0",
      imei,
      "id",
      "ASC",
      0,
      1
    );

    if (!inforDevice[0]?.sv_cam_id)
      throw {
        msg: `Thiết bị ${NOT_EXITS}`,
      };

    const { id: deviceId, sv_cam_id: svCamId } = inforDevice[0];

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

    return { serCam: `${host}:${port}`, host, deviceId };
  }

  async registerCommand(conn, { data, type, device_id }) {
    await this.insertDuplicate(
      conn,
      tableCommandConfigurations,
      "device_id, config_name, value",
      [[device_id, type, JSON.stringify(data)]],
      `device_id = VALUES(device_id), config_name = VALUES(config_name), value = VALUES(value), updated_at = ${Date.now()}`
    );
  }
}

module.exports = new CameraModel();
