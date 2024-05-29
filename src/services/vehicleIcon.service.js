const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const VehicleIconModel = require("../models/vehicleIcon.model");
const { ERROR, ALREADY_EXITS } = require("../constants");
const tableName = "tbl_vehicle_icon";

class VehicleIconService extends DatabaseService {
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
    if (dataCheck.length <= 0) return { result: true };

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

  //getallrow
  async getallrows(query) {
    try {
      const offset = query.offset || 0;
      const limit = query.limit || 10;
      const isDeleted = query.is_deleted || 0;
      let where = `is_deleted = ?`;
      const conditions = [isDeleted];

      if (query.keyword) {
        where += ` AND name LIKE ?`;
        conditions.push(`%${query.keyword}%`);
      }

      if (query.publish) {
        where += ` AND publish = ?`;
        conditions.push(query.publish);
      }

      const select = "id,name,publish,created_at,updated_at";
      const { conn } = await db.getConnection();
      const [res_, count] = await Promise.all([
        this.select(
          conn,
          tableName,
          select,
          where,
          conditions,
          "id",
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
      throw error;
    }
  }

  //getbyid
  async getById(params, query) {
    try {
      const { id } = params;
      const isDeleted = query.is_deleted || 0;
      const where = `is_deleted = ? AND id = ?`;
      const conditions = [isDeleted, id];
      const selectData = `id,name,note,publish`;

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
      throw error;
    }
  }

  //Register
  async register(body) {
    try {
      const { name, note, publish } = body;
      const verhicleIcon = new VehicleIconModel({
        name,
        note: note || null,
        publish,
        is_deleted: 0,
        created_at: Date.now(),
      });
      delete verhicleIcon.updated_at;

      const { conn } = await db.getConnection();
      const isCheck = await this.validate(conn, name);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }
      const res_ = await this.insert(conn, tableName, verhicleIcon);
      conn.release();
      verhicleIcon.id = res_;
      delete verhicleIcon.is_deleted;
      return verhicleIcon;
    } catch (error) {
      throw error;
    }
  }

  //update
  async updateById(body, params) {
    try {
      const { name, note, publish } = body;
      const { id } = params;

      const { conn } = await db.getConnection();

      const isCheck = await this.validate(conn, name, id);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const vehicleIcon = new VehicleIconModel({
        name,
        note: note || null,
        publish,
        updated_at: Date.now(),
      });
      // console.log(id)
      delete vehicleIcon.created_at;
      delete vehicleIcon.is_deleted;

      await this.update(conn, tableName, vehicleIcon, "id", id);
      conn.release();
      vehicleIcon.id = id;
      return vehicleIcon;
    } catch (error) {
      throw error;
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
      throw error;
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
      throw error;
    }
  }
}

module.exports = new VehicleIconService();
