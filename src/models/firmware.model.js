const { tableFirmware, tableModel } = require("../constants/tableName.contant");
const DatabaseModel = require("./database.model");

const FirmwareSchema = require("./schema/firmware.schema");

// const { existsSync, unlinkSync } = require("node:fs");

class FirmwareModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    let where = `${tableFirmware}.is_deleted = ?`;
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
      where += ` AND ${tableFirmware}.model_id = ?`;
      conditions.push(query.model_id);
    }

    const joinTable = `${tableFirmware} INNER JOIN ${tableModel} On ${tableFirmware}.model_id = ${tableModel}.id`;

    const select = `${tableFirmware}.id,${tableFirmware}.name,${tableFirmware}.version_software,${tableFirmware}.version_hardware,${tableFirmware}.checksum,${tableFirmware}.path_version,${tableFirmware}.path_note,${tableFirmware}.note,${tableFirmware}.publish,${tableFirmware}.created_at,${tableFirmware}.updated_at,${tableModel}.name as model_name`;
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        `${tableFirmware}.id`,
        "DESC",
        offset,
        limit
      ),
      this.count(conn, tableFirmware, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecaord: count?.[0]?.total };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `${tableFirmware}.id,${tableFirmware}.name,${tableFirmware}.version_software,${tableFirmware}.version_hardware,${tableFirmware}.checksum,${tableFirmware}.path_version,${tableFirmware}.path_note,${tableFirmware}.note,${tableFirmware}.publish,${tableFirmware}.model_id`;

    const res_ = await this.select(
      conn,
      tableFirmware,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body, files) {
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

    const pathFirmware = files?.["firmware"]?.[0]?.path;
    const pathFileNote = files?.["file_note"]?.[0]?.path;

    const firmware = new FirmwareSchema({
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
    const res_ = await this.insert(conn, tableFirmware, firmware);
    firmware.id = res_;
    delete firmware.is_deleted;
    return firmware;
  }

  //update
  async updateById(conn, connPromise, body, params, files) {
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

    const pathFirmware = files?.["firmware"]?.[0]?.path;
    const pathFileNote = files?.["file_note"]?.[0]?.path;

    const firmware = new FirmwareSchema({
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

    await this.update(conn, tableFirmware, firmware, "id", id);

    // if (pathFirmware || pathFileNote) {
    //   const dataOld = await this.select(
    //     conn,
    //     tableFirmware,
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
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableFirmware, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;
    await this.update(conn, tableFirmware, { publish }, "id", id);
    return [];
  }
}

module.exports = new FirmwareModel();
