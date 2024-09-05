const DatabaseModel = require("./database.model");

const { tableConfigFuel } = require("../constants/tableName.constant");
const { hSet } = require("./redis.model");
const { REDIS_KEY_CALIB_FUEL } = require("../constants/redis.constant");
const { ERROR } = require("../constants/msg.constant");
const ConfigFuelSchema = require("./schema/configFuel.schema");

class ConfigFuelModel extends DatabaseModel {
  constructor() {
    super();
  }

  //   //getallrow
  //   async getallrows(conn, query, role) {
  //     const offset = query.offset || 0;
  //     const limit = query.limit || 10;
  //     const isDeleted = query.is_deleted || 0;
  //     let where = `sort <= ? AND is_deleted = ?`;
  //     const conditions = [role, isDeleted];

  //     if (query.keyword) {
  //       where += ` AND name LIKE ?`;
  //       conditions.push(`%${query.keyword}%`);
  //     }

  //     if (query.publish) {
  //       where += ` AND publish = ?`;
  //       conditions.push(query.publish);
  //     }

  //     const select = "id,name,des,publish,sort,created_at,updated_at";
  //     const [res_, count] = await Promise.all([
  //       this.select(
  //         conn,
  //         tableRole,
  //         select,
  //         where,
  //         conditions,
  //         "sort",
  //         "ASC",
  //         offset,
  //         limit
  //       ),
  //       this.count(conn, tableRole, "*", where, conditions),
  //     ]);

  //     const totalPage = Math.ceil(count?.[0]?.total / limit);

  //     return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  //   }

  //getbyid
  async getById(conn, query) {
    const { vehicle_id, device_id, is_deleted } = query;

    const where = `vehicle_id = ? AND device_id = ? AND is_deleted = ?`;
    const conditions = [vehicle_id, device_id, is_deleted || 0];
    const selectData = `id,vehicle_id,device_id,total_volume,fuel_bottle_type_id,calib,note,activation_date`;

    const res_ = await this.select(
      conn,
      tableConfigFuel,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, connPromise, body) {
    const {
      imei,
      vehicle_id,
      device_id,
      fuel_bottle_type_id,
      total_volume,
      activation_date,
      calib,
      note,
    } = body;

    const configFuel = new ConfigFuelSchema({
      vehicle_id,
      device_id,
      fuel_bottle_type_id,
      total_volume,
      calib,
      note: note || null,
      activation_date: activation_date * 1000,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete configFuel.updated_at;

    await connPromise.beginTransaction();

    const res_ = await this.insert(conn, tableConfigFuel, configFuel);
    const { result } = await hSet(
      REDIS_KEY_CALIB_FUEL,
      imei.toString(),
      JSON.stringify({
        device_fuel_id: res_,
        calib: JSON.parse(calib),
        fuel_bottle_type_id,
        total_volume,
      })
    );

    if (!result) throw { msg: ERROR };
    await connPromise.commit();
    configFuel.id = res_;
    delete configFuel.is_deleted;
    return configFuel;
  }

  //update
  async updateById(conn, connPromise, body, params) {
    const {
      imei,
      vehicle_id,
      device_id,
      fuel_bottle_type_id,
      total_volume,
      calib,
      activation_date,
      note,
    } = body;
    const { id } = params;

    const configFuel = new ConfigFuelSchema({
      vehicle_id,
      device_id,
      fuel_bottle_type_id,
      total_volume,
      calib,
      activation_date: activation_date * 1000,
      note,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete configFuel.created_at;
    delete configFuel.is_deleted;

    await connPromise.beginTransaction();

    await this.update(conn, tableConfigFuel, configFuel, "id", id);
    const { result } = await hSet(
      REDIS_KEY_CALIB_FUEL,
      imei.toString(),
      JSON.stringify({
        device_fuel_id: id,
        calib: JSON.parse(calib),
        fuel_bottle_type_id,
        total_volume,
      })
    );

    if (!result) throw { msg: ERROR };
    await connPromise.commit();

    configFuel.id = id;
    return configFuel;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableConfigFuel, { is_deleted: 1 }, "id", id);
    return [];
  }
}

module.exports = new ConfigFuelModel();
