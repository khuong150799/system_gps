const {
  tableModule,
  tableLevelModule,
  tableLevel,
} = require("../constants/tableName.constant");
const DatabaseModel = require("./database.model");
const ModuleSchema = require("./schema/module.schema");

class ModuleModel extends DatabaseModel {
  constructor() {
    super();
  }
  async getTree(conn, connPromise, query, level, userId) {
    const isDeleted = query.is_deleted || 0;

    const joinTable = `${tableModule} m INNER JOIN ${tableLevelModule} lm ON m.id = lm.module_id 
    INNER JOIN ${tableLevel} l ON lm.level_id = l.id`;
    let where = `m.parent_id = ? AND m.publish = ? AND m.is_deleted = ? AND l.sort <= ? AND m.publish = ? AND l.is_deleted = ? AND lm.is_deleted = ?`;
    const conditions = [0, 1, isDeleted, level, 1, isDeleted, isDeleted];
    const whereDequy = `AND m.publish = ? AND m.is_deleted = ? AND l.sort <= ? AND m.publish = ? AND l.is_deleted = ? AND lm.is_deleted = ?`;
    const conditionsDequy = [1, isDeleted, level, 1, isDeleted, isDeleted];

    if (userId == -10) {
      where = `m.id = ? AND ${where}`;
      conditions.unshift(150);
    } else {
      where = `m.id <> ? AND ${where}`;
      conditions.unshift(150);
    }

    const select = `m.id,m.parent_id,m.name,m.link,m.icon,m.type`;

    const res_ = await this.createTreeMenu(
      connPromise,
      conn,
      joinTable,
      select,
      where,
      conditions,
      `m.sort`,
      "ASC",
      0,
      10000,
      select,
      whereDequy,
      conditionsDequy,
      `m.sort`,
      "ASC"
    );
    return res_;
  }

  //getallrow
  async getallrows(conn, query) {
    const isDeleted = query.is_deleted || 0;
    const where = `parent_id = ? AND is_deleted = ?`;
    const conditions = [0, isDeleted];
    const whereDequy = `AND is_deleted = ${isDeleted}`;

    const res_ = await this.getAllRowsMenu(
      conn,
      tableModule,
      "*",
      where,
      conditions,
      "sort",
      "ASC",
      "*",
      whereDequy,
      "sort",
      "ASC"
    );
    return res_;
  }

  //getbyid
  async getById(conn, params, query) {
    const { id } = params;
    const isDeleted = query.is_deleted || 0;
    const where = `is_deleted = ? AND id = ?`;
    const conditions = [isDeleted, id];
    const selectData = `id,parent_id,name,link,component,publish,icon,sort,type,created_at`;

    const res_ = await this.select(
      conn,
      tableModule,
      selectData,
      where,
      conditions
    );
    return res_;
  }

  //Register
  async register(conn, body) {
    const { parent_id, name, link, component, type, icon, publish } = body;
    // console.log(req.body);
    const module = new ModuleSchema({
      parent_id: parent_id === "" ? 0 : parent_id,
      name,
      link: link ? link : null,
      component: component ? component : null,
      icon: icon ? icon : null,
      type: type || null,
      publish,
      sort: 0,
      is_deleted: 0,
      created_at: Date.now(),
    });
    delete module.updated_at;

    const res_ = await this.insert(conn, tableModule, module);
    module.id = res_;
    delete module.is_deleted;
    return module;
  }

  //update
  async updateById(conn, body, params) {
    const { parent_id, name, link, component, icon, type, publish } = body;
    // , agent
    const { id } = params;
    const module = new ModuleSchema({
      parent_id: parent_id === "" ? null : parent_id,
      name,
      link: link ? link : null,
      component: component ? component : null,
      icon: icon ? icon : null,
      type,
      publish,

      updated_at: Date.now(),
    });
    // console.log(id)
    // console.log(module)
    delete module.created_at;
    delete module.sort;
    delete module.is_deleted;

    await this.update(conn, tableModule, module, "id", id);
    module.id = id;
    return module;
  }

  //delete
  async deleteById(conn, params) {
    const { id } = params;
    await this.update(conn, tableModule, { is_deleted: 1 }, "id", id);
    return [];
  }

  //updatePublish
  async updatePublish(conn, body, params) {
    const { id } = params;
    const { publish } = body;
    await this.update(conn, tableModule, { publish }, "id", id);
    return [];
  }

  //sort
  async updateSort(conn, body, params) {
    const { id } = params;
    const { sort } = body;

    await this.update(conn, tableModule, { sort }, "id", id);
    return [];
  }
}

module.exports = new ModuleModel();
