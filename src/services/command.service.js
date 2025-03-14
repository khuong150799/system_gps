const { BusinessLogicError } = require("../core/error.response");

const {
  COMMAND_RESTART,
  UPDATE,
  COMMAND_PERIPHERAL,
  COMMAND_BUZZER_ALARM,
  COMMAND_SET_TEMPERATE_ENABLE,
  COMMAND_DRIVER_LOGIN,
  COMMAND_SET_DRIVING_BREAK_TIME,
} = require("../constants/command.constant");
const {
  SEND_COMMAND_FAIL,
  ERROR,
  VEHICLE_NOT_PERMISSION,
} = require("../constants/msg.constant");
const { getConnection } = require("../dbs/init.mysql");
const commandModel = require("../models/command.model");
const deviceApi = require("../api/device.api");
const deviceModel = require("../models/device.model");
const validateModel = require("../models/validate.model");

class CommandService {
  async getConfigByImei(imei, query, userId) {
    try {
      const { conn } = await getConnection();
      try {
        const data = await commandModel.getConfigByImei(
          conn,
          {
            imei,
            ...query,
          },
          userId
        );
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);

      throw new BusinessLogicError(error?.msg || "Có lỗi xảy ra");
    }
  }

  async sendCommand(conn, device_id, data, userId, callback) {
    const infoDevice = await validateModel.checkOwnerDevice(
      conn,
      userId,
      [device_id],
      VEHICLE_NOT_PERMISSION
    );

    const { imei } = infoDevice[0];

    const { result } = await deviceApi.command({
      data,
      imei,
    });
    // console.log("result", { result, message, status, data, options });
    if (!result) throw { msg: ERROR, errors: [{ msg: SEND_COMMAND_FAIL }] };

    if (callback) await callback();

    return null;
  }

  async restart(body, userId) {
    try {
      const { conn } = await getConnection();
      try {
        const { device_id } = body;
        const data = {
          type: UPDATE,
          id: COMMAND_RESTART,
          pr: null,
        };
        return await this.sendCommand(conn, device_id, data, userId);
      } catch (error) {
        console.log(error);
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error?.msg || ERROR);
    }
  }

  async peripheral(body, userId) {
    try {
      const { device_id, type, baudrate } = body;
      const data = {
        type: UPDATE,
        id: COMMAND_PERIPHERAL,
        pr: `${type},${baudrate}`,
      };
      const { conn } = await getConnection();
      try {
        return await this.sendCommand(
          conn,
          device_id,
          data,
          userId,
          async () => {
            await commandModel.add(conn, device_id, {
              config_name: "COMMAND_PERIPHERAL",
              value: { type, baudrate },
            });
          }
        );
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);

      throw new BusinessLogicError(error?.msg || "Có lỗi xảy ra");
    }
  }

  async buzzerAlarm(body, userId) {
    try {
      const { device_id, index, control } = body;

      const data = {
        type: UPDATE,
        id: COMMAND_BUZZER_ALARM,
        pr: `${index},${control}`,
      };
      const indexBinary = parseInt(index, 10)
        .toString(2)
        .split("")
        .reverse()
        .join("");

      const indexObject = {};
      for (let i = 0; i < indexBinary.length; i++) {
        indexObject[i] = indexBinary[i] == "1" ? `${control}` : 0;
      }

      const { conn } = await getConnection();
      try {
        return await this.sendCommand(
          conn,
          device_id,
          data,
          userId,
          async () => {
            await commandModel.add(conn, device_id, {
              config_name: "COMMAND_BUZZER_ALARM",
              value: { index, control },
              binary: indexObject,
            });
          }
        );
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error?.msg || "Có lỗi xảy ra");
    }
  }

  async setTemperateEnable(body, userId) {
    try {
      const { device_id, control } = body;
      const data = {
        type: UPDATE,
        id: COMMAND_SET_TEMPERATE_ENABLE,
        pr: control,
      };
      const { conn } = await getConnection();
      try {
        return await this.sendCommand(
          conn,
          device_id,
          data,
          userId,
          async () => {
            await commandModel.add(conn, device_id, {
              config_name: "COMMAND_SET_TEMPERATE_ENABLE",
              value: { control },
            });
          }
        );
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error?.msg || "Có lỗi xảy ra");
    }
  }

  async driverLogin(body, userId) {
    try {
      const { device_id, type, driver_id, name } = body;
      const data = {
        type: UPDATE,
        id: COMMAND_DRIVER_LOGIN,
        pr: `${type},${driver_id},${name}`,
      };
      const { conn } = await getConnection();
      try {
        return await this.sendCommand(
          conn,
          device_id,
          data,
          userId,
          async () => {
            await commandModel.add(conn, device_id, {
              config_name: "COMMAND_DRIVER_LOGIN",
              value: { type, driver_id, name },
            });
          }
        );
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error?.msg || "Có lỗi xảy ra");
    }
  }

  async setDrivingBreakTime(body, userId) {
    try {
      const { device_id, time } = body;
      const data = {
        type: UPDATE,
        id: COMMAND_SET_DRIVING_BREAK_TIME,
        pr: time,
      };
      const { conn } = await getConnection();
      try {
        return await this.sendCommand(
          conn,
          device_id,
          data,
          userId,
          async () => {
            await commandModel.add(conn, device_id, {
              config_name: "COMMAND_SET_DRIVING_BREAK_TIME",
              value: { time },
            });
          }
        );
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error?.msg || "Có lỗi xảy ra");
    }
  }
}

module.exports = new CommandService();
