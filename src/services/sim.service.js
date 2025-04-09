const db = require("../dbs/init.mysql");
const { ERROR, ALREADY_EXITS } = require("../constants/msg.constant");
const { BusinessLogicError } = require("../core/error.response");
const DatabaseModel = require("../models/database.model");
const { tableSim } = require("../constants/tableName.constant");
const safeJsonParse = require("../utils/json.util");
const simModel = require("../models/sim.model");
const { note } = require("../constants/property.constant");

const databaseModel = new DatabaseModel();

class SimService {
  async validate(
    conn,
    listSeriDisplay = [],
    ListSeriSim = [],
    listPhone = [],
    id = null
  ) {
    let where = `(seri_display IN (?) OR seri_sim IN (?) OR phone IN (?))`;
    const conditions = [listSeriDisplay, ListSeriSim, listPhone];

    if (id) {
      where += ` AND id <> ?`;
      conditions.push(id);
    }

    const dataCheck = await databaseModel.select(
      conn,
      tableSim,
      "seri_display,seri_sim,phone",
      `${where} AND is_deleted = 0`,
      conditions
    );
    if (dataCheck.length <= 0) return [];
    // console.log("dataCheck", dataCheck);

    const listSeriDisplayExit = [];
    const listSeriSimExist = [];
    const listPhoneExist = [];

    for (let i = 0; i < dataCheck.length; i++) {
      const { seri_display, seri_sim, phone } = dataCheck[i];
      if (listSeriDisplay.includes(seri_display)) {
        listSeriDisplayExit.push(seri_display);
      } else if (ListSeriSim.includes(seri_sim)) {
        listSeriSimExist.push(seri_sim);
      } else if (listPhone.includes(phone)) {
        listPhoneExist.push(phone);
      }
    }

    const errors = [];

    if (listSeriDisplayExit?.length) {
      errors.push({
        value: listSeriDisplayExit.join(","),
        msg: `Seri hiển thị ${ALREADY_EXITS}`,
        param: "seri_display",
      });
    }

    if (listSeriSimExist?.length) {
      errors.push({
        value: listSeriSimExist.join(","),
        msg: `Seri sim ${ALREADY_EXITS}`,
        param: "seri_sim",
      });
    }

    if (listPhoneExist?.length) {
      errors.push({
        value: listPhoneExist.join(","),
        msg: `Số điện thoại ${ALREADY_EXITS}`,
        param: "phone",
      });
    }

    throw {
      msg: ERROR,
      errors,
    };
  }

  //getallrow
  async getallrows(query) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await simModel.getallrows(conn, query);
        return data;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);
      throw new BusinessLogicError(error.msg);
    }
  }

  //getbyid
  async getById(params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const data = await simModel.getById(conn, params);
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
  async register(body) {
    try {
      const { conn } = await db.getConnection();
      try {
        const {
          seri_display,
          seri_sim,
          phone,
          type_id,
          price,
          status_id,
          activation_date,
          // expired_date,
          note,
        } = body;

        const listSeriDisplay = safeJsonParse(seri_display || "[]");
        const listSeriSim = safeJsonParse(seri_sim || "[]");
        const listPhone = safeJsonParse(phone || "[]");
        const listTypeId = safeJsonParse(type_id || "[]");
        const listPrice = safeJsonParse(price || "[]");
        const listStatus = safeJsonParse(status_id || "[]");
        const listActivationDate = safeJsonParse(activation_date || "[]");
        // const listExpired = safeJsonParse(expired_date || "[]");
        const listNote = safeJsonParse(note || "[]");

        if (
          listSeriDisplay.length !== listSeriSim.length ||
          listSeriDisplay.length !== listTypeId.length ||
          listSeriDisplay.length !== listPrice.length ||
          listSeriDisplay.length !== listStatus.length ||
          listSeriDisplay.length !== listActivationDate.length ||
          // listSeriDisplay.length !== listExpired.length ||
          listSeriDisplay.length !== listPhone.length ||
          listSeriDisplay.length !== listNote.length
        )
          throw {
            msg: ERROR,
            errors: [
              {
                value: listSeriDisplay.length,
                msg: `Số lượng dữ liệu không khớp nhau`,
                param: "seri_display",
              },
            ],
          };

        await this.validate(conn, listSeriDisplay, listSeriSim, listPhone);

        const sim = await simModel.register(
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
        );
        return sim;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log(error);

      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //update
  async updateById(body, params) {
    try {
      const { conn } = await db.getConnection();
      try {
        const { seri_display, seri_sim, phone } = body;
        const { id } = params;

        await this.validate(conn, seri_display, seri_sim, phone, id);

        const sim = await simModel.updateById(conn, body, params);
        return sim;
      } catch (error) {
        throw error;
      } finally {
        conn.release();
      }
    } catch (error) {
      console.log("error", error);
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //delete
  async deleteById(params) {
    try {
      const { conn } = await db.getConnection();
      try {
        await simModel.deleteById(conn, params);
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

module.exports = new SimService();
