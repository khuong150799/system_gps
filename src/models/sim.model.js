const DatabaseModel = require("./database.model");

const {
  tableDevice,
  tableDeviceInfo,
  tableSim,
  tableSimType,
  tableSimStatus,
} = require("../constants/tableName.constant");

const SimSchema = require("./schema/sim.schema");

class SimModel extends DatabaseModel {
  constructor() {
    super();
  }

  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;

    const {
      is_deleted,
      keyword,
      // start_expired_date,
      // end_expired_date,
      start_activation_date,
      end_activation_date,
    } = query;

    const isDeleted = is_deleted || 0;
    let where = "";
    const conditions = [];

    if (keyword) {
      where += `(s.seri_display LIKE ? OR s.seri_sim LIKE ? OR s.phone LIKE ? OR d.imei LIKE ?)`;
      conditions.push(
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`
      );
    }

    if (start_activation_date && end_activation_date) {
      where += ` AND s.activation_date BETWEEN ? AND ?`;
      conditions.push(start_activation_date, end_activation_date);
    }

    // if (start_expired_date && end_expired_date) {
    //   where += ` AND s.expired_date BETWEEN ? AND ?`;
    //   conditions.push(start_expired_date, end_expired_date);
    // }

    where = where ? where + " AND s.is_deleted = ?" : "s.is_deleted = ?";
    conditions.push(isDeleted, isDeleted);

    const joinTable = `${tableSim} s INNER JOIN ${tableSimType} st ON s.type_id = st.id
    INNER JOIN ${tableSimStatus} ss ON s.status_id = ss.id
    LEFT JOIN ${tableDeviceInfo} di ON s.seri_display = di.sid
    LEFT JOIN ${tableDevice} d ON di.imei = d.imei`;

    const select = `s.id,s.seri_display,s.seri_sim,s.phone,s.price,s.activation_date,st.name as type,ss.title as status,
      s.created_at,s.updated_at,d.id as device_id,d.imei`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        "s.id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  async getById(conn, params) {
    const { id } = params || {};

    const select = `id,seri_display,seri_sim,phone,price,activation_date,type_id,status_id,created_at,updated_at`;

    const where = `id = ? AND is_deleted = 0`;
    const conditions = [id];

    const data = await this.select(conn, tableSim, select, where, conditions);

    return data;
  }

  //Register
  async register(
    conn,
    listSeriDisplay,
    listSeriSim,
    listPhone,
    listTypeId,
    listPrice,
    listStatus,
    listActivationDate,
    // listExpired,
    listNote
  ) {
    const createdAt = Date.now();

    const dataInsert = [];

    for (let i = 0; i < listSeriDisplay.length; i++) {
      dataInsert.push([
        listSeriDisplay[i],
        listSeriSim[i],
        listPhone[i] || null,
        listTypeId[i],
        listPrice[i] || null,
        listStatus[i],
        listActivationDate[i] || null,
        // listExpired[i] || null,
        null,
        listNote[i] || null,
        0,
        createdAt,
      ]);
    }

    await this.insertMulti(
      conn,
      tableSim,
      `seri_display,
      seri_sim,
      phone,
      type_id,
      price,
      status_id,
      activation_date,
      expired_date,
      note,
      is_deleted,
      created_at`,
      dataInsert
    );

    return [];
  }

  //update
  async updateById(conn, body, params) {
    const {
      seri_display,
      seri_sim,
      phone,
      type_id,
      price,
      status_id,
      activation_date,
      expired_date,
      note,
    } = body;
    const { id } = params;

    const sim = new SimSchema({
      seri_display,
      seri_sim,
      phone,
      type_id,
      price,
      status_id,
      activation_date: activation_date || null,
      expired_date: expired_date || null,
      note,
      updated_at: Date.now(),
    });

    delete sim.is_deleted;
    delete sim.created_at;

    await this.update(conn, tableSim, sim, "id", id);

    sim.id = id;
    return sim;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;

    await this.update(conn, tableSim, { is_deleted: 1 }, "id", id);

    return [];
  }
}

module.exports = new SimModel();
