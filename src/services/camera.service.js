const cameraApi = require("../api/camera.api");
const { VALIDATE_DATA } = require("../constants/msg.constant");
const { BusinessLogicError } = require("../core/error.response");
const { db } = require("../dbs/init.mysql");
const cameraModel = require("../models/camera.model");

class CMSService {
  async configCamera(imei, data) {
    const { serCam } = await cameraModel.getServerCam(db, imei);
    const res_ = await cameraApi.config({
      url: serCam,
      imei,
      data,
    });
    if (res_?.result !== 0)
      throw { msg: res_?.message, errors: [{ value: dataSend }] };
    return res_;
  }

  async configVehicleInfo(imei, data) {
    try {
      const dataSend = `$BUS,${data?.dev_id},${imei},${data.vehicle_name},${data.color},${data.area_code},${data.manufacturer},${data.frame_number},${data.license_plate_type},${data.engine_number}`;
      return await this.configCamera(imei, dataSend);
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async configACC(imei, data) {
    try {
      const dataSend = `$SHUTDOWN,${data.acc_off_delay},${data.acc_off_time},${data.sleep_mode},${data.sleep_time}`;
      return await this.configCamera(imei, dataSend);
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async fatigueMode(imei, data) {
    try {
      const dataSend = `$FATIGUE,${data.active},${data.warning_horn},${data.voice_sound},${data.active_io},${data.warning_time_before},${data.warning_time},${data.warning_night_before},${data.warning_night}`;
      return await this.configCamera(imei, dataSend);
    } catch (error) {
      console.log(error);

      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async overSpeed(imei, data) {
    try {
      const dataSend = `$OVERSPEED,${data.active},${data.warning_horn},${data.voice_sound},${data.active_io},${data.early_warning},${data.warning_duration_1},${data.warning_speed},${data.warning_duration_2}`;
      return await this.configCamera(imei, dataSend);
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }

  async configMirror(imei, data) {
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
      return await this.configCamera(imei, dataSend);
    } catch (error) {
      throw new BusinessLogicError(error?.msg, error?.errors);
    }
  }
}

module.exports = new CMSService();
