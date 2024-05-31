const DatabaseService = require("../services/query.service");
const db = require("../dbs/init.mysql");
const ModuleModel = require("../models/module.model");
const { BusinessLogicError } = require("../core/error.response");
const tableName = "tbl_module";

class ModuleService extends DatabaseService {
  constructor() {
    super();
  }
  async getTree(query) {
    try {
      const isDeleted = query.is_deleted || 0;
      const where = `parent_id = ? AND publish = ? AND is_deleted = ?`;
      const conditions = [0, 1, isDeleted];
      const whereDequy = `AND publish = 1 AND is_deleted = ${isDeleted}`;

      const { conn } = await db.getConnection();
      const res_ = await this.createTreeMenu(
        conn,
        tableName,
        "*",
        where,
        conditions,
        "sort",
        "ASC",
        0,
        10000,
        "*",
        whereDequy,
        "sort",
        "ASC"
      );
      conn.release();
      return res_;
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //getallrow
  async getallrows(query) {
    try {
      const isDeleted = query.is_deleted || 0;
      const where = `parent_id = ? AND is_deleted = ?`;
      const conditions = [0, isDeleted];
      const whereDequy = `AND is_deleted = ${isDeleted}`;

      const { conn } = await db.getConnection();
      const res_ = await this.getAllRowsMenu(
        conn,
        tableName,
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
      conn.release();
      return res_;
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
      const selectData = `id,parent_id,name,link,component,publish,icon,sort,created_at`;

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
      const { parent_id, name, link, component, icon, publish } = body;
      // console.log(req.body);
      const module = new ModuleModel({
        parent_id: parent_id === "" ? 0 : parent_id,
        name,
        link: link ? link : null,
        component: component ? component : null,
        icon: icon ? icon : null,
        publish,
        sort: 0,
        is_deleted: 0,
        created_at: Date.now(),
      });
      delete module.updated_at;

      const { conn } = await db.getConnection();
      const res_ = await this.insert(conn, tableName, module);
      conn.release();
      module.id = res_;
      delete module.is_deleted;
      return module;
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  //update
  async updateById(body, params) {
    try {
      const { parent_id, name, link, component, icon, publish } = body;
      // , agent
      const { id } = params;
      const module = new ModuleModel({
        parent_id: parent_id === "" ? null : parent_id,
        name,
        link: link ? link : null,
        component: component ? component : null,
        icon: icon ? icon : null,
        publish,

        updated_at: Date.now(),
      });
      // console.log(id)
      // console.log(module)
      delete module.created_at;
      delete module.sort;
      delete module.is_deleted;

      const { conn } = await db.getConnection();
      await this.update(conn, tableName, module, "id", id);
      conn.release();
      module.id = id;
      return module;
    } catch (error) {
      throw new BusinessLogicError(error.msg);
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

  //sort
  async updateSort(body, params) {
    try {
      const { id } = params;
      const { sort } = body;

      const { conn } = await db.getConnection();
      await this.update(conn, tableName, { sort }, "id", id);
      return [];
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }
}

module.exports = new ModuleService();
