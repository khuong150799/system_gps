const DatabaseModel = require("./database.model");
const ServicePackageSchema = require("./schema/servicePackage.schema");

const tableName = "tbl_service_package";

class ServicePackageModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    let where = `is_deleted = ?`;
    const conditions = [isDeleted];

    if (query.keyword) {
      where += ` AND (name LIKE ? OR fees_to_customer LIKE ? OR fees_to_agency LIKE ? OR fees_to_distributor LIKE ?)`;
      conditions.push(
        `%${query.keyword}%`,
        `%${query.keyword}%`,
        `%${query.keyword}%`,
        `%${query.keyword}%`
      );
    }

    if (query.publish) {
      where += ` AND publish = ?`;
      conditions.push(query.publish);
    }

    const select = `id, name,fees_to_customer,fees_to_agency,fees_to_distributor,one_month_fee_to_customer
    ,one_month_fee_to_agency,one_month_fee_to_distributor,times,publish,note,created_at,updated_at`;

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

    return { data: res_, totalPage };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `id, name,fees_to_customer,fees_to_agency,fees_to_distributor,one_month_fee_to_customer
      ,one_month_fee_to_agency,one_month_fee_to_distributor,times,publish,note`;

    const res_ = await this.select(
      conn,
      tableName,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const {
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
    const servicePackage = new ServicePackageSchema({
      name,
      fees_to_customer,
      fees_to_agency,
      fees_to_distributor,
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

    const res_ = await this.insert(conn, tableName, servicePackage);
    servicePackage.id = res_;
    delete servicePackage.is_deleted;
    return servicePackage;
  }

  //update
  async updateById(conn, body, params) {
    const {
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

    const servicePackage = new ServicePackageSchema({
      name,
      fees_to_customer,
      fees_to_agency,
      fees_to_distributor,
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
    servicePackage.id = id;
    return servicePackage;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableName, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tableName, { publish }, "id", id);
    return [];
  }
}

module.exports = new ServicePackageModel();
