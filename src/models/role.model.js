const DatabaseModel = require("./database.model");
const RoleSchema = require("./schema/role.schema");
const permissionModel = require("./permission.model");
const {
  tableRole,
  tableRolePermission,
  tablePermission,
} = require("../constants/tableName.constant");

class RoleModel extends DatabaseModel {
  constructor() {
    super();
  }

  //getallrow
  async getallrows(conn, query, role) {
    const offset = query.offset || 0;
    const limit = query.limit || 10;
    const isDeleted = query.is_deleted || 0;
    let where = `sort <= ? AND is_deleted = ?`;
    const conditions = [role, isDeleted];

    if (query.keyword) {
      where += ` AND name LIKE ?`;
      conditions.push(`%${query.keyword}%`);
    }

    if (query.publish) {
      where += ` AND publish = ?`;
      conditions.push(query.publish);
    }

    const select = "id,name,des,publish,sort,created_at,updated_at";
    const [res_, count] = await Promise.all([
      this.select(
        conn,
        tableRole,
        select,
        where,
        conditions,
        "sort",
        "ASC",
        offset,
        limit
      ),
      this.count(conn, tableRole, "*", where, conditions),
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
    const selectData = `id,name,des,publish`;

    const res_ = await this.select(
      conn,
      tableRole,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //getPermission
  async getPermission(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];

    const roleInfo = await this.select(
      conn,
      tableRole,
      "sort",
      where,
      conditions
    );
    if (!roleInfo || roleInfo?.length <= 0) return [];

    const role = roleInfo[0]?.sort || 0;

    const select = `${tablePermission}.id`;
    const joinTable = `${tableRole} INNER JOIN ${tableRolePermission} ON ${tableRole}.id = ${tableRolePermission}.role_id 
        INNER JOIN ${tablePermission} ON ${tableRolePermission}.permission_id = ${tablePermission}.id`;

    const res_ = await this.select(
      conn,
      joinTable,
      select,
      `${tableRole}.sort <= ? AND ${tablePermission}.is_deleted = ? AND ${tablePermission}.publish = ? AND ${tableRolePermission}.is_deleted = ?`,
      [role, isDeleted, 1, isDeleted],
      `${tablePermission}.id`,
      "DESC",
      0,
      10000
    );

    return res_;
  }

  //Register
  async register(conn, body) {
    const { name, des, publish } = body;
    const role = new RoleSchema({
      name,
      des: des || null,
      publish,
      sort: 0,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete role.updated_at;

    const res_ = await this.insert(conn, tableRole, role);
    role.id = res_;
    delete role.is_deleted;
    return role;
  }

  //Register permission
  async registerPermission(conn, body) {
    const { id, permissions } = body;

    const listPermissionId = JSON.parse(permissions);
    if (listPermissionId?.length <= 0) return [];
    const dataInsert = listPermissionId.map((item) => [
      id,
      item,
      0,
      Date.now(),
    ]);

    await this.insertDuplicate(
      conn,
      tableRolePermission,
      "role_id,permission_id,is_deleted,created_at",
      dataInsert,
      "role_id=VALUES(role_id),is_deleted=VALUES(is_deleted),created_at=VALUES(created_at)"
    );
    await permissionModel.init(conn);

    return [];
  }

  //update
  async updateById(conn, body, params) {
    const { name, des, publish } = body;
    const { id } = params;

    const role = new RoleSchema({
      name,
      des: des || null,
      publish,
      updated_at: Date.now(),
    });
    // console.log(id)
    delete role.created_at;
    delete role.sort;
    delete role.is_deleted;

    await this.update(conn, tableRole, role, "id", id);
    await permissionModel.init(conn);
    role.id = id;
    return role;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableRole, { is_deleted: 1 }, "id", id);
    await permissionModel.init(conn);
    return [];
  }

  //deletePermission
  async deletePermission(conn, body, params) {
    const { permissions } = body;
    const { id } = params;
    const listPermissionId = JSON.parse(permissions);

    const roleParent = await this.select(
      conn,
      tableRole,
      "id",
      `sort > (SELECT sort FROM ${tableRole} WHERE id = ?)`,
      id,
      "id",
      "ASC",
      0,
      1
    );

    console.log("listPermissionId", listPermissionId);
    console.log("roleParent", roleParent);
    if (roleParent?.length > 0) {
      await this.update(
        conn,
        tableRolePermission,
        { role_id: roleParent[0].id },
        "permission_id",
        listPermissionId
      );
    } else {
      await this.update(
        conn,
        tableRolePermission,
        { is_deleted: 1 },
        "permission_id",
        listPermissionId
      );
    }

    await permissionModel.init(conn);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;

    await this.update(conn, tableRole, { publish }, "id", id);
    await permissionModel.init(conn);
    return [];
  }

  //sort
  async updateSort(conn, body, params) {
    const { id } = params;
    const { sort } = body;

    await this.update(conn, tableRole, { sort }, "id", id);
    await permissionModel.init(conn);
    return [];
  }
}

module.exports = new RoleModel();
