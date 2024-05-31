const DatabaseService = require("./query.service");
const db = require("../dbs/init.mysql");
const ServicePackageModel = require("../models/servicePackage.model");
const { ERROR, ALREADY_EXITS } = require("../constants");
const { BusinessLogicError } = require("../core/error.response");
const tableName = "tbl_service_package";

class ServicePackageService extends DatabaseService {
  constructor() {
    super();
  }

  async validate(conn, code, name, id = null) {
    let where = `(code = ? OR name = ?) AND is_deleted = ?`;
    const conditions = [code, name, 0];

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
      const errors = dataCheck.map((item) => {
        if (item.code === code) {
          return {
            value: code,
            msg: `Mã gói ${ALREADY_EXITS}`,
            param: "code",
          };
        } else if (item.name === name) {
          return {
            value: name,
            msg: `Tên gói ${ALREADY_EXITS}`,
            param: "name",
          };
        }
      });
      return {
        result: false,
        errors: {
          msg: ERROR,
          errors,
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
      let where = `is_deleted = ?`;
      const conditions = [isDeleted];

      if (query.keyword) {
        where += ` AND (code LIKE ? OR name LIKE ? OR fees_to_customer LIKE ?)`;
        conditions.push(
          `%${query.keyword}%`,
          `%${query.keyword}%`,
          `%${query.keyword}%`
        );
      }

      if (query.publish) {
        where += ` AND publish = ?`;
        conditions.push(query.publish);
      }

      const select = `id, code,name,fees_to_customer,fees_to_agency,fees_to_distributor,one_month_fee_to_customer
      ,one_month_fee_to_agency,one_month_fee_to_distributor,times,publish,note,created_at,updated_at`;

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
      const selectData = `id, code,name,fees_to_customer,fees_to_agency,fees_to_distributor,one_month_fee_to_customer
      ,one_month_fee_to_agency,one_month_fee_to_distributor,times,publish,note`;

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
      const {
        code,
        name,
        fees_to_customer,
        fees_to_agency,
        fees_to_distributor,
        one_month_fee_to_customer,
        one_month_fee_to_agency,
        one_month_fee_to_distributor,
        times,
        publish,
        note,
      } = body;
      const servicePackage = new ServicePackageModel({
        code,
        name,
        fees_to_customer,
        fees_to_agency: fees_to_agency || null,
        fees_to_distributor: fees_to_distributor || null,
        one_month_fee_to_customer: one_month_fee_to_customer || null,
        one_month_fee_to_agency: one_month_fee_to_agency || null,
        one_month_fee_to_distributor: one_month_fee_to_distributor || null,
        times,
        publish,
        note,
        is_deleted: 0,
        created_at: Date.now(),
      });
      delete servicePackage.updated_at;

      const { conn } = await db.getConnection();
      const isCheck = await this.validate(conn, name);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }
      const res_ = await this.insert(conn, tableName, servicePackage);
      conn.release();
      servicePackage.id = res_;
      delete servicePackage.is_deleted;
      return servicePackage;
    } catch (error) {
      const { msg, errors } = error;
      throw new BusinessLogicError(msg, errors);
    }
  }

  //update
  async updateById(body, params) {
    try {
      const {
        code,
        name,
        fees_to_customer,
        fees_to_agency,
        fees_to_distributor,
        one_month_fee_to_customer,
        one_month_fee_to_agency,
        one_month_fee_to_distributor,
        times,
        publish,
        note,
      } = body;
      const { id } = params;

      const { conn } = await db.getConnection();

      const isCheck = await this.validate(conn, name, id);
      if (!isCheck.result) {
        conn.release();
        throw isCheck.errors;
      }

      const servicePackage = new ServicePackageModel({
        code,
        name,
        fees_to_customer,
        fees_to_agency: fees_to_agency || null,
        fees_to_distributor: fees_to_distributor || null,
        one_month_fee_to_customer: one_month_fee_to_customer || null,
        one_month_fee_to_agency: one_month_fee_to_agency || null,
        one_month_fee_to_distributor: one_month_fee_to_distributor || null,
        times,
        publish,
        note,
        updated_at: Date.now(),
      });
      // console.log(id)
      delete servicePackage.created_at;
      delete servicePackage.is_deleted;

      await this.update(conn, tableName, servicePackage, "id", id);
      conn.release();
      servicePackage.id = id;
      return servicePackage;
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

module.exports = new ServicePackageService();
