const DatabaseModel = require("./database.model");
const { tableConfigTemperature } = require("../constants/tableName.constant");
const { hSet } = require("./redis.model");
const { REDIS_KEY_SENSOR_TEPM } = require("../constants/redis.constant");
const { ERROR } = require("../constants/msg.constant");
const ConfigTemperatureSchema = require("./schema/configTemperature.schema");

class ConfigTemperatureModel extends DatabaseModel {
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
    const selectData = `id,vehicle_id,device_id,activation_date,note`;

    const res_ = await this.select(
      conn,
      tableConfigTemperature,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, connPromise, body) {
    const { imei, vehicle_id, device_id, activation_date, note } = body;

    const configTemp = new ConfigTemperatureSchema({
      vehicle_id,
      device_id,
      note: note || null,
      activation_date: activation_date * 1000,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete configTemp.updated_at;

    await connPromise.beginTransaction();

    const res_ = await this.insert(conn, tableConfigTemperature, configTemp);
    const { result } = await hSet(
      REDIS_KEY_SENSOR_TEPM,
      imei.toString(),
      JSON.stringify({ device_sensor_temp_id: res_ })
    );

    if (!result) throw { msg: ERROR };
    await connPromise.commit();
    configTemp.id = res_;
    delete configTemp.is_deleted;
    return configTemp;
  }

  //update
  async updateById(conn, connPromise, body, params) {
    const { imei, vehicle_id, device_id, activation_date, note } = body;
    const { id } = params;

    const configTemp = new ConfigTemperatureSchema({
      vehicle_id,
      device_id,

      activation_date: activation_date * 1000,
      note,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete configTemp.created_at;
    delete configTemp.is_deleted;

    await connPromise.beginTransaction();

    await this.update(conn, tableConfigTemperature, configTemp, "id", id);
    const { result } = await hSet(
      REDIS_KEY_SENSOR_TEPM,
      imei.toString(),
      JSON.stringify({ device_sensor_temp_id: id })
    );

    if (!result) throw { msg: ERROR };
    await connPromise.commit();

    configTemp.id = id;
    return configTemp;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(
      conn,
      tableConfigTemperature,
      { is_deleted: 1 },
      "id",
      id
    );
    return [];
  }
}

module.exports = new ConfigTemperatureModel();
