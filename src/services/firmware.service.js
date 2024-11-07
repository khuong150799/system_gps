const db = require("../dbs/init.mysql");
const firmwareModel = require("../models/firmware.model");
const { BusinessLogicError } = require("../core/error.response");
const validateModel = require("../models/validate.model");
const { tableFrmware } = require("../constants/tableName.constant");
const filesService = require("./files.service");
const filesApi = require("../api/files.api");
const { NOT_EMPTY, ERROR } = require("../constants/msg.constant");
// const { existsSync, unlinkSync } = require("node:fs");

class FirmwareService {
  async handleFirmware(firmwareFile, noteFile, publish) {
    const arrPromiseSaveFiles = [];
    if (firmwareFile) {
      arrPromiseSaveFiles.push(
        filesService.saveFirmware(
          firmwareFile,
          1,
          publish == 1 ? "release" : "debug"
        )
      );
    }
    if (noteFile) {
      arrPromiseSaveFiles.push(filesService.saveFirmware(noteFile, 1, "note"));
    }
    let dataPath = { firmware: null, note: null };
    if (arrPromiseSaveFiles.length) {
      const result = await Promise.all(arrPromiseSaveFiles);

      dataPath.firmware = result[0]?.[0]?.includes(".bin")
        ? result[0]?.[0]
        : result[1]?.[0]?.includes(".bin")
        ? result[1]?.[0]
        : null;
      dataPath.note = result[0]?.[0]?.includes(".txt")
        ? result[0]?.[0]
        : result[1]?.[0]?.includes(".txt")
        ? result[1]?.[0]
        : null;
      return dataPath;
    }
    return dataPath;
  }
  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await firmwareModel.getallrows(conn, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await firmwareModel.getById(conn, params, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //Register
  async register(body, fileFirmware, fileNote) {
    try {
      const { conn } = await db.getConnection();
      const listPath = [];
      try {
        const { name, publish, file_note } = body;

        if (!fileFirmware)
          throw {
            msg: ERROR,
            errors: [
              { msg: NOT_EMPTY, value: fileFirmware, param: "firmware" },
            ],
          };

        await validateModel.checkExitValue(
          conn,
          tableFrmware,
          "name",
          name,
          "Tên",
          "name"
        );

        const { firmware: pathFirmware, note: pathFileNote } =
          await this.handleFirmware(fileFirmware, fileNote, publish);

        listPath.push(pathFirmware, pathFileNote);

        const firmware = await firmwareModel.register(
          conn,
          body,
          pathFirmware,
          pathFileNote
        );

        return firmware;
      } catch (error) {
        if (listPath.length) {
          await filesApi.delete({ path: JSON.stringify(listPath) });
        }
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //update
  async updateById(body, params, fileFirmware, fileNote) {
    try {
      const { conn, connPromise } = await db.getConnection();
      const listPath = [];
      try {
        const { name, publish, firmware } = body;
        const { id } = params;

        await validateModel.checkExitValue(
          conn,
          tableFrmware,
          "name",
          name,
          "Tên",
          "name",
          id
        );

        if (firmware) {
          const arrPathFirmwareOld = firmware.split("/");
          await filesApi.rename({
            pathOld: JSON.stringify([firmware]),
            pathNew: JSON.stringify([
              `${arrPathFirmwareOld[0]}/${publish == 1 ? "release" : "debug"}/${
                arrPathFirmwareOld[0]
              }`,
            ]),
          });
        }
        const { firmware: pathFirmware, note: pathFileNote } =
          await this.handleFirmware(fileFirmware, fileNote, publish);
        listPath.push(pathFirmware, pathFileNote);

        const data = await firmwareModel.updateById(
          conn,
          connPromise,
          body,
          params,
          listPath[0],
          listPath[1]
        );

        return data;
      } catch (error) {
        await connPromise.rollback();
        if (listPath.length) {
          await filesApi.delete({ path: JSON.stringify(listPath) });
        }
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //delete
  async deleteById(params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await firmwareModel.deleteById(conn, params);
        return [];
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new FirmwareService();
