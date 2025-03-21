const {
  tableServicePackage,
  tableModelType,
} = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const ServicePackageSchema = require("./schema/servicePackage.schema");

class ServicePackageModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    let where = `sp.is_deleted = ?`;
    const conditions = [isDeleted];

    if (query.keyword) {
      where += ` AND (sp.name LIKE ? OR sp.fees_to_customer LIKE ? OR sp.fees_to_agency LIKE ? OR sp.fees_to_distributor LIKE ?)`;
      conditions.push(
        `%${query.keyword}%`,
        `%${query.keyword}%`,
        `%${query.keyword}%`,
        `%${query.keyword}%`
      );
    }

    if (query.publish) {
      where += ` AND sp.publish = ?`;
      conditions.push(query.publish);
    }

    if (query.model_type_id) {
      where += ` AND sp.model_type_id = ?`;
      conditions.push(query.model_type_id);
    }

    const select = `sp.id,sp.name,sp.fees_to_customer,sp.fees_to_agency,sp.fees_to_distributor,sp.one_month_fee_to_customer
    ,sp.one_month_fee_to_agency,sp.one_month_fee_to_distributor,sp.times,sp.publish,sp.is_require_transmission,sp.note,sp.created_at,sp.updated_at,mt.name as model_type_name`;

    const joinTable = `${tableServicePackage} sp LEFT JOIN ${tableModelType} mt ON sp.model_type_id = mt.id`;

    const [res_, count] = await Promise.all([
      this.select(
        conn,
        joinTable,
        select,
        where,
        conditions,
        "sp.id",
        "DESC",
        offset,
        limit
      ),
      this.count(conn, joinTable, "*", where, conditions),
    ]);

    const totalPage = Math.ceil(count?.[0]?.total / limit);

    return { data: res_, totalPage, totalRecord: count?.[0]?.total };
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `id, name,fees_to_customer,fees_to_agency,fees_to_distributor,one_month_fee_to_customer
      ,one_month_fee_to_agency,one_month_fee_to_distributor,times,publish,note,model_type_id,is_require_transmission`;

    const res_ = await this.select(
      conn,
      tableServicePackage,
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
      model_type_id,
      is_require_transmission,
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
      model_type_id,
      is_require_transmission,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete servicePackage.updated_at;

    const res_ = await this.insert(conn, tableServicePackage, servicePackage);
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
      model_type_id,
      is_require_transmission,
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
      model_type_id,
      is_require_transmission,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete servicePackage.created_at;
    delete servicePackage.is_deleted;

    await this.update(conn, tableServicePackage, servicePackage, "id", id);
    servicePackage.id = id;
    return servicePackage;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableServicePackage, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tableServicePackage, { publish }, "id", id);
    return [];
  }
}

module.exports = new ServicePackageModel();
