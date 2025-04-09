"use strict";

const { tableSim } = require("../../constants/tableName.constant");

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
const tableName = tableSim;
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.addIndex(tableName, "idx_uni_seri_display_seri_sim_tbl_sim", [
    "seri_display",
    "seri_sim",
    "is_deleted",
  ]);
};

exports.down = function (db) {
  return db.removeIndex(tableName, "idx_uni_seri_display_seri_sim_tbl_sim");
};

exports._meta = {
  version: 1,
};
