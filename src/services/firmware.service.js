const db = require("../dbs/init.mysql");
const firmwareModel = require("../models/firmware.model");
const { ERROR, ALREADY_EXITS } = require("../constants");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const tableName = "tbl_firmware";
// const { existsSync, unlinkSync } = require("node:fs");

const databaseModel = new DatabaseModel();

class FirmwareService {
  async validate(conn, name, id = null) {
    let where = `name = ? AND is_deleted = ?`;
    const conditions = [name, 0];
    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await databaseModel.select(
      conn,
      tableName,
      "id",
      where,
      conditions
    );
    if (dataCheck.length > 0) {
      return {
        result: false,
        errors: {
          msg: ERROR,
          errors: [
            {
              value: name,
              msg: `Tên ${ALREADY_EXITS}`,
              param: "name",
            },
          ],
        },
      };
    }
    return { result: true };
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
  async register(body, files) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { name } = body;

        const isCheck = await this.validate(conn, name);
        if (!isCheck.result) {
          throw isCheck.errors;
        }
        const firmware = await firmwareModel.register(conn, body, files);

        return firmware;
      } catch (error) {
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
  async updateById(body, params, files) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const { name } = body;
        const { id } = params;

        const isCheck = await this.validate(conn, name, id);
        if (!isCheck.result) {
          throw isCheck.errors;
        }

        await connPromise.beginTransaction();

        const firmware = await firmwareModel.updateById(
          conn,
          connPromise,
          body,
          params,
          files
        );

        // if (pathFirmware || pathFileNote) {
        //   const dataOld = await this.select(
        //     conn,
        //     tableName,
        //     "path_version,path_note",
        //     "id = ? AND is_deleted = ?",
        //     [id, 0]
        //   );
        //   console.log(JSON.stringify(dataOld, null, 2));

        //   if (dataOld.length && pathFirmware) {
        //     if (existsSync(dataOld[0]?.path_version)) {
        //       unlinkSync(dataOld[0]?.path_version);
        //     }
        //   }
        //   if (dataOld.length && pathFileNote) {
        //     if (existsSync(dataOld[0]?.path_note)) {
        //       unlinkSync(dataOld[0]?.path_note);
        //     }
        //   }
        // }

        await connPromise.commit();

        return firmware;
      } catch (error) {
        await connPromise.rollback();
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

  //updatePublish
  async updatePublish(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await firmwareModel.updatePublish(conn, body, params);
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
