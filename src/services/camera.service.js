const cameraApi = require("../api/camera.api");
const {
  VALIDATE_DATA,
  VEHICLE_NOT_PERMISSION,
} = require("../constants/msg.constant");
const { BusinessLogicError } = require("../core/error.response");
const db = require("../dbs/init.mysql");
const cameraModel = require("../models/camera.model");
const commandModel = require("../models/command.model");
const validateModel = require("../models/validate.model");

class CMSService {
  async getVehicleInfo(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await commandModel.getConfigByImei(conn, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);

      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async configCamera(imei, dataSend, userId, { data, type }) {
    try {
      const { conn } = await db.getConnection();
      try {
        await validateModel.checkOwnerDevice(
          conn,
          userId,
          [],
          VEHICLE_NOT_PERMISSION,
          "imei",
          [imei]
        );

        const { host, deviceId, serCam } = await cameraModel.getServerCam(
          conn,
          imei
        );
        const res_ = await cameraApi.config({
          urlCommand: `${host}:16603`,
          url: serCam,
          devidno: imei,
          data: dataSend,
        });
        // console.log("res_", res_);

        if (res_?.result !== 0)
          throw { msg: res_?.message, errors: [{ value: dataSend }] };

        await cameraModel.registerCommand(conn, {
          data,
          type,
          device_id: deviceId,
        });
        return res_;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw error;
    }
  }

  async configVehicleInfo(imei, data, userId) {
    try {
      const dataSend = `$BUS,${data?.dev_id},${imei},${data.vehicle_name},${data.color},${data.area_code},${data.manufacturer},${data.frame_number},${data.license_plate_type},${data.engine_number}`;
      return await this.configCamera(imei, dataSend, userId, {
        data,
        type: "vehicle_info",
      });
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async configACC(imei, data, userId) {
    try {
      const dataSend = `$SHUTDOWN,${data.acc_off_delay},${data.acc_off_time},${data.sleep_mode},${data.sleep_time}`;
      return await this.configCamera(imei, dataSend, userId, {
        data,
        type: "acc",
      });
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async fatigueMode(imei, data, userId) {
    try {
      const dataSend = `$FATIGUE,${data.active},${data.warning_horn},${data.voice_sound},${data.active_io},${data.warning_time_before},${data.warning_time},${data.warning_night_before},${data.warning_night}`;
      return await this.configCamera(imei, dataSend, userId, {
        data,
        type: "fatigue_mode",
      });
    } catch (error) {
      console.log(error);

      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async overSpeed(imei, data, userId) {
    try {
      const dataSend = `$OVERSPEED,${data.active},${data.warning_horn},${data.voice_sound},${data.active_io},${data.early_warning},${data.warning_duration_1},${data.warning_speed},${data.warning_duration_2}`;
      return await this.configCamera(imei, dataSend, userId, {
        data,
        type: "over_speed",
      });
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async configMirror(imei, data, userId) {
    try {
      const formattedData = Object.entries(data)
        .map(([key, value]) => {
          try {
            const [a, b, c] = JSON.parse(value);
            return `${key}*${a}*${b}*${c}`;
          } catch {
            throw {
              msg: VALIDATE_DATA,
            };
          }
        })
        .join(",");

      const dataSend = `$MIRROR,${formattedData}`;
      return await this.configCamera(imei, dataSend, userId, {
        data,
        type: "mirror",
      });
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }
}

module.exports = new CMSService();
