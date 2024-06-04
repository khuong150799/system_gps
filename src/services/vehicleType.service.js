const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const VehicleTypeModel = require("../models/vehicleType.model");
const { ERROR, ALREADY_EXITS } = require("../constants");
const { BusinessLogicError } = require("../core/error.response");
const tableVehicleIcon = "tbl_vehicle_icon";
const tableName = "tbl_vehicle_type";

class VehicleTypeService extends DatabaseService {
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
      let where = `${tableName}.is_deleted = ?`;
      const conditions = [isDeleted];

      if (query.keyword) {
        where += ` AND ${tableName}.name LIKE ?`;
        conditions.push(`%${query.keyword}%`);
      }

      if (query.publish) {
        where += ` AND ${tableName}.publish = ?`;
        conditions.push(query.publish);
      }
      if (query.vehicle_icon_id) {
        where += ` AND ${tableName}.vehicle_icon_id = ?`;
        conditions.push(query.vehicle_icon_id);
      }
      const joinTable = `${tableName} INNER JOIN ${tableVehicleIcon} ON ${tableName}.vehicle_icon_id = ${tableVehicleIcon}.id`;

      const select = `${tableName}.id,${tableName}.name,${tableName}.max_speed,${tableName}.rule,${tableName}.publish,${tableName}.created_at,${tableName}.updated_at,${tableVehicleIcon}.name as vehicle_icon_name`;
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
        this.count(conn, joinTable, "*", where, conditions),
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
      const selectData = `id,name,vehicle_icon_id,max_speed,rule,publish`;

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
  async register(body) {
    try {
      const { name, vehicle_icon_id, max_speed, rule, publish } = body;
      const verhicleType = new VehicleTypeModel({
        name,
        vehicle_icon_id,
        max_speed,
        rule,
        publish,
        is_deleted: 0,
        created_at: Date.now(),
      });
      delete verhicleType.updated_at;

      const { conn } = await db.getConnection();
      const isCheck = await this.validate(conn, name);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }
      const res_ = await this.insert(conn, tableName, verhicleType);
      conn.release();
      verhicleType.id = res_;
      delete verhicleType.is_deleted;
      return verhicleType;
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //update
  async updateById(body, params) {
    try {
      const { name, vehicle_icon_id, max_speed, rule, publish } = body;
      const { id } = params;

      const { conn } = await db.getConnection();

      const isCheck = await this.validate(conn, name, id);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const vehicleType = new VehicleTypeModel({
        name,
        vehicle_icon_id,
        max_speed,
        rule,
        publish,
        updated_at: Date.now(),
      });
      // console.log(id)
      delete vehicleType.created_at;
      delete vehicleType.is_deleted;

      await this.update(conn, tableName, vehicleType, "id", id);
      conn.release();
      vehicleType.id = id;
      return vehicleType;
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

module.exports = new VehicleTypeService();
