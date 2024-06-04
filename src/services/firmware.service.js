const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const FirmwareModel = require("../models/firmware.model");
const { ERROR, ALREADY_EXITS } = require("../constants");
const { BusinessLogicError } = require("../core/error.response");
const tableName = "tbl_firmware";
const tableModel = "tbl_model";
// const { existsSync, unlinkSync } = require("node:fs");

class FirmwareService extends DatabaseService {
  constructor() {
    super();
  }

  async validate(conn, name, id = null) {
    let where = `name = ? AND is_deleted = ?`;
    const conditions = [name, 0];
    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await this.select(
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
      const offset = query.offset || 0;
      const limit = query.limit || 10;
      const isDeleted = query.is_deleted || 0;
      let where = `${tableName}.is_deleted = ?`;
      const conditions = [isDeleted];

      if (query.keyword) {
        where += ` AND name LIKE ?`;
        conditions.push(`%${query.keyword}%`);
      }

      if (query.publish) {
        where += ` AND publish = ?`;
        conditions.push(query.publish);
      }
      if (query.model_id) {
        where += ` AND ${tableName}.model_id = ?`;
        conditions.push(query.model_id);
      }

      const joinTable = `${tableName} INNER JOIN ${tableModel} On ${tableName}.model_id = ${tableModel}.id`;

      const select = `${tableName}.id,${tableName}.name,${tableName}.version_software,${tableName}.version_hardware,${tableName}.checksum,${tableName}.path_version,${tableName}.path_note,${tableName}.note,${tableName}.publish,${tableName}.created_at,${tableName}.updated_at,${tableModel}.name as model_name`;
      const { conn } = await db.getConnection();
      const [res_, count] = await Promise.all([
        this.select(
          conn,
          joinTable,
          select,
          where,
          conditions,
          `${tableName}.id`,
          "DESC",
          offset,
          limit
        ),
        this.count(conn, tableName, "*", where, conditions),
      ]);

      const totalPage = Math.ceil(count?.[0]?.total / limit);

      conn.release();
      return { data: res_, totalPage };
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { id } = params;
      const isDeleted = query.is_deleted || 0;
      const where = `is_deleted = ? AND id = ?`;
      const conditions = [isDeleted, id];
      const selectData = `${tableName}.id,${tableName}.name,${tableName}.version_software,${tableName}.version_hardware,${tableName}.checksum,${tableName}.path_version,${tableName}.path_note,${tableName}.note,${tableName}.publish,${tableName}.model_id`;

      const { conn } = await db.getConnection();
      const res_ = await this.select(
        conn,
        tableName,
        selectData,
        where,
        conditions
      );
      conn.release();
      return res_;
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //Register
  async register(body, files) {
    try {
      const {
        name,
        model_id,
        version_hardware,
        version_software,
        path_version,
        checksum,
        note,
        publish,
      } = body;

      const { conn } = await db.getConnection();

      const isCheck = await this.validate(conn, name);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const pathFirmware = files?.["firmware"]?.[0]?.path;
      const pathFileNote = files?.["file_note"]?.[0]?.path;

      const firmware = new FirmwareModel({
        name,
        model_id,
        version_hardware,
        version_software,
        path_version: path_version || pathFirmware || null,
        checksum,
        note: note || null,
        path_note: pathFileNote || null,
        publish,
        is_deleted: 0,
        created_at: Date.now(),
      });
      delete firmware.updated_at;
      const res_ = await this.insert(conn, tableName, firmware);
      conn.release();
      firmware.id = res_;
      delete firmware.is_deleted;
      return firmware;
    } catch (error) {
      console.log(error);
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
    f;
  }

  //update
  async updateById(body, params, files) {
    try {
      const { conn, connPromise } = await db.getConnection();
      try {
        const {
          name,
          model_id,
          version_hardware,
          version_software,
          checksum,
          note,
          publish,
        } = body;
        const { id } = params;

        const isCheck = await this.validate(conn, name, id);
        if (!isCheck.result) {
          conn.release();
          throw isCheck.errors;
        }

        const pathFirmware = files?.["firmware"]?.[0]?.path;
        const pathFileNote = files?.["file_note"]?.[0]?.path;

        const firmware = new FirmwareModel({
          name,
          model_id,
          version_hardware,
          version_software,
          path_version: pathFirmware || null,
          checksum,
          note: note || null,
          path_note: pathFileNote || null,
          publish,
          is_deleted: 0,
          updated_at: Date.now(),
        });
        if (!pathFirmware) {
          delete firmware.path_version;
        }
        if (!pathFileNote) {
          delete firmware.path_note;
        }
        delete firmware.created_at;
        delete firmware.is_deleted;

        await connPromise.beginTransaction();

        await this.update(conn, tableName, firmware, "id", id);

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

        firmware.id = id;
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
      const { id } = params;
      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { is_deleted: 1 }, "id", id);
      conn.release();
      return [];
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //updatePublish
  async updatePublish(body, params) {
    try {
      const { id } = params;
      const { publish } = body;

      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { publish }, "id", id);
      conn.release();
      return [];
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new FirmwareService();
